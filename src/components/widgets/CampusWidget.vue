<script setup>
import { computed } from 'vue'
import { nextDepartures, shuttle, weather } from '../../data/campus'
import cloudIcon from '../../assets/figma/cloud.svg'
import busIcon from '../../assets/figma/bus.svg'

// «Кампус»: компактная строка справа от приветствия — погода и ближайший шаттл, без карточки.
const props = defineProps({ now: { type: Number, required: true } })
const emit = defineEmits(['open-service'])

const next = computed(() => nextDepartures(shuttle.departures, props.now, 1)[0] ?? null)
const inLabel = (minutes) => (minutes < 60 ? `через ${minutes} мин` : `через ${Math.floor(minutes / 60)} ч ${minutes % 60} мин`)
</script>

<template>
  <section class="campus" aria-label="Кампус">
    <span class="campus-item" :aria-label="`Погода: ${weather.temperature}°, ощущается как ${weather.feelsLike}°, ветер ${weather.wind} м/с`">
      <img :src="cloudIcon" alt="" width="20" height="20" />
      <b>{{ weather.temperature }}°</b>
      <span class="muted">ветер {{ weather.wind }} м/с</span>
    </span>
    <span class="divider" aria-hidden="true"></span>
    <button type="button" class="campus-item campus-link" @click="emit('open-service', 'Шаттлы')">
      <img :src="busIcon" alt="" width="20" height="20" />
      <span v-if="next"><b>{{ next.time }}</b> <span class="muted">шаттл {{ inLabel(next.inMinutes) }}</span></span>
      <span v-else class="muted">Шаттлов сегодня больше нет</span>
    </button>
    <span class="divider" aria-hidden="true"></span>
    <button type="button" class="campus-link plain" @click="emit('open-service', 'Карта')">Карта</button>
  </section>
</template>

<style scoped>
.campus { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.campus-item { display: inline-flex; align-items: center; gap: 6px; }
.campus b { font-variant-numeric: tabular-nums; font-weight: 600; }
.muted { color: rgba(0, 0, 0, .55); }
.divider { width: 1px; height: 16px; background: #d9d9d9; }
.campus-link { padding: 2px 4px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.campus-link:hover { background: rgba(0, 0, 0, .05); }
.campus-link:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.campus-link.plain { color: #1677ff; }
</style>
