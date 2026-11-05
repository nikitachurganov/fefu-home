<script setup>
import { computed } from 'vue'
import { timerLabel, whenLabel } from '../data/requestModel'
import dateMutedIcon from '../assets/requests/date-muted.svg'
import placeMutedIcon from '../assets/requests/place-muted.svg'
import placeWhiteIcon from '../assets/requests/place-white.svg'
import rightMutedIcon from '../assets/requests/right-muted.svg'
import rightWhiteIcon from '../assets/requests/right-white.svg'

// Плитка ближайшей или активной заявки. Общая для карусели в «Заявках» и виджета «Сейчас у вас» на главной:
// активная — тёмная с таймером (синяя шкала — идёт, жёлтая — подходит к концу, красная — просрочена),
// остальные — светлые с датой.
const props = defineProps({
  request: { type: Object, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open'])

const isActive = computed(() => props.request.status === 'active')
const timer = computed(() => timerLabel(props.request, props.now))
const timerWord = computed(() => (timer.value.overdue ? 'Превышено на' : 'Осталось'))
const tag = computed(() => (isActive.value ? (timer.value.overdue ? 'Просрочено' : 'Активная') : 'Ближайшая'))
const ariaLabel = computed(() => `${isActive.value
  ? `Активная заявка: ${props.request.title}. ${timerWord.value} ${timer.value.spoken}`
  : `Ближайшая заявка: ${props.request.title}. ${whenLabel(props.request)}`}. ${props.request.place}`)
</script>

<template>
  <button
    type="button"
    class="highlight-card"
    :class="isActive ? ['is-active', `state-${timer.state}`] : null"
    :aria-label="ariaLabel"
    @click="emit('open', request.id)"
  >
    <span class="highlight-top">
      <span class="highlight-tag">{{ tag }}</span>
      <img :src="isActive ? rightWhiteIcon : rightMutedIcon" alt="" />
    </span>
    <strong>{{ request.title }}</strong>
    <span class="request-meta"><img :src="isActive ? placeWhiteIcon : placeMutedIcon" alt="" />{{ request.place }}</span>
    <span
      v-if="isActive"
      class="highlight-progress"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="timer.percent"
      :aria-valuetext="`${timerWord} ${timer.spoken}`"
    >
      <span class="progress-head">
        <span>{{ timerWord }}</span>
        <b class="timer-value">{{ timer.text }}</b>
      </span>
      <span class="progress-track"><span class="progress-fill" :style="{ width: `${timer.percent}%` }"></span></span>
    </span>
    <span v-else class="request-meta"><img :src="dateMutedIcon" alt="" />{{ whenLabel(request) }}</span>
  </button>
</template>

<style scoped>
.highlight-card { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px; border: 0; border-radius: 12px; background: #e8e8e8; color: rgba(0, 0, 0, .88); text-align: left; cursor: pointer; transition: opacity 150ms ease; }
.highlight-card.is-active { --track: rgba(255, 255, 255, .2); --fill: #479ae8; background: #262626; color: #fff; }
/* Активная заявка — чёрная плитка; приоритет срока показывает цвет шкалы: идёт — синий, подходит к концу — жёлтый, просрочена — красный. */
.highlight-card.state-soon { --fill: #fadb14; }
.highlight-card.state-overdue { --fill: #ff4d4f; }
.highlight-card:active { opacity: .85; }
.highlight-card:focus-visible { outline: 3px solid #1677ff; outline-offset: 2px; }
.highlight-card strong { display: block; max-width: 100%; overflow: hidden; font-size: 17px; line-height: 24px; text-overflow: ellipsis; white-space: nowrap; }
.highlight-card.is-active .request-meta { color: rgba(255, 255, 255, .92); }
.highlight-progress { display: grid; width: 100%; gap: 6px; font-size: 13px; line-height: 20px; }
.progress-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.timer-value { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.progress-track { display: block; height: 6px; overflow: hidden; border-radius: 3px; background: var(--track); }
.progress-fill { display: block; height: 100%; border-radius: 3px; background: var(--fill); }
.highlight-top { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; }
.highlight-tag { padding: 0 8px; border-radius: 4px; background: rgba(0, 0, 0, .08); font-size: 12px; line-height: 20px; }
.highlight-card.is-active .highlight-tag { background: rgba(255, 255, 255, .24); }
.request-meta { display: flex; align-items: flex-start; gap: 4px; color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; overflow-wrap: anywhere; }
.request-meta img { flex-shrink: 0; margin-top: 1px; }
@media (prefers-reduced-motion: reduce) {
  .highlight-card { transition: none; }
}
</style>
