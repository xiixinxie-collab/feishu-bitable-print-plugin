<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft, Delete, Download, EditPen, Grid, Menu, Picture, Plus,
  Printer, Refresh, Search, Setting, Tickets, Upload,
} from '@element-plus/icons-vue';
import usePrint from './hooks/usePrint';

const {
  rows, loading, errorMessage, fieldList, tableName, printScope, printTitle, orientation,
  templates, settingList, visibleSettings,
  init, loadCurrentView, applyTemplate, saveTemplate, createTemplate, deleteTemplate, toggleField, moveField, handlePrint,
} = usePrint();

const page = ref<'home' | 'editor'>('home');
const fieldSearch = ref('');
const saveDialog = ref(false);
const saveName = ref('');

onMounted(init);

const shownFields = computed(() => fieldList.value.filter(field => field.name.toLowerCase().includes(fieldSearch.value.toLowerCase())));
const displayTemplates = computed(() => [{
  id: 'default_template', name: '默认打印模板', title: `${tableName.value}打印`, tableName: tableName.value, updatedAt: Date.now(),
}, ...templates.value]);

const openTemplate = async (id: string) => {
  await applyTemplate(id);
  page.value = 'editor';
};

const startBlank = () => {
  createTemplate();
  page.value = 'editor';
};

const openSave = () => {
  saveName.value = printTitle.value;
  saveDialog.value = true;
};

const confirmSave = async () => {
  printTitle.value = saveName.value.trim() || '未命名模板';
  await saveTemplate(printTitle.value);
  saveDialog.value = false;
};

const formatTime = (timestamp?: number) => timestamp
  ? new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
  : '刚刚';
</script>

<template>
  <div class="app-shell" :class="{ 'editor-mode': page === 'editor' }">
    <header class="brand-bar">
      <div class="brand-mark"><el-icon><Menu /></el-icon></div>
      <strong>易打印</strong>
      <div v-if="page === 'editor'" class="header-actions">
        <el-button text title="导入"><el-icon><Upload /></el-icon></el-button>
        <el-button text title="导出 PDF" @click="handlePrint"><el-icon><Download /></el-icon></el-button>
        <el-button text title="保存模板" @click="openSave"><el-icon><Tickets /></el-icon></el-button>
        <el-button text title="设置"><el-icon><Setting /></el-icon></el-button>
      </div>
    </header>

    <section v-if="page === 'home'" class="home-page">
      <div class="home-title">易打印 · 排版助手</div>
      <div v-if="errorMessage" class="error-banner">
        <strong>暂时没有读取到表格</strong>
        <span>{{ errorMessage }}</span>
        <el-button size="small" @click="init">重新连接</el-button>
      </div>

      <section class="template-section">
        <h1>当前表可用模板 <small>{{ loading ? '更新中' : '已同步' }}</small></h1>
        <div class="template-grid">
          <article v-for="template in displayTemplates" :key="template.id" class="template-card" @click="openTemplate(template.id)">
            <el-icon class="template-icon"><Tickets /></el-icon>
            <div class="template-info">
              <h2>{{ template.name }}</h2>
              <p>对应表格：{{ template.tableName || tableName }}</p>
              <p>最近更新：{{ formatTime(template.updatedAt) }}</p>
            </div>
            <el-button
              v-if="template.id !== 'default_template'"
              text
              class="delete-template"
              @click.stop="deleteTemplate(template.id)"
            ><el-icon><Delete /></el-icon></el-button>
          </article>
        </div>
      </section>

      <section class="create-section">
        <h2>创建新模板</h2>
        <p>{{ fieldList.length ? `已读取 ${fieldList.length} 个字段` : '等待读取当前表字段…' }}</p>
        <button class="create-card" @click="startBlank">
          <el-icon><Tickets /></el-icon>
          <strong>创建新模板</strong>
          <span>从空白 A4 画布开始设计</span>
        </button>
      </section>
    </section>

    <section v-else class="editor-page">
      <div class="editor-toolbar">
        <el-button text @click="page = 'home'"><el-icon><ArrowLeft /></el-icon></el-button>
        <el-button text disabled><el-icon><Refresh /></el-icon></el-button>
        <span class="tool-divider" />
        <el-button-group>
          <el-button size="small">默认字体</el-button>
          <el-button size="small">12</el-button>
        </el-button-group>
        <span class="tool-divider" />
        <el-button text title="字段"><el-icon><Tickets /></el-icon></el-button>
        <el-button text title="图片"><el-icon><Picture /></el-icon></el-button>
        <el-button text title="表格"><el-icon><Grid /></el-icon></el-button>
        <el-button text title="编辑标题"><el-icon><EditPen /></el-icon></el-button>
        <div class="toolbar-spacer" />
        <el-select v-model="printScope" size="small" style="width: 132px" @change="loadCurrentView">
          <el-option label="当前筛选视图" value="visible" />
          <el-option label="仅已选记录" value="selected" />
        </el-select>
        <el-select v-model="orientation" size="small" style="width: 100px">
          <el-option label="A4 纵向" value="portrait" />
          <el-option label="A4 横向" value="landscape" />
        </el-select>
        <el-button size="small" :loading="loading" @click="loadCurrentView">刷新</el-button>
        <el-button size="small" type="primary" @click="openSave">保存</el-button>
        <el-button size="small" @click="handlePrint"><el-icon><Printer /></el-icon>打印</el-button>
      </div>

      <div class="workspace">
        <aside class="field-panel">
          <div class="panel-heading">
            <div><strong>字段</strong><small>已加载多维表格字段</small></div>
            <el-button text><el-icon><ArrowLeft /></el-icon></el-button>
          </div>
          <el-input v-model="fieldSearch" class="field-search" placeholder="搜索字段" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <div class="special-fields">
            <div><span class="type-badge blue">#</span><strong>自增序号</strong></div>
            <div><span class="type-badge green">总数</span><strong>计算总数</strong></div>
            <div><span class="type-badge amber">日期</span><strong>打印日期</strong></div>
          </div>
          <div class="field-list">
            <button v-for="field in shownFields" :key="field.id" @click="toggleField(field.id)">
              <span>{{ field.name }}</span>
              <el-icon :class="{ active: !settingList.find(item => item.fieldId === field.id)?.hidden }"><Plus /></el-icon>
            </button>
          </div>
        </aside>

        <main class="canvas-area">
          <div v-if="errorMessage" class="canvas-error">{{ errorMessage }}</div>
          <section class="print-sheet" :class="orientation">
            <input v-model="printTitle" class="sheet-title" aria-label="打印标题" />
            <div class="table-wrap">
              <table class="designer-table">
                <colgroup>
                  <col style="width: 54px" />
                  <col v-for="field in visibleSettings" :key="field.fieldId" :style="{ width: `${field.width || 88}px` }" />
                </colgroup>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th v-for="field in visibleSettings" :key="field.fieldId" class="editable-header">
                      <span>{{ field.name }}</span>
                      <span class="column-actions">
                        <button @click="moveField(field.fieldId, -1)">‹</button>
                        <button @click="moveField(field.fieldId, 1)">›</button>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!rows.length" class="field-preview-row">
                    <td><span class="field-chip">#</span></td>
                    <td v-for="field in visibleSettings" :key="field.fieldId"><span class="field-chip">{{ field.name }}</span></td>
                  </tr>
                  <tr v-for="(row, index) in rows.slice(0, 30)" :key="row.recordId">
                    <td>{{ index + 1 }}</td>
                    <td v-for="field in visibleSettings" :key="field.fieldId">
                      <template v-if="row.values[field.fieldId]?.images?.length">
                        <img v-for="url in row.values[field.fieldId].images" :key="url" class="cell-image" :src="url" />
                      </template>
                      <span v-else>{{ row.values[field.fieldId]?.text }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </section>

    <el-dialog v-model="saveDialog" title="保存打印模板" width="420px">
      <el-input v-model="saveName" placeholder="例如：常用清单、图片明细" @keyup.enter="confirmSave" />
      <template #footer>
        <el-button @click="saveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>
