import { bitable, FieldType, ToastType } from '@lark-base-open/js-sdk';
import type { IFieldMeta } from '@lark-base-open/js-sdk';
import { computed, ref } from 'vue';
import type { IFieldMetaSettings, IPrintRow, IPrintTemplate } from '../types';

const SETTING_KEY = 'production_schedule_print_setting_v1';
const TEMPLATE_KEY = 'multi_print_templates_v1';
const DEFAULT_FIELDS = new Set(['单号', '产品', '数量', '交期', '生产安排', '已包装数量']);

const usePrint = () => {
  const fieldList = ref<IFieldMeta[]>([]);
  const rows = ref<IPrintRow[]>([]);
  const isSettingPanelShow = ref(false);
  const settingList = ref<IFieldMetaSettings[]>([]);
  const loading = ref(false);
  const printScope = ref<'visible' | 'selected'>('visible');
  const printTitle = ref('生产排期');
  const orientation = ref<'portrait' | 'landscape'>('portrait');
  const templates = ref<IPrintTemplate[]>([]);
  const selectedTemplateId = ref('production_schedule');
  const visibleSettings = computed(() => settingList.value.filter(item => !item.hidden));

  const getSettingList = async () => {
    const data = await bitable.bridge.getData<IFieldMetaSettings[]>(SETTING_KEY);
    const cached = Array.isArray(data)
      ? new Map(data.map(item => [item.fieldId, item]))
      : new Map<string, IFieldMetaSettings>();
    const existing = fieldList.value.map(field => cached.get(field.id) || {
      fieldId: field.id,
      name: field.name,
      hidden: !DEFAULT_FIELDS.has(field.name),
    });
    const existingIds = new Set(existing.map(item => item.fieldId));
    const ordered = Array.isArray(data)
      ? data.filter(item => existingIds.has(item.fieldId)).map(item => existing.find(value => value.fieldId === item.fieldId)!)
      : [];
    const orderedIds = new Set(ordered.map(item => item.fieldId));
    settingList.value = [...ordered, ...existing.filter(item => !orderedIds.has(item.fieldId))];
  };

  const loadCurrentView = async () => {
    loading.value = true;
    try {
      const table = await bitable.base.getActiveTable();
      const view = await table.getActiveView();
      const selectableView = view as typeof view & { getSelectedRecordIdList: () => Promise<string[]> };
      const recordIds = printScope.value === 'selected'
        ? await selectableView.getSelectedRecordIdList()
        : (await view.getVisibleRecordIdList()).filter(Boolean) as string[];
      if (printScope.value === 'selected' && !recordIds.length) {
        rows.value = [];
        bitable.ui.showToast({ toastType: ToastType.warning, message: '请先在多维表格中选择要打印的记录' });
        return;
      }
      const metaMap = new Map(fieldList.value.map(field => [field.id, field]));
      rows.value = await Promise.all(recordIds.map(async (recordId: string) => {
        const values: IPrintRow['values'] = {};
        await Promise.all(visibleSettings.value.map(async field => {
          const meta = metaMap.get(field.fieldId);
          if (meta?.type === FieldType.Attachment) {
            const raw = await table.getCellValue(field.fieldId, recordId);
            const tokens = Array.isArray(raw) ? raw.map(item => (item as { token?: string }).token).filter(Boolean) as string[] : [];
            const images = tokens.length
              ? await table.getCellAttachmentUrls(tokens, field.fieldId, recordId)
              : [];
            values[field.fieldId] = { text: '', images };
          } else {
            values[field.fieldId] = { text: await table.getCellString(field.fieldId, recordId) };
          }
        }));
        return { recordId, values };
      }));
    } finally {
      loading.value = false;
    }
  };

  const init = async () => {
    loading.value = true;
    try {
      const table = await bitable.base.getActiveTable();
      const view = await table.getActiveView();
      const allFields = await table.getFieldMetaList();
      const visibleFieldIds = await view.getVisibleFieldIdList();
      const fieldMap = new Map(allFields.map(field => [field.id, field]));
      fieldList.value = visibleFieldIds.map(id => fieldMap.get(id)).filter(Boolean) as IFieldMeta[];
      await getSettingList();
      const savedTemplates = await bitable.bridge.getData<IPrintTemplate[]>(TEMPLATE_KEY);
      templates.value = Array.isArray(savedTemplates) ? savedTemplates : [];
      await loadCurrentView();
    } finally {
      loading.value = false;
    }
  };

  const handleSettingListUpdate = async (list: IFieldMetaSettings[]) => {
    settingList.value = list;
    const result = await bitable.bridge.setData(SETTING_KEY, list);
    bitable.ui.showToast({
      toastType: result ? ToastType.success : ToastType.error,
      message: result ? '打印字段设置已保存' : '打印字段设置保存失败',
    });
    await loadCurrentView();
  };

  const applyTemplate = async (templateId: string) => {
    selectedTemplateId.value = templateId;
    if (templateId === 'production_schedule') {
      printTitle.value = '生产排期';
      orientation.value = 'portrait';
      settingList.value = fieldList.value.map(field => ({
        fieldId: field.id,
        name: field.name,
        hidden: !DEFAULT_FIELDS.has(field.name),
      }));
    } else {
      const template = templates.value.find(item => item.id === templateId);
      if (!template) return;
      printTitle.value = template.title;
      orientation.value = template.orientation;
      const currentMap = new Map(fieldList.value.map(field => [field.id, field]));
      const restored = template.fields
        .filter(item => currentMap.has(item.fieldId))
        .map(item => ({ ...item, name: currentMap.get(item.fieldId)!.name }));
      const restoredIds = new Set(restored.map(item => item.fieldId));
      settingList.value = [
        ...restored,
        ...fieldList.value.filter(field => !restoredIds.has(field.id)).map(field => ({
          fieldId: field.id, name: field.name, hidden: true,
        })),
      ];
    }
    await loadCurrentView();
  };

  const saveTemplate = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return false;
    const template: IPrintTemplate = {
      id: `template_${Date.now()}`,
      name: cleanName,
      title: printTitle.value || cleanName,
      orientation: orientation.value,
      fields: settingList.value.map(item => ({ ...item })),
    };
    templates.value = [...templates.value, template];
    const result = await bitable.bridge.setData(TEMPLATE_KEY, templates.value);
    if (result) selectedTemplateId.value = template.id;
    bitable.ui.showToast({
      toastType: result ? ToastType.success : ToastType.error,
      message: result ? `模板“${cleanName}”已保存` : '模板保存失败',
    });
    return result;
  };

  const deleteTemplate = async () => {
    if (selectedTemplateId.value === 'production_schedule') return false;
    templates.value = templates.value.filter(item => item.id !== selectedTemplateId.value);
    const result = await bitable.bridge.setData(TEMPLATE_KEY, templates.value);
    if (result) await applyTemplate('production_schedule');
    return result;
  };

  return {
    rows,
    loading,
    printScope,
    printTitle,
    orientation,
    templates,
    selectedTemplateId,
    visibleSettings,
    isSettingPanelShow,
    settingList,
    init,
    loadCurrentView,
    handlePrint: () => window.print(),
    handleSetting: () => { isSettingPanelShow.value = true; },
    handleSettingListUpdate,
    applyTemplate,
    saveTemplate,
    deleteTemplate,
  };
};

export default usePrint;
