<script setup>
import { computed } from 'vue'
import HighlightsSlider from '../HighlightsSlider.vue'

// «Сейчас у вас» и «Ближайшие»: два слайдера тех же плиток, что в разделе «Заявки» —
// активные брони (с таймером) и подтверждённые ближайшие. Лежат прямо на фоне страницы.
const props = defineProps({
  items: { type: Array, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open-request', 'open-all'])

const active = computed(() => props.items.filter((request) => request.status === 'active'))
const upcoming = computed(() => props.items.filter((request) => request.status !== 'active'))
</script>

<template>
  <section class="active-card" aria-label="Мои брони сейчас и ближайшие">
    <HighlightsSlider v-if="active.length" title="Сейчас у вас" :items="active" :now="now" @open="emit('open-request', $event)" />
    <HighlightsSlider v-if="upcoming.length" title="Ближайшие" :items="upcoming" :now="now" @open="emit('open-request', $event)" />
    <footer class="active-foot">
      <a-button type="link" class="widget-link" @click="emit('open-all')">Все брони и история</a-button>
    </footer>
  </section>
</template>

<style scoped>
/* Одна карточка, внутри два независимых слайдера: каждый прокручивается отдельно. */
.active-card { display: flex; min-width: 0; flex-direction: column; gap: 20px; padding: 20px; border-radius: 16px; background: #fff; }
.active-foot { display: flex; justify-content: flex-end; margin-top: -8px; }
.widget-link.ant-btn { height: 24px; padding: 0; }
</style>
