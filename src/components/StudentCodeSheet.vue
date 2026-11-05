<script setup>
import { nextTick, ref, watch } from 'vue'
import BottomSheet from './BottomSheet.vue'
import QrCode from './widgets/QrCode.vue'
import { studentCode } from '../data/campus'

const props = defineProps({
  open: Boolean,
  zIndex: { type: Number, default: undefined },
})
const emit = defineEmits(['close'])

const trackRef = ref(null)
const activeIndex = ref(0)
const isDragging = ref(false)

const subjects = [
  {
    id: 'practice',
    title: 'Производственная практика.Практика в информационно-аналитической и организационно-управленческой деятельности',
    code: 'FEFU-ONE:STUDENT:24-08192:PRACTICE',
  },
  {
    id: 'data-analysis',
    title: 'Анализ данных',
    code: 'FEFU-ONE:STUDENT:24-08192:DATA-ANALYSIS',
  },
  {
    id: 'sys-arch',
    title: 'Архитектура информационных систем',
    code: 'FEFU-ONE:STUDENT:24-08192:SYS-ARCH',
  },
]

function onScroll() {
  if (!trackRef.value) return
  const slideWidth = trackRef.value.clientWidth
  if (!slideWidth) return
  const nextIndex = Math.round(trackRef.value.scrollLeft / slideWidth)
  if (nextIndex >= 0 && nextIndex < subjects.length && activeIndex.value !== nextIndex) {
    activeIndex.value = nextIndex
  }
}

function goTo(index) {
  activeIndex.value = index
  if (!trackRef.value) return
  const slideWidth = trackRef.value.clientWidth
  trackRef.value.scrollTo({
    left: index * slideWidth,
    behavior: 'smooth',
  })
}

// Перетаскивание мышью (на ПК / для отладки)
let isPointerDown = false
let startX = 0
let scrollStart = 0

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  isPointerDown = true
  startX = e.clientX
  scrollStart = trackRef.value ? trackRef.value.scrollLeft : 0
}

function onPointerMove(e) {
  if (!isPointerDown || !trackRef.value) return
  const deltaX = e.clientX - startX
  if (Math.abs(deltaX) > 4) {
    isDragging.value = true
    trackRef.value.scrollLeft = scrollStart - deltaX
  }
}

function onPointerUp() {
  if (!isPointerDown) return
  isPointerDown = false
  isDragging.value = false
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activeIndex.value = 0
    nextTick(() => {
      if (trackRef.value) {
        trackRef.value.scrollLeft = 0
      }
    })
  }
})
</script>

<template>
  <BottomSheet :open="open" :zIndex="zIndex" @close="emit('close')">
    <div class="code-sheet">
      <!-- Слайдер занятий со свайпом -->
      <div
        ref="trackRef"
        class="slider-track"
        :class="{ 'is-dragging': isDragging }"
        tabindex="0"
        role="region"
        aria-label="Слайдер занятий"
        @scroll.passive="onScroll"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          v-for="(subject, index) in subjects"
          :key="subject.id"
          class="slide"
          :aria-label="`Занятие ${index + 1} из ${subjects.length}: ${subject.title}`"
        >
          <div class="code-card">
            <h2 class="code-card-subject">
              {{ subject.title }}
            </h2>

            <div class="code-card-qr">
              <QrCode :text="subject.code || studentCode" :size="200" :bordered="false" :label="`QR-код: ${subject.title}`" />
            </div>

            <p class="code-card-hint">
              Покажите QR-код преподавателю<br />для отметки на паре
            </p>
          </div>
        </div>
      </div>

      <!-- Индикатор пагинации (3 точки) -->
      <div class="code-sheet-pagination" role="tablist" aria-label="Выбор занятия">
        <button
          v-for="(item, index) in subjects"
          :key="item.id"
          type="button"
          role="tab"
          :aria-selected="activeIndex === index"
          :aria-label="`Занятие ${index + 1}: ${item.title}`"
          class="pagination-dot"
          :class="{ active: activeIndex === index }"
          @click="goTo(index)"
        />
      </div>

      <!-- Кнопка «Закрыть» -->
      <a-button class="code-sheet-close-btn" block @click="emit('close')">
        Закрыть
      </a-button>
    </div>
  </BottomSheet>
</template>

<style scoped>
.code-sheet {
  display: flex;
  flex-direction: column;
  padding-bottom: 6px;
  overflow: hidden;
}

/* Трек слайдера с плавной прокруткой и snap */
.slider-track {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  cursor: grab;
  user-select: none;
}

.slider-track.is-dragging {
  scroll-behavior: auto;
  cursor: grabbing;
}

.slider-track::-webkit-scrollbar {
  display: none;
}

.slide {
  flex: 0 0 100%;
  width: 100%;
  min-width: 100%;
  box-sizing: border-box;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

/* Серая плашка */
.code-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 424px;
  height: 100%;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  box-sizing: border-box;
}

.code-card-subject {
  width: 100%;
  min-height: 60px;
  margin: 0;
  color: rgba(0, 0, 0, .88);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  text-align: left;
  word-break: break-word;
}

.code-card-qr {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
}

.code-card-qr :deep(svg) {
  display: block;
}

.code-card-hint {
  width: 100%;
  margin: 0;
  color: rgba(0, 0, 0, .65);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: center;
  word-break: break-word;
}

/* Пагинация */
.code-sheet-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0 16px;
}

.pagination-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #d9d9d9;
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;
}

.pagination-dot.active {
  background: #256ed4;
  transform: scale(1.1);
}

.pagination-dot:focus-visible {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}

/* Кнопка «Закрыть» */
.code-sheet-close-btn {
  height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  color: rgba(0, 0, 0, .88);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, .02);
  transition: all 160ms ease;
}

.code-sheet-close-btn:hover {
  color: #1677ff;
  border-color: #1677ff;
}

.code-sheet-close-btn:active {
  background: #f5f5f5;
}
</style>
