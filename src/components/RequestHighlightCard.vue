<script setup>
import { computed } from 'vue'
import { parts, timerLabel, whenLabel } from '../data/requestModel'
import eduWatermark from '../assets/figma/edu-watermark.svg'

// Плитка заявки или активности. Используется в каруселях и списках («Заявки», виджет «Сейчас у вас»).
// Оформлена в едином современном стиле дизайн-системы FEFU One:
// Активная — тёмная с водяным знаком, статусом, аудиторией, временем и нижней полосой прогресса.
// Ближайшая — светлая с меткой времени начала и локацией.
const props = defineProps({
  request: { type: Object, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open'])

const isActive = computed(() => props.request.status === 'active')
const timer = computed(() => timerLabel(props.request, props.now))
const isEdu = computed(() => props.request.source === 'events' || !!props.request.instructor || !!props.request.room)

const isSoon = computed(() => {
  if (props.request.sessionState === 'soon') return true
  if (props.request.sessionState === 'in_progress') return false
  if (props.request.status === 'upcoming') return true
  if (props.request.startsAt && Date.parse(props.request.startsAt) > props.now) return true
  return false
})

function formatRemaining(request) {
  const diff = Date.parse(request.endsAt) - props.now
  const total = Math.floor(Math.abs(diff) / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч ${minutes} мин`
  return `${minutes} мин ${seconds} сек`
}

function formatTimeRange(item) {
  if (item.timeRange) return item.timeRange
  if (!item.startsAt || !item.endsAt) return ''
  const start = parts(item.startsAt)
  const end = parts(item.endsAt)
  return `${start.time} - ${end.time}`
}

function formatRoom(place) {
  if (!place) return 'Кампус'
  const items = place.split('·').map((s) => s.trim())
  return items.length > 1 ? items[1] : place
}

function getSubtitle(item) {
  if (item.instructor) return item.instructor
  if (item.speaker) return item.speaker
  if (item.items?.[0]?.unitId) return `Инв. № ${item.items[0].unitId}`
  if (item.source === 'events') return 'Студенческое событие'
  if (item.source === 'equipment' || item.source === 'tmc') return item.place || 'Пункт выдачи'
  if (item.source === 'workplace') return 'Коворкинг кампуса'
  return item.place || 'Кампус ДВФУ'
}

const statusLabel = computed(() => {
  if (timer.value.overdue) {
    return 'Превышено на ' + formatRemaining(props.request)
  }
  if (isEdu.value) {
    if (isSoon.value) return 'Пара скоро начнется'
    return 'Пара идет'
  }
  return 'Идёт · ' + formatRemaining(props.request)
})

const dotState = computed(() => {
  if (timer.value.overdue) return 'state-overdue'
  if (isSoon.value) return 'state-soon'
  return 'state-ok'
})

const ariaLabel = computed(() => {
  if (isActive.value) {
    return `Активность: ${props.request.title}. ${statusLabel.value}. ${getSubtitle(props.request)}. Локация: ${props.request.room || formatRoom(props.request.place)}`
  }
  return `Ближайшая заявка: ${props.request.title}. ${whenLabel(props.request)}. ${props.request.place}`
})
</script>

<template>
  <button
    type="button"
    class="highlight-card"
    :class="isActive ? ['is-active', isEdu ? (isSoon ? 'is-soon' : 'is-in-progress') : `state-${timer.state}`] : 'is-upcoming'"
    :aria-label="ariaLabel"
    @click="emit('open', request.id)"
  >
    <!-- Водяной знак для активных сессий -->
    <div v-if="isActive" class="card-watermark" aria-hidden="true">
      <img :src="eduWatermark" alt="" />
    </div>

    <!-- Верхняя строка: индикатор статуса -->
    <div class="card-top-row">
      <div class="status-indicator">
        <span class="status-dot" :class="dotState" aria-hidden="true"></span>
        <span class="status-text">{{ isActive ? statusLabel : 'Ближайшая' }}</span>
      </div>
    </div>

    <!-- Основная информация -->
    <div class="card-body">
      <strong class="card-title">{{ request.title }}</strong>
      <p class="card-subtitle">{{ getSubtitle(request) }}</p>
    </div>

    <!-- Разделительная линия между описанием и метаданными (Figma 1118:3282) -->
    <div v-if="isActive" class="card-divider" aria-hidden="true"></div>

    <!-- Нижняя строка: аудитория и время (или дата) -->
    <div class="card-bottom-row">
      <template v-if="isActive">
        <span class="card-room">{{ request.room || formatRoom(request.place) }}</span>
        <span class="card-time">{{ formatTimeRange(request) }}</span>
      </template>
      <template v-else>
        <span class="card-place">{{ formatRoom(request.place) }}</span>
        <span class="card-time">{{ whenLabel(request) }}</span>
      </template>
    </div>

    <!-- Полоса прогресса таймера внизу карточки (только для идущих сессий) -->
    <div
      v-if="isActive && !timer.overdue && !isSoon"
      class="card-progress-strip"
      role="progressbar"
      :aria-valuenow="timer.percent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="card-progress-fill"
        :class="dotState"
        :style="{ width: `${timer.percent}%` }"
      ></div>
    </div>
  </button>
</template>

<style scoped>
.highlight-card {
  position: relative;
  overflow: clip;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  gap: 8px;
  min-height: 140px;
  padding: 16px 16px 14px;
  border: 0;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: transform 120ms ease, opacity 120ms ease;
}

.highlight-card:active {
  transform: scale(0.99);
  opacity: 0.95;
}

.highlight-card:focus-visible {
  outline: 2px solid #2867ab;
  outline-offset: 2px;
}

/* Активная сессия: токен bg spotlight (#121212 с opacity 85%) */
.highlight-card.is-active,
.highlight-card.is-active.is-in-progress,
.highlight-card.is-active.is-soon {
  background: var(--color-bg-spotlight, rgba(18, 18, 18, 0.85));
  color: #fff;
}

.card-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0;
  border: 0;
  flex-shrink: 0;
}

/* Ближайшая заявка (светлая карточка) */
.highlight-card.is-upcoming {
  background: #f7f8f9;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.88);
}

/* Водяной знак */
.card-watermark {
  position: absolute;
  top: -25px;
  right: -10px;
  width: 120px;
  height: 120px;
  pointer-events: none;
  opacity: 1;
  z-index: 0;
}
.card-watermark img {
  width: 100%;
  height: 100%;
  display: block;
}

/* Верхняя строка */
.card-top-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #4f90da;
  flex-shrink: 0;
}
.status-dot.state-soon {
  background: #faad14;
}
.status-dot.state-overdue {
  background: #ff4d4f;
}
.is-upcoming .status-dot {
  background: rgba(0, 0, 0, 0.45);
}

.status-text {
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
}
.is-active .status-text {
  color: #ffffff;
}
.is-upcoming .status-text {
  color: rgba(0, 0, 0, 0.65);
}

/* Тело карточки */
.card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  word-break: break-word;
}
.is-active .card-title {
  color: #ffffff;
}
.is-upcoming .card-title {
  color: rgba(0, 0, 0, 0.88);
}

.card-subtitle {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.is-active .card-subtitle {
  color: #ffffff;
  opacity: 0.8;
}
.is-upcoming .card-subtitle {
  color: rgba(0, 0, 0, 0.65);
}

/* Нижняя строка */
.card-bottom-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
}
.is-active .card-bottom-row {
  color: #ffffff;
}
.is-upcoming .card-bottom-row {
  color: rgba(0, 0, 0, 0.65);
}

.card-room,
.card-time,
.card-place {
  overflow: hidden;
  text-overflow: ellipsis;
}
.is-active .card-room,
.is-active .card-time {
  opacity: 0.6;
}

/* Полоса прогресса */
.card-progress-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 1;
}

.card-progress-fill {
  height: 6px;
  border-radius: 0 60px 60px 0;
  background: #479ae8;
  transition: width 300ms ease;
}
.card-progress-fill.state-soon {
  background: #faad14;
}
.card-progress-fill.state-overdue {
  background: #ff4d4f;
}

@media (prefers-reduced-motion: reduce) {
  .highlight-card {
    transition: none;
  }
}
</style>
