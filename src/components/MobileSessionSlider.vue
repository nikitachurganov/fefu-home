<script setup>
import { ref } from 'vue'
import { parts, timerLabel } from '../data/requestModel'

const props = defineProps({
  items: { type: Array, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open'])

const track = ref(null)
const activeIndex = ref(0)

function getStep() {
  const el = track.value
  if (!el) return 0
  const firstCard = el.querySelector('.session-card')
  const cardWidth = firstCard ? firstCard.offsetWidth : 0
  if (cardWidth > 0) {
    const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null
    const gap = (style && parseFloat(style.gap)) || 8
    return cardWidth + gap
  }
  return el.clientWidth || 360
}

function onScroll(e) {
  const el = e.target
  const step = getStep()
  if (!step) return
  const index = Math.round(el.scrollLeft / step)
  activeIndex.value = Math.max(0, Math.min(props.items.length - 1, index))
}

function scrollTo(index) {
  activeIndex.value = index
  const el = track.value
  if (!el) return
  const step = getStep()
  el.scrollTo({ left: index * step, behavior: 'smooth' })
}

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

function getTimer(request) {
  return timerLabel(request, props.now)
}

function formatTimeRange(item) {
  if (!item.startsAt || !item.endsAt) return ''
  const start = parts(item.startsAt)
  const end = parts(item.endsAt)
  return `${start.time} – ${end.time}`
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
</script>

<template>
  <section class="mobile-session-slider" aria-label="Активные сессии">
    <div
      ref="track"
      class="session-track"
      :class="{ 'is-single': items.length <= 1 }"
      @scroll.passive="onScroll"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="session-card"
        role="button"
        tabindex="0"
        :aria-label="`Активность: ${item.title}. ${getTimer(item).overdue ? 'Превышено на ' : 'Идёт · '}${formatRemaining(item)}. ${getSubtitle(item)}. Локация: ${item.room || formatRoom(item.place)}`"
        @click="emit('open', item.id)"
        @keydown.enter.space.prevent="emit('open', item.id)"
      >
        <!-- Верхняя строка: статус + локация -->
        <div class="session-top-row">
          <div class="session-status">
            <span
              class="status-pulse-dot"
              :class="`state-${getTimer(item).state}`"
              aria-hidden="true"
            ></span>
            <span
              class="status-text"
              :class="`state-${getTimer(item).state}`"
            >
              {{ getTimer(item).overdue ? 'Превышено на ' + formatRemaining(item) : 'Идёт · ' + formatRemaining(item) }}
            </span>
          </div>

          <div v-if="item.room || item.place" class="session-location-chip">
            <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 21s-6-5.333-6-10a6 6 0 0 1 12 0c0 4.667-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
            <span class="location-text">{{ item.room || formatRoom(item.place) }}</span>
          </div>
        </div>

        <!-- Средняя строка: заголовок и персона/комната -->
        <div class="session-main">
          <strong class="session-title">{{ item.title }}</strong>
          <span class="session-subtitle">
            <svg class="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="subtitle-text">{{ getSubtitle(item) }}</span>
          </span>
        </div>

        <!-- Нижняя строка: Live прогресс на всю ширину -->
        <div class="session-bottom-bar">
          <div class="session-time-row">
            <span class="session-time-range">{{ formatTimeRange(item) }}</span>
            <span v-if="getTimer(item).overdue" class="session-state-hint state-overdue">Просрочено</span>
          </div>
          <div
            class="session-progress"
            role="progressbar"
            :aria-valuenow="getTimer(item).percent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="session-progress-fill"
              :class="`state-${getTimer(item).state}`"
              :style="{ width: `${getTimer(item).percent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Индикатор страниц (точки) -->
    <div v-if="items.length > 1" class="session-dots" aria-hidden="true">
      <button
        v-for="(_, index) in items"
        :key="index"
        type="button"
        class="session-dot"
        :class="{ active: activeIndex === index }"
        :aria-label="`Слайд ${index + 1}`"
        @click="scrollTo(index)"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.mobile-session-slider {
  display: flex;
  flex-direction: column;
  margin-left: -12px;
  margin-right: -12px;
  margin-bottom: 12px;
}
.session-track {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 0 12px;
  scroll-padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
}
.session-track::-webkit-scrollbar {
  display: none;
}
.session-card {
  flex: 0 0 calc(100% - 20px);
  min-width: 0;
  min-height: 120px;
  scroll-snap-align: start;
  background: #121212;
  border-radius: 16px;
  padding: 12px 14px;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  user-select: none;
  box-sizing: border-box;
  transition: transform 120ms ease, opacity 120ms ease;
}
.session-track.is-single .session-card {
  flex: 0 0 100%;
}
.session-card:active {
  transform: scale(0.99);
  opacity: 0.95;
}
.session-card:focus-visible {
  outline: 2px solid #2867ab;
  outline-offset: 2px;
}

/* Верхняя строка */
.session-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.session-status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.status-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2867ab;
  flex-shrink: 0;
}
.status-pulse-dot.state-ok {
  background: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
  animation: pulse-dot 2s infinite;
}
.status-pulse-dot.state-soon {
  background: #fadb14;
  box-shadow: 0 0 8px rgba(250, 219, 20, 0.6);
}
.status-pulse-dot.state-overdue {
  background: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.7);
  animation: pulse-dot 1.2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}
.status-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-text.state-soon {
  color: #fadb14;
}
.status-text.state-overdue {
  color: #ff4d4f;
}

.session-location-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  flex-shrink: 0;
  max-width: 50%;
}
.location-icon {
  width: 12px;
  height: 12px;
  stroke: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}
.location-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Средняя часть: Заголовок и подпись */
.session-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.session-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-subtitle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.user-icon {
  width: 12px;
  height: 12px;
  stroke: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}
.subtitle-text {
  font-size: 12px;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Нижняя строка: шкала на всю ширину */
.session-bottom-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.session-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.55);
}
.session-time-range {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.session-state-hint.state-overdue {
  color: #ff4d4f;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.session-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  overflow: hidden;
}
.session-progress-fill {
  height: 100%;
  border-radius: 100px;
  background: #2867ab;
  transition: width 300ms ease;
}
.session-progress-fill.state-ok {
  background: #2867ab;
}
.session-progress-fill.state-soon {
  background: #fadb14;
}
.session-progress-fill.state-overdue {
  background: #ff4d4f;
}

/* Индикатор слайдов */
.session-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 0 0;
}
.session-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(18, 18, 18, 0.25);
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: all 180ms ease;
}
.session-dot.active {
  width: 10px;
  border-radius: 5px;
  background: #2867ab;
}
</style>
