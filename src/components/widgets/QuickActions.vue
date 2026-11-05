<script setup>
import { LockOutlined } from '@ant-design/icons-vue'

// Полоса быстрых действий под приветствием. Действия, которым нужен вход, гостю видны, но закрыты.
defineProps({
  items: { type: Array, required: true },
  authenticated: Boolean,
})
const emit = defineEmits(['select'])
</script>

<template>
  <section class="action-strip" aria-label="Быстрые действия">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="action-tile"
      :disabled="item.requiresAuth && !authenticated"
      :aria-label="item.requiresAuth && !authenticated ? `${item.label}, доступно после входа` : item.label"
      @click="emit('select', item)"
    >
      <span class="action-icon" aria-hidden="true">
        <component :is="item.component" v-if="item.component" />
        <img v-else :src="item.icon" alt="" />
      </span>
      <span class="action-label">{{ item.label }}</span>
      <LockOutlined v-if="item.requiresAuth && !authenticated" class="action-lock" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
/* Вторичный уровень: заметно и удобно, но тише, чем «Требует внимания». */
.action-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.action-tile { position: relative; display: flex; min-height: 48px; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #f0f0f0; border-radius: 12px; background: #fff; color: rgba(0, 0, 0, .88); font-size: 14px; font-weight: 500; line-height: 18px; text-align: left; cursor: pointer; transition: border-color 160ms ease, background-color 160ms ease; }
.action-tile:not(:disabled):hover { border-color: #d6e4ff; background: #f0f5ff; }
.action-tile:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.action-tile:disabled { padding-right: 28px; color: rgba(0, 0, 0, .45); cursor: not-allowed; }
.action-tile:disabled .action-icon { opacity: .45; }
.action-icon { display: grid; width: 32px; height: 32px; flex-shrink: 0; place-items: center; border-radius: 10px; background: rgba(71, 154, 232, .12); color: #1677ff; font-size: 18px; }
.action-icon img { width: 20px; height: 20px; }
.action-label { min-width: 0; }
.action-lock { position: absolute; top: 50%; right: 10px; color: rgba(0, 0, 0, .45); font-size: 12px; transform: translateY(-50%); }
@media (prefers-reduced-motion: reduce) {
  .action-tile { transition: none; }
}
</style>
