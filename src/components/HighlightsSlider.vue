<script setup>
import { computed, onMounted, ref } from 'vue'
import RequestHighlightCard from './RequestHighlightCard.vue'
import leftIcon from '../assets/requests/down.svg'

// Горизонтальный слайдер плиток заявок для ПК: прокрутка колесом/тачпадом и стрелки «назад / вперёд».
// Стрелки появляются, только если плитки не помещаются в ширину.
defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open'])

const track = ref(null)
const canPrev = ref(false)
const canNext = ref(false)

function update() {
  const el = track.value
  if (!el) return
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
function scrollBy(direction) {
  const el = track.value
  el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 280), behavior: 'smooth' })
}
onMounted(update)
const scrollable = computed(() => canPrev.value || canNext.value)
</script>

<template>
  <section class="slider" :aria-label="title">
    <header class="slider-head">
      <h3>{{ title }} <span class="slider-count">{{ items.length }}</span></h3>
      <div v-if="scrollable" class="slider-arrows">
        <a-button shape="circle" size="small" class="arrow prev" :disabled="!canPrev" aria-label="Назад" @click="scrollBy(-1)">
          <img :src="leftIcon" alt="" />
        </a-button>
        <a-button shape="circle" size="small" class="arrow next" :disabled="!canNext" aria-label="Вперёд" @click="scrollBy(1)">
          <img :src="leftIcon" alt="" />
        </a-button>
      </div>
    </header>
    <div ref="track" class="slider-track" @scroll.passive="update">
      <RequestHighlightCard
        v-for="request in items"
        :key="request.id"
        class="slide"
        :request="request"
        :now="now"
        @open="emit('open', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.slider-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.slider-head h3 { margin: 0; color: #101828; font-size: 17px; font-weight: 700; line-height: 24px; }
.slider-count { display: inline-grid; min-width: 22px; height: 22px; margin-left: 4px; padding: 0 7px; place-items: center; border-radius: 11px; background: #f0f0f0; color: rgba(0, 0, 0, .65); font-size: 12px; font-weight: 600; vertical-align: 1px; }
.slider-arrows { display: flex; gap: 8px; }
.arrow.ant-btn { display: grid; place-items: center; }
.arrow img { width: 12px; }
.arrow.prev img { transform: rotate(90deg); }
.arrow.next img { transform: rotate(-90deg); }
.slider-track { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.slider-track::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 280px; scroll-snap-align: start; }
</style>
