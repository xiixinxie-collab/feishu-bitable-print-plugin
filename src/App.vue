<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import usePrint from './hooks/usePrint';

const {
  rows, loading, printScope, printTitle, orientation, templates, selectedTemplateId,
  visibleSettings, isSettingPanelShow, settingList,
  init, loadCurrentView, handlePrint, handleSetting, handleSettingListUpdate,
  applyTemplate, saveTemplate, deleteTemplate,
} = usePrint();

onBeforeMount(init);

const isTemplateDialogShow = ref(false);
const templateName = ref('');

const confirmSaveTemplate = async () => {
  if (await saveTemplate(templateName.value)) {
    templateName.value = '';
    isTemplateDialogShow.value = false;
  }
};
</script>

<template>
  <div class="toolbar">
    <el-select
      v-model="selectedTemplateId"
      class="template-select"
      placeholder="选择打印模板"
      @change="applyTemplate"
    >
      <el-option label="生产排期（默认）" value="production_schedule" />
      <el-option v-for="item in templates" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
    <el-button @click="isTemplateDialogShow = true">保存为模板</el-button>
    <el-button v-if="selectedTemplateId !== 'production_schedule'" type="danger" plain @click="deleteTemplate">删除模板</el-button>
    <el-input v-model="printTitle" class="title-input" placeholder="打印标题" />
    <el-select v-model="printScope" class="scope-select" @change="loadCurrentView">
      <el-option label="当前筛选视图" value="visible" />
      <el-option label="仅已选择记录" value="selected" />
    </el-select>
    <el-select v-model="orientation" class="orientation-select">
      <el-option label="A4纵向" value="portrait" />
      <el-option label="A4横向" value="landscape" />
    </el-select>
    <el-button :loading="loading" @click="loadCurrentView">刷新当前视图</el-button>
    <el-button @click="handleSetting">设置打印字段</el-button>
    <el-button type="primary" :disabled="!rows.length" @click="handlePrint">打印 / 导出 PDF</el-button>
    <span class="record-count">共 {{ rows.length }} 条</span>
  </div>

  <el-dialog v-model="isSettingPanelShow" title="打印字段与顺序" width="480px">
    <settings-panel :list="settingList" @update:list="handleSettingListUpdate" />
  </el-dialog>

  <el-dialog v-model="isTemplateDialogShow" title="保存打印模板" width="420px">
    <el-input v-model="templateName" placeholder="例如：采购清单、图片清单" @keyup.enter="confirmSaveTemplate" />
    <template #footer>
      <el-button @click="isTemplateDialogShow = false">取消</el-button>
      <el-button type="primary" :disabled="!templateName.trim()" @click="confirmSaveTemplate">保存</el-button>
    </template>
  </el-dialog>

  <main class="print-page" :class="orientation">
    <h1>{{ printTitle || '多维表格打印' }}</h1>
    <table v-if="visibleSettings.length" class="schedule-table">
      <colgroup>
        <col class="sequence-column" />
        <col v-for="field in visibleSettings" :key="field.fieldId" :class="`field-${field.name}`" />
      </colgroup>
      <thead>
        <tr>
          <th>序号</th>
          <th v-for="field in visibleSettings" :key="field.fieldId">{{ field.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="row.recordId">
          <td>{{ index + 1 }}</td>
          <td v-for="field in visibleSettings" :key="field.fieldId">
            <template v-if="row.values[field.fieldId]?.images?.length">
              <img
                v-for="(url, imageIndex) in row.values[field.fieldId].images"
                :key="imageIndex"
                class="cell-image"
                :src="url"
              />
            </template>
            <span v-else>{{ row.values[field.fieldId]?.text }}</span>
          </td>
        </tr>
        <tr v-if="!rows.length && !loading">
          <td :colspan="visibleSettings.length + 1" class="empty-cell">当前视图没有可打印记录</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
