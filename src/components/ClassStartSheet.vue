<script setup>
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
  lesson: {
    type: Object,
    default: () => ({
      title: 'Производственная практика. Практика в информационно-аналитической и организационно-управленческой деятельности',
      instructor: 'Константинопольский Константин Константинович',
      room: 'А914',
      timeRange: '10:10 - 11:40',
    }),
  },
})

const emit = defineEmits(['close', 'scan'])

function onScan() {
  emit('scan')
}

function onClose() {
  emit('close')
}
</script>

<template>
  <!-- Нижняя шторка (Bottom Sheet) по макету Figma 1118:3809 -->
  <BottomSheet
    :open="open"
    :z-index="zIndex"
    @close="onClose"
  >
    <div class="class-start-sheet" role="dialog" aria-labelledby="class-sheet-title">
      <h2 id="class-sheet-title" class="sheet-title">Начните пару</h2>

      <p class="sheet-desc">
        Вас назначили ответственным за старт занятия. Наведите камеру на QR-код аудитории, чтобы зафиксировать начало и открыть пару для группы.
      </p>

      <div class="sheet-lesson-card">
        <div class="lesson-header">
          <p class="lesson-title">{{ lesson.title }}</p>
          <p v-if="lesson.instructor" class="lesson-instructor">{{ lesson.instructor }}</p>
        </div>

        <div class="lesson-divider" role="separator"></div>

        <div class="lesson-meta">
          <span class="lesson-room">{{ lesson.room || 'А914' }}</span>
          <span class="lesson-time">{{ lesson.timeRange || '10:10 - 11:40' }}</span>
        </div>
      </div>

      <div class="sheet-actions">
        <button type="button" class="btn-scan" @click="onScan">
          Сканировать код
        </button>
        <button type="button" class="btn-cancel" @click="onClose">
          Закрыть
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.class-start-sheet {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 8px;
  box-sizing: border-box;
}

.sheet-title {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.88);
  letter-spacing: -0.2px;
}

.sheet-desc {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: rgba(18, 18, 18, 0.65);
}

.sheet-lesson-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 12px;
  background: #f3f3f3;
  border-radius: 12px;
  margin-bottom: 20px;
}

.lesson-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lesson-title {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
}

.lesson-instructor {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #121212;
  opacity: 0.8;
  word-break: break-word;
}

.lesson-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 2px 0;
}

.lesson-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #2867ab;
  white-space: nowrap;
}

.lesson-room,
.lesson-time {
  color: #2867ab;
  font-weight: 500;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.btn-scan {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  background: #2d82cf;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  box-shadow: 0px 2px 0px 0px rgba(5, 145, 255, 0.1);
  transition: background-color 150ms ease, transform 120ms ease;
}

.btn-scan:hover {
  background: #236eb3;
}

.btn-scan:active {
  background: #1b5891;
  transform: scale(0.99);
}

.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.02);
  transition: background-color 150ms ease, transform 120ms ease;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-cancel:active {
  background: #e8e8e8;
  transform: scale(0.99);
}
</style>
