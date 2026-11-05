<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { durationLabel } from '../../data/homeModel'
import { dateTimeLabel, timerLabel } from '../../data/requestModel'

// Карточка срока аренды при приёмке: кольцо с оставшимся временем, «Вернуть до» и общее время пользования.
const props = defineProps({ request: { type: Object, required: true } })

const now = ref(Date.now())
let timer
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 30000) })
onBeforeUnmount(() => clearInterval(timer))

const RADIUS = 52
const LENGTH = 2 * Math.PI * RADIUS

const info = computed(() => timerLabel(props.request, now.value))
const overdue = computed(() => info.value.overdue)
const left = computed(() => durationLabel(Date.parse(props.request.endsAt) - now.value))
// Заполненная дуга — оставшееся время; при просрочке кольцо полное и красное.
const dash = computed(() => `${overdue.value ? LENGTH : LENGTH * (1 - info.value.percent / 100)} ${LENGTH}`)

function plural(count, forms) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? forms[1] : forms[2]
}

// «24 часа» из срока аренды; короткие аренды показываем в минутах.
const usage = computed(() => {
  const minutes = Math.round((Date.parse(props.request.endsAt) - Date.parse(props.request.startsAt)) / 60000)
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60)
    return `${hours} ${plural(hours, ['час', 'часа', 'часов'])}`
  }
  return `${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])}`
})
</script>

<template>
  <section class="timer-card" aria-label="Срок аренды">
    <div class="ring" :class="{ overdue }" role="img" :aria-label="`${overdue ? 'Просрочено на' : 'Осталось'} ${left}`">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="track" cx="60" cy="60" :r="RADIUS" />
        <circle class="arc" cx="60" cy="60" :r="RADIUS" :stroke-dasharray="dash" transform="rotate(-90 60 60)" />
      </svg>
      <div class="ring-text">
        <small>{{ overdue ? 'Просрочено на' : 'Осталось' }}</small>
        <strong>{{ left }}</strong>
        <small v-if="!overdue">до возврата</small>
      </div>
    </div>
    <dl class="terms">
      <div><dt>Вернуть до</dt><dd>{{ dateTimeLabel(request.endsAt) }}</dd></div>
      <div><dt>Время использования</dt><dd>{{ usage }}</dd></div>
    </dl>
  </section>
</template>

<style scoped>
.timer-card { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: #fff; }
.ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.ring svg { display: block; width: 100%; height: 100%; }
.track, .arc { fill: none; stroke-width: 8; }
.track { stroke: #f0f0f0; }
.arc { stroke: #2d82cf; stroke-linecap: round; }
.ring.overdue .arc { stroke: #cf1322; }
.ring-text { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; gap: 2px; padding: 0 16px; text-align: center; }
.ring-text small { color: rgba(0, 0, 0, .65); font-size: 11px; line-height: 12px; }
.ring-text strong { color: #101828; font-size: 15px; font-weight: 700; line-height: 20px; }
.terms { display: grid; flex: 1; gap: 12px; min-width: 0; margin: 0; padding-left: 16px; border-left: 1px solid #f0f0f0; }
.terms dt { color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 16px; }
.terms dd { margin: 2px 0 0; color: #101828; font-size: 13px; font-weight: 700; line-height: 16px; }
</style>
