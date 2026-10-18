<script setup>
// Нижняя шторка с ручкой для выбора одного варианта из списка.
// Закрывается по Escape, по маске и свайпом вниз за ручку.
defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  // [{ value, label, hint?, count? }]
  options: { type: Array, default: () => [] },
  value: { type: [String, Number], default: null },
})
const emit = defineEmits(['close', 'select'])

// Тянем контейнер за пальцем; после порога в 80px уводим вниз и закрываем,
// иначе возвращаем на место.
let dragStartY = null
let dragEl = null
function onGrabStart(event) {
  dragStartY = event.clientY
  dragEl = event.currentTarget.closest('.ant-drawer-content-wrapper')
  event.currentTarget.setPointerCapture(event.pointerId)
  dragEl.style.transition = 'none'
}
function onGrabMove(event) {
  if (dragStartY === null) return
  dragEl.style.transform = `translateY(${Math.max(0, event.clientY - dragStartY)}px)`
}
function onGrabEnd(event) {
  if (dragStartY === null) return
  const el = dragEl
  const shouldClose = event.clientY - dragStartY > 80
  dragStartY = null
  dragEl = null
  el.style.transition = 'transform 200ms ease'
  el.style.transform = shouldClose ? 'translateY(100%)' : ''
  if (shouldClose) emit('close')
  setTimeout(() => { el.style.transition = ''; el.style.transform = '' }, 500)
}
</script>

<template>
  <a-drawer :open="open" placement="bottom" height="auto" :closable="false" root-class-name="bottom-sheet" @close="emit('close')">
    <div
      class="sheet-grabber"
      @pointerdown="onGrabStart"
      @pointermove="onGrabMove"
      @pointerup="onGrabEnd"
      @pointercancel="onGrabEnd"
    >
      <i class="sheet-handle" aria-hidden="true"></i>
      <h2 class="sheet-title">{{ title }}</h2>
    </div>
    <div class="sheet-options" role="radiogroup" :aria-label="title">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        class="sheet-option"
        :class="{ selected: option.value === value }"
        :aria-checked="option.value === value"
        @click="emit('select', option.value)"
      >
        <span class="sheet-option-copy">
          <span class="sheet-option-line">{{ option.label }}<span v-if="option.count != null" class="sheet-option-count">{{ option.count }}</span></span>
          <small v-if="option.hint">{{ option.hint }}</small>
        </span>
        <svg v-if="option.value === value" class="sheet-option-check" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
  </a-drawer>
</template>

<!-- Шторка телепортируется в body, поэтому стили без scoped. -->
<style>
.bottom-sheet .ant-drawer-content-wrapper { right: 0 !important; bottom: 0 !important; left: 0 !important; width: min(100%, 402px) !important; margin: 0 auto; box-shadow: 0 -8px 24px rgba(0, 0, 0, .12) !important; }
.bottom-sheet .ant-drawer-content { border-radius: 16px 16px 0 0; }
.bottom-sheet .sheet-grabber { padding: 8px 8px 4px; cursor: grab; touch-action: none; }
.bottom-sheet .sheet-handle { display: block; width: 36px; height: 4px; margin: 0 auto 12px; border-radius: 2px; background: #d9d9d9; }
.bottom-sheet .sheet-title { margin: 0; color: rgba(0, 0, 0, .88); font-size: 16px; font-weight: 600; line-height: 24px; }
.bottom-sheet .ant-drawer-body { padding: 0 8px calc(16px + env(safe-area-inset-bottom)); }
.bottom-sheet .ant-drawer-body > .sheet-grabber { margin: 0 -8px; padding-left: 16px; padding-right: 16px; }
.bottom-sheet .sheet-options { display: grid; gap: 2px; }
.bottom-sheet .sheet-option { display: flex; width: 100%; min-height: 52px; align-items: center; gap: 12px; padding: 8px; border: 0; border-radius: 8px; background: none; color: rgba(0, 0, 0, .88); font-size: 15px; line-height: 20px; text-align: left; cursor: pointer; }
.bottom-sheet .sheet-option:active { background: #f5f5f5; }
.bottom-sheet .sheet-option:focus-visible { outline: 3px solid #1677ff; outline-offset: -3px; }
.bottom-sheet .sheet-option.selected { color: #1677ff; font-weight: 600; }
.bottom-sheet .sheet-option-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.bottom-sheet .sheet-option-line { display: flex; align-items: baseline; gap: 8px; }
.bottom-sheet .sheet-option-copy small { color: rgba(0, 0, 0, .65); font-size: 12px; font-weight: 400; line-height: 16px; }
.bottom-sheet .sheet-option-count { color: rgba(0, 0, 0, .65); font-size: 13px; font-variant-numeric: tabular-nums; }
.bottom-sheet .sheet-option-check { flex-shrink: 0; margin-left: auto; }
</style>
