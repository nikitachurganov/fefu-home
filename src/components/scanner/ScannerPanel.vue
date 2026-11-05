<script setup>
import { CloseOutlined, LeftOutlined } from '@ant-design/icons-vue'
import { useMediaQuery } from '../../composables/useMediaQuery'

// Оболочка экранов сканера без камеры (ручной ввод, результат, сессия):
// на ПК — центрированный модал, на телефоне — белая страница поверх приложения.
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  canGoBack: Boolean,
})
const emit = defineEmits(['close', 'back'])

const isDesktop = useMediaQuery('(min-width: 1024px)')
</script>

<template>
  <a-modal v-if="isDesktop" :open="true" :title="title" :footer="null" :width="420" centered @cancel="emit('close')">
    <p v-if="subtitle" class="panel-subtitle">{{ subtitle }}</p>
    <div class="panel-body"><slot /></div>
    <div v-if="$slots.footer" class="panel-footer"><slot name="footer" /></div>
  </a-modal>

  <Teleport v-else to="body">
    <div class="scanner-page" role="dialog" aria-modal="true" aria-labelledby="scanner-page-title">
      <header class="scanner-page-top">
        <button v-if="canGoBack" type="button" class="scanner-page-button" aria-label="Назад" @click="emit('back')">
          <LeftOutlined />
        </button>
        <div class="scanner-page-heading">
          <h2 id="scanner-page-title" class="scanner-page-title">{{ title }}</h2>
          <p v-if="subtitle" class="scanner-page-subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="scanner-page-button" aria-label="Закрыть сканер" @click="emit('close')">
          <CloseOutlined />
        </button>
      </header>
      <div class="scanner-page-body"><slot /></div>
      <footer v-if="$slots.footer" class="scanner-page-footer"><slot name="footer" /></footer>
    </div>
  </Teleport>
</template>

<style scoped>
.scanner-page {
  position: fixed;
  z-index: 1100;
  top: 0;
  bottom: 0;
  left: 50%;
  display: flex;
  width: min(100%, 402px);
  flex-direction: column;
  background: #f5f5f5;
  transform: translateX(-50%);
}
.scanner-page-top { display: flex; min-height: 64px; flex-shrink: 0; align-items: center; gap: 8px; padding: 10px 12px 10px 16px; background: #fff; box-shadow: 0 1px 0 #f0f0f0; }
.scanner-page-heading { flex: 1; min-width: 0; }
.scanner-page-title { margin: 0; color: #101828; font-size: 20px; font-weight: 700; line-height: 28px; }
.scanner-page-subtitle { margin: 0; color: rgba(0, 0, 0, .45); font-size: 14px; line-height: 20px; }
.panel-subtitle { margin: 0 0 12px; color: rgba(0, 0, 0, .45); font-size: 14px; line-height: 20px; }
.panel-footer { margin-top: 16px; }
.scanner-page-footer { display: grid; flex-shrink: 0; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -1px 0 #f0f0f0; }
.scanner-page-footer :deep(.ant-btn) { height: 48px; border-radius: 8px; }
.scanner-page-button { display: grid; width: 44px; height: 44px; flex-shrink: 0; place-items: center; border: 0; border-radius: 50%; background: none; color: rgba(0, 0, 0, .65); font-size: 16px; cursor: pointer; }
.scanner-page-button:active { background: #f5f5f5; }
.scanner-page-button:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.scanner-page-body { flex: 1; overflow-y: auto; padding: 16px 16px calc(24px + env(safe-area-inset-bottom)); }
</style>
