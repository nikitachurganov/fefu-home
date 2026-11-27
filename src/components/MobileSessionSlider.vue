<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { parts, timerLabel } from '../data/requestModel'
import { isDark } from '../data/theme'
import { activityIllustration } from '../data/activityIllustrations'

const categorySubjects = { events: 'events', workplace: '3d-printer', equipment: '3d-printer', tmc: 'rental' }

function getIllustration(item) {
  const subject = item.instructor || item.room ? 'lesson' : categorySubjects[item.source] ?? 'tools'
  return activityIllustration(subject, !props.desktop || isDark.value)
}

const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  now: { type: Number, required: true },
  desktop: Boolean,
})
const emit = defineEmits(['open'])

const track = ref(null)
const activeIndex = ref(0)
const canScrollPrevious = ref(false)
const canScrollNext = ref(false)
let resizeObserver

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

function onScroll() {
  const el = track.value
  if (!el) return
  if (props.desktop) {
    canScrollPrevious.value = el.scrollLeft > 1
    canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    return
  }
  const step = getStep()
  if (!step) return
  const index = Math.round(el.scrollLeft / step)
  activeIndex.value = Math.max(0, Math.min(props.items.length - 1, index))
}

function moveSlide(direction) {
  track.value?.scrollBy({ left: direction * getStep() })
}

onMounted(() => {
  if (!props.desktop) return
  onScroll()
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(track.value)
  }
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch(() => props.items.length, onScroll, { flush: 'post' })

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
  // Номер заявки на ТМЦ и бронирование — reservations.id в бэкенде (целое число без префикса).
  if (['tmc', 'equipment', 'workplace'].includes(item.source) && item.id) return `Заявка № ${item.id}`
  if (item.items?.[0]?.unitId) return `Инв. № ${item.items[0].unitId}`
  if (item.source === 'events') return 'Студенческое событие'
  if (item.source === 'equipment' || item.source === 'tmc') return item.place || 'Пункт выдачи'
  if (item.source === 'workplace') return 'Коворкинг кампуса'
  return item.place || 'Кампус ДВФУ'
}

function isEduItem(item) {
  return item.source === 'events' || !!item.instructor || !!item.room
}

// Состояние "Пара скоро начнется" (Figma node 1107:2634 Variant2):
// - если явно задан sessionState === 'soon'
// - или если занятие еще не началось (startsAt в будущем)
// - или если статус upcoming
function isSoonItem(item) {
  if (item.sessionState === 'soon') return true
  if (item.sessionState === 'in_progress') return false
  if (item.status === 'upcoming') return true
  if (item.startsAt && Date.parse(item.startsAt) > props.now) return true
  return false
}

function getStatusLabel(item) {
  const timer = getTimer(item)
  if (timer.overdue) {
    return 'Превышено на ' + formatRemaining(item)
  }
  if (isEduItem(item)) {
    if (isSoonItem(item)) return 'Пара скоро начнется'
    return 'Пара идет'
  }
  return 'Идёт · ' + formatRemaining(item)
}

function getDotState(item) {
  const timer = getTimer(item)
  if (timer.overdue) return 'state-overdue'
  if (isSoonItem(item)) return 'state-soon'
  return 'state-ok'
}

function getCardClass(item) {
  if (isEduItem(item)) {
    return isSoonItem(item) ? 'is-soon' : 'is-in-progress'
  }
  return 'is-standard'
}
</script>

<template>
  <section class="mobile-session-slider" :class="{ 'is-desktop': desktop }"
    :aria-label="title">
    <div class="session-header">
      <h2>{{ title }}</h2>
      <div v-if="desktop && (canScrollPrevious || canScrollNext)" class="session-arrows">
        <button type="button" :disabled="!canScrollPrevious" aria-label="Предыдущая активность" @click="moveSlide(-1)">
          <LeftOutlined aria-hidden="true" />
        </button>
        <button type="button" :disabled="!canScrollNext" aria-label="Следующая активность" @click="moveSlide(1)">
          <RightOutlined aria-hidden="true" />
        </button>
      </div>
    </div>
    <div
      ref="track"
      class="session-track"
      :class="{
        'is-single': !desktop && items.length <= 1,
        'portal-carousel-track': desktop,
        'fade-start': desktop && canScrollPrevious,
        'fade-end': desktop && canScrollNext,
      }"
      @scroll.passive="onScroll"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="session-card"
        :class="[getCardClass(item), { 'is-overdue': getTimer(item).overdue }]"
        role="button"
        tabindex="0"
        :aria-label="`Активность: ${item.title}. ${getStatusLabel(item)}. ${getSubtitle(item)}. Локация: ${item.room || formatRoom(item.place)}`"
        @click="emit('open', item.id)"
        @keydown.enter.space.prevent="emit('open', item.id)"
      >
        <img class="session-watermark" :src="getIllustration(item)" alt="" aria-hidden="true" />

        <!-- Верхняя строка: статус (Figma node 1107:2622 / 1107:2637 BadgeStatus) -->
        <div class="session-details">
        <div class="session-top-row">
          <div class="session-status">
            <span
              class="status-badge-dot"
              :class="getDotState(item)"
              aria-hidden="true"
            ></span>
            <span class="status-badge-text">
              {{ getStatusLabel(item) }}
            </span>
          </div>
        </div>

        <!-- Средняя строка: заголовок и преподаватель (Figma node 1107:2623 / 1107:2638) -->
        <div class="session-main">
          <p class="session-title">{{ item.title }}</p>
          <p class="session-subtitle">{{ getSubtitle(item) }}</p>
        </div>
        </div>

        <!-- Разделитель между описанием и метаданными (Figma node 1118:3282 / 1118:3290 Line 1) -->
        <div class="session-divider" aria-hidden="true"></div>

        <!-- Нижняя строка: аудитория и время (Figma node 1107:2626 / 1107:2641) -->
        <div class="session-bottom-row">
          <span class="session-room">{{ item.room || formatRoom(item.place) }}</span>
          <span class="session-time">{{ formatTimeRange(item) }}</span>
        </div>

        <!-- Индикатор прогресса внизу карточки только для идущих занятий и активных сессий (Figma node 1107:2629) -->
        <div
          v-if="!getTimer(item).overdue && !isSoonItem(item)"
          class="session-progress-strip"
          role="progressbar"
          :aria-valuenow="getTimer(item).percent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="session-progress-fill"
            :class="getDotState(item)"
            :style="{ width: `${Math.max(12, getTimer(item).percent)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Индикатор страниц (точки) (Figma node 1115:2159) -->
    <div v-if="!desktop && items.length > 1" class="session-dots" aria-hidden="true">
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
  --illustration-width: 84px;
  position: relative;
  overflow: clip;
  flex: 0 0 calc(100% - 20px);
  min-width: 0;
  min-height: 140px;
  scroll-snap-align: start;
  background: var(--color-bg-spotlight, rgba(18, 18, 18, 0.85));
  border-radius: 12px;
  padding: 16px 16px 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  user-select: none;
  box-sizing: border-box;
  transition: transform 120ms ease, opacity 120ms ease;
}

/* Токен bg spotlight: #121212 с opacity 85% (rgba(18, 18, 18, 0.85)) */
.session-card.is-in-progress,
.session-card.is-soon,
.session-card.is-standard {
  background: var(--color-bg-spotlight, rgba(18, 18, 18, 0.85));
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

.session-watermark {
  position: absolute;
  top: 3px;
  right: 4px;
  width: var(--illustration-width);
  height: auto;
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(to bottom, rgb(0 0 0 / .56) 12%, rgb(0 0 0 / .36) 45%, transparent 88%);
}

/* Верхняя строка */
.session-top-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.session-details { display: flex; flex-direction: column; gap: 8px; width: 100%; }

.status-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #4f90da;
  flex-shrink: 0;
}
.status-badge-dot.state-soon {
  background: #faad14;
}
.status-badge-dot.state-overdue {
  background: #ff4d4f;
}

.status-badge-text {
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #ffffff;
  white-space: nowrap;
}

/* Средняя часть: заголовок и преподаватель */
.session-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.session-title {
  margin: 0;
  margin-inline-end: var(--illustration-width);
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  color: #ffffff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.session-subtitle {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #ffffff;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Разделительная линия (Figma node 1118:3282 / 1118:3290) */
.session-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0;
  border: 0;
  flex-shrink: 0;
}

/* Нижняя строка: аудитория и время */
.session-bottom-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #ffffff;
  white-space: nowrap;
}

.session-room,
.session-time {
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Прогресс-бар внизу карточки (Figma node 1107:2629) */
.session-progress-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 1;
}

.session-progress-fill {
  height: 6px;
  border-radius: 0 60px 60px 0;
  background: #479ae8;
  transition: width 300ms ease;
}
.session-progress-fill.state-soon {
  background: #faad14;
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
  padding: 8px 0;
}

.session-dot {
  width: 5px;
  height: 5px;
  border-radius: 5px;
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

.mobile-session-slider.is-desktop { margin: 24px 0 0; }
.session-header {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.session-header h2 { margin: 0; color: var(--ink); font-size: 19px; font-weight: 700; line-height: 24px; }
.mobile-session-slider:not(.is-desktop) .session-header { margin-inline: 12px; }
.session-arrows { display: flex; gap: 8px; }
.session-arrows button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: 13px;
}
.session-arrows button:enabled:hover {
  background: color-mix(in srgb, var(--blue) 12%, transparent);
  color: var(--blue);
}
.session-arrows button:disabled { cursor: default; opacity: 0.35; }
.session-arrows button:focus-visible { outline: 2px solid var(--blue); }
.is-desktop .session-track {
  gap: var(--home-carousel-gap);
  padding: 0;
  scroll-padding: 0;
  scroll-behavior: smooth;
}
.is-desktop .session-card {
  --illustration-width: 110px;
  flex-basis: calc(2 * var(--home-update-card-width) + var(--home-carousel-gap));
  border: 0;
  border-radius: 12px;
  background: var(--activity-surface, #fff);
  color: var(--activity-text, #242424);
  padding: 20px 20px 16px;
  gap: 16px;
  justify-content: flex-start;
}
.is-desktop .session-details { gap: 12px; }
.is-desktop .session-main { gap: 8px; }
.is-desktop .session-title { color: var(--activity-secondary, rgba(18, 18, 18, 0.65)); }
@media (hover: hover) {
  .session-card:hover .session-title { color: var(--blue, #70aaff); }
}
.session-card:focus-visible .session-title { color: var(--blue, #70aaff); }
.is-desktop .session-subtitle { color: var(--activity-secondary, rgba(18, 18, 18, 0.65)); }
.is-desktop .session-watermark {
  top: 2px;
  right: 6px;
}
.is-desktop .status-badge-text,
.is-desktop .session-bottom-row { color: var(--activity-text, #242424); }
.is-desktop .session-divider { background: var(--activity-divider, #f0f0f0); }
.is-desktop .session-progress-strip { background: var(--activity-progress-track, rgba(0, 0, 0, 0.08)); }
.is-desktop .session-card:focus-visible { outline-offset: -2px; }
.session-card.is-overdue { border: 1px solid #ff4d4f; }
@media (prefers-reduced-motion: reduce) {
  .is-desktop .session-track { scroll-behavior: auto; }
  .is-desktop .session-card { transition: none; }
  .is-desktop .session-progress-fill { transition: none; }
}
</style>
