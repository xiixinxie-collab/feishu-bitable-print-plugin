<template>
  <p class="hint">拖动字段可调整打印顺序；关闭字段后将不打印。</p>
  <div ref="el" class="field-list">
    <div v-for="item in list" :key="item.fieldId" class="field-item">
      <span class="drag-handle">⋮⋮</span>
      <span class="field-name">{{ item.name }}</span>
      <el-switch
        :model-value="!item.hidden"
        active-text="打印"
        inactive-text="隐藏"
        @change="handleHiddenChange(item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDraggable } from 'vue-draggable-plus';
import type { IFieldMetaSettings } from '../types';

const el = ref();
const props = defineProps<{ list: IFieldMetaSettings[] }>();
const emit = defineEmits<{ (event: 'update:list', value: IFieldMetaSettings[]): void }>();

useDraggable<IFieldMetaSettings>(el, {
  handle: '.drag-handle',
  onUpdate: ({ oldIndex, newIndex }) => {
    if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
    const next = props.list.map(item => ({ ...item }));
    const moved = next.splice(oldIndex, 1)[0];
    next.splice(newIndex, 0, moved);
    emit('update:list', next);
  },
});

const handleHiddenChange = (current: IFieldMetaSettings) => {
  emit('update:list', props.list.map(item =>
    item.fieldId === current.fieldId ? { ...item, hidden: !item.hidden } : { ...item }
  ));
};
</script>

<style scoped>
.hint { margin: 0 0 12px; color: #646a73; font-size: 13px; }
.field-list { border: 1px solid #dee0e3; border-radius: 8px; overflow: hidden; }
.field-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #eff0f1; background: #fff; }
.field-item:last-child { border-bottom: 0; }
.drag-handle { cursor: grab; color: #8f959e; font-weight: 700; }
.field-name { flex: 1; }
</style>
