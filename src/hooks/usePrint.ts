import { bitable, FieldType, ToastType } from '@lark-base-open/js-sdk';
import type { IFieldMeta } from '@lark-base-open/js-sdk';
import { computed, ref } from 'vue';
import type { IFieldMetaSettings, IPrintRow, IPrintTemplate } from '../types';

const TEMPLATE_KEY = 'easy_print_templates_v2';

const usePrint = () => {
  const fieldList = ref<IFieldMeta[]>([]);
  const rows = ref<IPrintRow[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');
  const tableName = ref('当前多维表格');
  const printScope = ref<'visible' | 'selected'>('visible');
  const printTitle = ref('多维表格打印');
  const orientation = ref<'portrait' | 'landscape'>('portrait');
  const templates = ref<IPrintTemplate[]>([]);
  const selectedTemplateId = ref('default_template');
  const settingList = ref<IFieldMetaSettings[]>([]);
  const visibleSettings = computed(() => settingList.value.filter(item => !item.hidden));

  const notify = (message: string, toastType = ToastType.success) => {
    try { bitable.ui.showToast({ toastType, message }); } catch { /* outside Feishu */ }
  };

  const defaultSettings = () => {
    return fieldList.value.map((field, index) => ({
        fieldId: field.id,
        name: field.name,
        hidden: false,
        width: index === 1 ? 150 : index === 0 ? 112 : 88,
      }));
  };

  const loadCurrentView = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
      const table = await bitable.base.getActiveTable();
      const view = await table.getActiveView();
      const selectable = view as typeof view & { getSelectedRecordIdList?: () => Promise<string[]> };
      const recordIds = printScope.value === 'selected'
        ? await selectable.getSelectedRecordIdList?.() || []
        : (await view.getVisibleRecordIdList()).filter(Boolean) as string[];
      if (printScope.value === 'selected' && !recordIds.length) {
        rows.value = [];
        notify('请先在表格中选择要打印的记录', ToastType.warning);
        return;
      }
      const metaMap = new Map(fieldList.value.map(field => [field.id, field]));
      rows.value = await Promise.all(recordIds.slice(0, 200).map(async recordId => {
        const values: IPrintRow['values'] = {};
        await Promise.all(visibleSettings.value.map(async field => {
          try {
            const meta = metaMap.get(field.fieldId);
            if (meta?.type === FieldType.Attachment) {
              const raw = await table.getCellValue(field.fieldId, recordId);
              const tokens = Array.isArray(raw)
                ? raw.map(item => (item as { token?: string }).token).filter(Boolean) as string[]
                : [];
              values[field.fieldId] = {
                text: '',
                images: tokens.length ? await table.getCellAttachmentUrls(tokens, field.fieldId, recordId) : [],
              };
            } else {
              values[field.fieldId] = { text: await table.getCellString(field.fieldId, recordId) };
            }
          } catch {
            values[field.fieldId] = { text: '' };
          }
        }));
        return { recordId, values };
      }));
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '无法读取当前多维表格';
      rows.value = [];
    } finally {
      loading.value = false;
    }
  };

  const init = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
      const table = await bitable.base.getActiveTable();
      const view = await table.getActiveView();
      const allFields = await table.getFieldMetaList();
      const visibleFieldIds = await view.getVisibleFieldIdList();
      const map = new Map(allFields.map(field => [field.id, field]));
      fieldList.value = visibleFieldIds.map(id => map.get(id)).filter(Boolean) as IFieldMeta[];
      try {
        const name = await (table as typeof table & { getName?: () => Promise<string> }).getName?.();
        if (name) {
          tableName.value = name;
          printTitle.value = `${name}打印`;
        }
      } catch { /* optional SDK method */ }
      settingList.value = defaultSettings();
      try {
        const saved = await bitable.bridge.getData<IPrintTemplate[]>(TEMPLATE_KEY);
        templates.value = Array.isArray(saved) ? saved : [];
      } catch { templates.value = []; }
      await loadCurrentView();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '插件没有获得多维表格读取权限，请重新打开插件';
    } finally {
      loading.value = false;
    }
  };

  const applyTemplate = async (templateId: string) => {
    selectedTemplateId.value = templateId;
    const template = templateId === 'default_template' ? undefined : templates.value.find(item => item.id === templateId);
    if (!template) {
      printTitle.value = `${tableName.value}打印`;
      orientation.value = 'portrait';
      settingList.value = defaultSettings();
    } else {
      printTitle.value = template.title;
      orientation.value = template.orientation;
      const current = new Map(fieldList.value.map(field => [field.id, field]));
      const restored = template.fields.filter(item => current.has(item.fieldId)).map(item => ({ ...item, name: current.get(item.fieldId)!.name }));
      const ids = new Set(restored.map(item => item.fieldId));
      settingList.value = [...restored, ...fieldList.value.filter(field => !ids.has(field.id)).map(field => ({
        fieldId: field.id, name: field.name, hidden: true, width: 88,
      }))];
    }
    await loadCurrentView();
  };

  const persistTemplates = async () => {
    try { await bitable.bridge.setData(TEMPLATE_KEY, templates.value); } catch { /* local UI remains usable */ }
  };

  const saveTemplate = async (name?: string) => {
    const cleanName = (name || printTitle.value || '未命名模板').trim();
    const existing = templates.value.find(item => item.id === selectedTemplateId.value);
    const template: IPrintTemplate = {
      id: existing?.id || `template_${Date.now()}`,
      name: cleanName,
      title: printTitle.value || cleanName,
      orientation: orientation.value,
      fields: settingList.value.map(item => ({ ...item })),
      tableName: tableName.value,
      updatedAt: Date.now(),
    };
    templates.value = existing
      ? templates.value.map(item => item.id === existing.id ? template : item)
      : [...templates.value, template];
    selectedTemplateId.value = template.id;
    await persistTemplates();
    notify('模板已保存');
    return template.id;
  };

  const createTemplate = () => {
    selectedTemplateId.value = `template_${Date.now()}`;
    printTitle.value = '未命名模板';
    orientation.value = 'portrait';
    settingList.value = fieldList.value.map(field => ({ fieldId: field.id, name: field.name, hidden: true, width: 88 }));
    rows.value = [];
  };

  const deleteTemplate = async (id: string) => {
    templates.value = templates.value.filter(item => item.id !== id);
    await persistTemplates();
    notify('模板已删除');
  };

  const toggleField = async (fieldId: string) => {
    settingList.value = settingList.value.map(item => item.fieldId === fieldId ? { ...item, hidden: !item.hidden } : item);
    await loadCurrentView();
  };

  const moveField = async (fieldId: string, direction: -1 | 1) => {
    const visible = visibleSettings.value;
    const current = visible.findIndex(item => item.fieldId === fieldId);
    const target = current + direction;
    if (current < 0 || target < 0 || target >= visible.length) return;
    const a = settingList.value.findIndex(item => item.fieldId === visible[current].fieldId);
    const b = settingList.value.findIndex(item => item.fieldId === visible[target].fieldId);
    const next = [...settingList.value];
    [next[a], next[b]] = [next[b], next[a]];
    settingList.value = next;
    await loadCurrentView();
  };

  return {
    rows, loading, errorMessage, fieldList, tableName, printScope, printTitle, orientation,
    templates, selectedTemplateId, settingList, visibleSettings,
    init, loadCurrentView, applyTemplate, saveTemplate, createTemplate, deleteTemplate, toggleField, moveField,
    handlePrint: () => window.print(),
  };
};

export default usePrint;
