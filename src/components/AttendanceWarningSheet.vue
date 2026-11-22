<script setup>
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  WarningFilled,
  CalendarOutlined,
  FileDoneOutlined,
  CheckCircleFilled,
} from '@ant-design/icons-vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
  attendance: {
    type: Object,
    default: () => ({
      subject: 'Английский язык',
      teacher: 'Иванов Иван Иваныч',
      percent: 30,
      threshold: 60,
      attended: 3,
      total: 10,
      missed: 7,
      needed: 3,
    }),
  },
})

const emit = defineEmits(['close', 'action'])

const actionStep = ref(null) // 'consultation' | 'medical-doc' | null

function onClose() {
  actionStep.value = null
  emit('close')
}

function requestConsultation() {
  actionStep.value = 'consultation'
  message.success('Запрос на консультацию отправлен преподавателю')
  emit('action', 'consultation')
}

function uploadMedicalDoc() {
  actionStep.value = 'medical-doc'
  message.success('Переход к прикреплению справки о болезни')
  emit('action', 'medical-doc')
}
</script>

<template>
  <BottomSheet :open="open" :z-index="zIndex" @close="onClose">
    <div class="attendance-sheet" role="dialog" aria-labelledby="attendance-sheet-title">
      <!-- Экран подтверждения действия -->
      <div v-if="actionStep" class="sheet-result-state">
        <CheckCircleFilled class="result-icon" aria-hidden="true" />
        <h2 class="sheet-title">
          {{ actionStep === 'consultation' ? 'Заявка отправлена!' : 'Справка принята к обработке' }}
        </h2>
        <p class="sheet-desc">
          <template v-if="actionStep === 'consultation'">
            Преподаватель {{ attendance.teacher }} получит уведомление о записи на ближайшую консультацию. Время и аудитория придут в раздел «Уведомления».
          </template>
          <template v-else>
            После проверки справки деканатом статус посещаемости по дисциплине «{{ attendance.subject }}» будет пересчитан.
          </template>
        </p>
        <button type="button" class="btn-primary" @click="onClose">
          Понятно
        </button>
      </div>

      <!-- Основной экран предупреждения -->
      <template v-else>
        <!-- Шапка с предупреждением -->
        <div class="attendance-header-alert">
          <span class="warning-icon-wrap" aria-hidden="true">
            <WarningFilled />
          </span>
          <div class="header-texts">
            <h2 id="attendance-sheet-title" class="sheet-title warning-title">
              Посещаемость: {{ attendance.percent }}%
            </h2>
            <p class="sheet-desc warning-desc">
              Порог допуска к зачёту в ДВФУ — {{ attendance.threshold }}%. При текущем уровне есть риск получить академическую задолженность.
            </p>
          </div>
        </div>

        <!-- Карточка предмета с прогрессом -->
        <div class="attendance-card">
          <div class="card-top">
            <span class="subject-name">{{ attendance.subject }}</span>
            <span class="teacher-name">{{ attendance.teacher }}</span>
          </div>

          <!-- Шкала посещаемости -->
          <div class="progress-wrap">
            <div class="progress-labels">
              <span class="current-label">Текущая: <b>{{ attendance.percent }}%</b></span>
              <span class="threshold-label">Допуск: <b>{{ attendance.threshold }}%</b></span>
            </div>
            <div class="track-bar">
              <div
                class="fill-bar"
                :style="{ width: `${attendance.percent}%` }"
              ></div>
              <!-- Метка минимального порога 60% -->
              <div
                class="threshold-marker"
                :style="{ left: `${attendance.threshold}%` }"
                title="Минимум для допуска"
              >
                <span class="marker-line"></span>
                <span class="marker-dot"></span>
              </div>
            </div>
          </div>

          <!-- Метрики в 3 колонки -->
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-num text-ok">{{ attendance.attended }}</span>
              <span class="stat-name">Посещено</span>
            </div>
            <div class="stat-box">
              <span class="stat-num text-danger">{{ attendance.missed }}</span>
              <span class="stat-name">Пропущено</span>
            </div>
            <div class="stat-box">
              <span class="stat-num text-warn">+{{ attendance.needed }}</span>
              <span class="stat-name">Нужно для допуска</span>
            </div>
          </div>
        </div>

        <!-- Блок «Как исправить ситуацию» -->
        <div class="advice-section">
          <h3 class="section-title">Что можно сделать сейчас:</h3>

          <div class="advice-cards">
            <div class="advice-card" @click="requestConsultation">
              <div class="advice-icon-col">
                <CalendarOutlined class="advice-icon" />
              </div>
              <div class="advice-body">
                <strong class="advice-head">Записаться на консультацию</strong>
                <span class="advice-text">Сдать пропущенные лабораторные и семинары в приёмные часы.</span>
              </div>
            </div>

            <div class="advice-card" @click="uploadMedicalDoc">
              <div class="advice-icon-col">
                <FileDoneOutlined class="advice-icon" />
              </div>
              <div class="advice-body">
                <strong class="advice-head">Прикрепить справку о болезни</strong>
                <span class="advice-text">Пропуски по уважительной причине не учитываются при подсчёте долга.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="sheet-actions">
          <button type="button" class="btn-primary" @click="requestConsultation">
            Записаться на отработку
          </button>
          <button type="button" class="btn-secondary" @click="uploadMedicalDoc">
            Прикрепить справку
          </button>
          <button type="button" class="btn-cancel" @click="onClose">
            Закрыть
          </button>
        </div>
      </template>
    </div>
  </BottomSheet>
</template>

<style scoped>
.attendance-sheet {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 12px;
  box-sizing: border-box;
}

.attendance-header-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.warning-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #fff1f0;
  color: #d9363e;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.header-texts {
  display: flex;
  flex-direction: column;
}

.sheet-title {
  margin: 0 0 6px;
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: -0.2px;
}

.warning-title {
  color: #d9363e;
}

.sheet-desc {
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: rgba(18, 18, 18, 0.65);
}

/* Карточка предмета */
.attendance-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #fff1f0;
  border: 1px solid rgba(217, 54, 62, 0.25);
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-name {
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: #121212;
}

.teacher-name {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

/* Шкала посещаемости */
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.current-label {
  color: #d9363e;
}

.threshold-label {
  color: rgba(0, 0, 0, 0.65);
}

.track-bar {
  position: relative;
  width: 100%;
  height: 10px;
  background: #e8e8e8;
  border-radius: 5px;
  overflow: visible;
}

.fill-bar {
  height: 100%;
  background: #d9363e;
  border-radius: 5px;
  transition: width 300ms ease;
}

.threshold-marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}

.marker-line {
  width: 2px;
  height: 16px;
  background: #121212;
  border-radius: 1px;
}

/* Сетка статистики */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(217, 54, 62, 0.15);
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
}

.stat-num {
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.text-ok {
  color: #52c41a;
}
.text-danger {
  color: #d9363e;
}
.text-warn {
  color: #d46b08;
}

.stat-name {
  font-size: 11px;
  line-height: 14px;
  color: rgba(0, 0, 0, 0.55);
}

/* Шаги решения */
.advice-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.88);
}

.advice-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advice-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #f7f8f9;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.advice-card:hover {
  background: #eef4fb;
}

.advice-icon-col {
  color: #2867ab;
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
}

.advice-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.advice-head {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.advice-text {
  font-size: 12px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.65);
}

/* Кнопки */
.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-primary {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #2867ab;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.btn-primary:hover {
  background: #1f538d;
}

.btn-secondary {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: #ffffff;
  color: #2867ab;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #2867ab;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.btn-secondary:hover {
  background: #f0f7ff;
}

.btn-cancel {
  width: 100%;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* Экран подтверждения */
.sheet-result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 8px 12px;
  gap: 12px;
}

.result-icon {
  font-size: 48px;
  color: #52c41a;
  margin-bottom: 4px;
}
</style>
