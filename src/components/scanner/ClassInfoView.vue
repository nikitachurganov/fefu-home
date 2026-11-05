<script setup>
import { computed, ref } from 'vue'
import {
  BellOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  ExpandOutlined,
  LeftOutlined,
  ScanOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import QrCode from '../widgets/QrCode.vue'
import BottomSheet from '../BottomSheet.vue'
import { buildCode } from '../../data/scanCodes'
import { studentDemoCodes } from '../../data/demoCodes'
import { parts, MONTHS } from '../../data/requestModel'
import figmaLogo from '../../assets/figma/logo.png'

// Figma Экран «Занятие» (Node 977:7128)
const props = defineProps({
  // { id, title, discipline, place, floor, teacher, group, capacity, totalStudents, scheduledDate }
  lesson: { type: Object, required: true },
  // { startedAt, attendees[] }
  session: { type: Object, required: true },
  canUseCamera: { type: Boolean, default: false },
  feedback: { type: Object, default: null },
})

const emit = defineEmits(['back', 'scan-student', 'show-qr', 'end-class', 'demo-mark'])

const showDemo = import.meta.env.DEV
const journalOpen = ref(false)

const classCode = computed(() => buildCode('class', props.lesson.id))

const displayDiscipline = computed(() => {
  return props.lesson.discipline || props.lesson.title || 'Проектирование в дизайне и визуальные коммуникации'
})

const displayPlace = computed(() => {
  return props.lesson.place || 'F703'
})

const displayDate = computed(() => {
  if (props.lesson.scheduledDate) return props.lesson.scheduledDate
  return '18-06-2026, 10:10-11:40'
})

const displayTeacher = computed(() => {
  return props.lesson.teacher || 'Иванов Иван Иванович'
})

const totalStudents = computed(() => {
  return props.lesson.totalStudents || props.lesson.capacity || 24
})

const attendeeCount = computed(() => {
  return props.session.attendees?.length || 0
})

function formatStamp(iso) {
  if (!iso) return ''
  const { time } = parts(iso)
  return time
}
</script>

<template>
  <div class="class-info-page" data-name="Занятие">
    <!-- Верхний бар с логотипом FEFU One и кнопками уведомлений/профиля -->
    <header class="ci-header" data-name="Header">
      <div class="ci-logo-group" data-name="logo">
        <img :src="figmaLogo" alt="FEFU One" class="ci-logo-img" />
        <span class="ci-logo-text">FEFU One</span>
      </div>
      <div class="ci-header-actions">
        <button type="button" class="ci-header-btn" aria-label="Уведомления">
          <BellOutlined />
        </button>
        <button type="button" class="ci-header-btn" aria-label="Профиль">
          <UserOutlined />
        </button>
      </div>
    </header>

    <!-- Подзаголовок со стрелкой назад и названием экрана -->
    <div class="ci-subnav">
      <button type="button" class="ci-back-btn" aria-label="Назад" @click="emit('back')">
        <LeftOutlined />
      </button>
      <h2 class="ci-screen-title">Информация о паре</h2>
    </div>

    <!-- Основная секция информации -->
    <main class="ci-main">
      <!-- Сетка 2x2 метаданных пары -->
      <div class="ci-meta-grid">
        <div class="ci-grid-cell">
          <span class="ci-cell-label">Дисциплина</span>
          <p class="ci-cell-value" :title="displayDiscipline">{{ displayDiscipline }}</p>
        </div>
        <div class="ci-grid-cell">
          <span class="ci-cell-label">Место проведения</span>
          <p class="ci-cell-value">{{ displayPlace }}</p>
        </div>
        <div class="ci-grid-cell">
          <span class="ci-cell-label">Занятие</span>
          <p class="ci-cell-value">{{ displayDate }}</p>
        </div>
        <div class="ci-grid-cell">
          <span class="ci-cell-label">Преподаватель</span>
          <p class="ci-cell-value">{{ displayTeacher }}</p>
        </div>
      </div>

      <!-- Большой QR-код занятия для студентов -->
      <div class="ci-qr-box">
        <div class="ci-qr-inner">
          <QrCode :text="classCode" :size="250" label="QR-код занятия для студентов" />
        </div>
        <button
          type="button"
          class="ci-qr-expand-btn"
          title="Вывести на весь экран (проектор)"
          aria-label="На весь экран"
          @click="emit('show-qr')"
        >
          <ExpandOutlined />
        </button>
      </div>

      <!-- Блок статистики (Всего / Отмечено) -->
      <div class="ci-stats-card">
        <div class="ci-stat-col">
          <span class="ci-stat-num">{{ totalStudents }}</span>
          <span class="ci-stat-title">Всего</span>
        </div>
        <div class="ci-stat-divider" aria-hidden="true"></div>
        <div class="ci-stat-col">
          <span class="ci-stat-num">{{ attendeeCount }}</span>
          <span class="ci-stat-title">Отмечено</span>
        </div>
      </div>
    </main>

    <!-- Нижняя кнопка «Журнал пары» -->
    <footer class="ci-footer">
      <a-button type="primary" class="ci-journal-btn" block @click="journalOpen = true">
        Журнал пары
      </a-button>
    </footer>

    <!-- Шторка «Журнал пары» со списком студентов и управлением -->
    <BottomSheet
      :open="journalOpen"
      title="Журнал присутствия"
      :subtitle="`${displayPlace} · Отмечено ${attendeeCount} из ${totalStudents}`"
      @close="journalOpen = false"
    >
      <div class="journal-content">
        <!-- Отклик последнего сканирования -->
        <div
          v-if="feedback"
          class="journal-feedback"
          :class="`jf--${feedback.type}`"
          role="status"
          aria-live="polite"
        >
          {{ feedback.text }}
        </div>

        <!-- Кнопки действий журнала -->
        <div class="journal-quick-actions">
          <a-button v-if="canUseCamera" type="primary" block @click="emit('scan-student')">
            <ScanOutlined /> Сканировать студента
          </a-button>
          <a-button block @click="emit('show-qr')">
            <ExpandOutlined /> Вывести код на проектор
          </a-button>
        </div>

        <!-- Список отметившихся студентов -->
        <div class="journal-list-section">
          <h4 class="journal-list-title">
            <TeamOutlined aria-hidden="true" />
            Список присутствующих ({{ attendeeCount }})
          </h4>

          <ul v-if="session.attendees?.length" class="journal-list">
            <li v-for="(a, i) in session.attendees" :key="i" class="journal-item">
              <span class="journal-item-avatar"><UserOutlined /></span>
              <div class="journal-item-info">
                <span class="journal-item-name">{{ a.name }}</span>
                <span class="journal-item-meta">{{ a.studentId }} · {{ formatStamp(a.checkedAt) }}</span>
              </div>
              <CheckCircleFilled class="journal-item-check" />
            </li>
          </ul>
          <p v-else class="journal-empty">Пока никто не отметился. Студенты могут отсканировать QR-код на экране.</p>
        </div>

        <!-- Демо-симуляция скана студента на ПК (dev) -->
        <div v-if="showDemo" class="journal-demo-block">
          <p class="journal-demo-title">Симуляция скана студента (dev-режим):</p>
          <div class="journal-demo-chips">
            <button
              v-for="s in studentDemoCodes"
              :key="s.text"
              type="button"
              class="journal-demo-chip"
              @click="emit('demo-mark', s.text)"
            >
              + {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Завершить пару -->
        <div class="journal-danger-zone">
          <a-button danger size="large" block @click="emit('end-class')">
            <CloseOutlined /> Завершить пару
          </a-button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.class-info-page {
  position: fixed;
  inset: 0;
  z-index: 1050;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  width: min(100%, 402px);
  left: 50%;
  transform: translateX(-50%);
  overflow-y: auto;
  box-sizing: border-box;
}

/* Верхний бар Header (Figma 977:7147) */
.ci-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px 12px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  box-sizing: border-box;
}

.ci-logo-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ci-logo-img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.ci-logo-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  color: #000000;
}

.ci-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ci-header-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.ci-header-btn:hover {
  border-color: #4096ff;
  color: #4096ff;
}

/* Подзаголовок «Информация о паре» */
.ci-subnav {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.ci-back-btn {
  position: absolute;
  left: 14px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
}

.ci-back-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.ci-screen-title {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
  text-align: center;
}

/* Основное содержимое */
.ci-main {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 8px 16px 20px;
  box-sizing: border-box;
}

/* 2x2 сетка */
.ci-meta-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 12px;
  row-gap: 12px;
  padding: 0 8px;
  box-sizing: border-box;
}

.ci-grid-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ci-cell-label {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 12px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.45);
}

.ci-cell-value {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Блок QR-кода */
.ci-qr-box {
  position: relative;
  width: 299px;
  height: 301px;
  max-width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  background: #ffffff;
}

.ci-qr-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ci-qr-expand-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.ci-qr-expand-btn:hover {
  color: #2d82cf;
  border-color: #2d82cf;
}

/* Карточка статистики */
.ci-stats-card {
  width: 240px;
  max-width: 100%;
  height: 78px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px;
  box-sizing: border-box;
}

.ci-stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 90px;
}

.ci-stat-num {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: rgba(0, 0, 0, 0.88);
}

.ci-stat-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.45);
}

.ci-stat-divider {
  width: 1px;
  height: 14px;
  background: #d9d9d9;
}

/* Нижняя кнопка */
.ci-footer {
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
  background: #ffffff;
  flex-shrink: 0;
  box-sizing: border-box;
}

.ci-journal-btn {
  height: 40px !important;
  border-radius: 8px !important;
  background: #2d82cf !important;
  border-color: #2d82cf !important;
  color: #ffffff !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.04) !important;
}

.ci-journal-btn:hover {
  background: #3b91df !important;
  border-color: #3b91df !important;
}

/* Содержимое шторки журнала */
.journal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.journal-feedback {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.jf--success {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.jf--error {
  background: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.journal-quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.journal-list-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.journal-list-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  gap: 6px;
}

.journal-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.journal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f5f5;
}

.journal-item-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e6f4ff;
  color: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.journal-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.journal-item-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.journal-item-meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.journal-item-check {
  color: #52c41a;
  font-size: 18px;
  flex-shrink: 0;
}

.journal-empty {
  margin: 0;
  padding: 20px 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.journal-demo-block {
  padding: 12px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.journal-demo-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}

.journal-demo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.journal-demo-chip {
  padding: 4px 8px;
  font-size: 12px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.journal-demo-chip:hover {
  border-color: #2d82cf;
  color: #2d82cf;
}

.journal-danger-zone {
  margin-top: 8px;
}
</style>
