<script setup>
import { LockOutlined } from '@ant-design/icons-vue'

// Общая оболочка виджета главной на ПК: заголовок, счётчик, действия, тело и подвал.
// locked — превью для гостя: вместо содержимого замок и кнопка входа.
defineProps({
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  subtitle: { type: String, default: '' },
  count: { type: Number, default: 0 },
  countLabel: { type: String, default: '' },
  // bare — без белой карточки: содержимое лежит прямо на фоне страницы.
  bare: Boolean,
  locked: Boolean,
  lockedText: { type: String, default: '' },
})
const emit = defineEmits(['login'])
</script>

<template>
  <section class="widget" :class="{ bare }" :aria-labelledby="titleId">
    <header class="widget-head">
      <div class="widget-heading">
        <h2 :id="titleId">
          {{ title }}
          <span v-if="count" class="widget-count" :aria-label="countLabel ? `, ${countLabel}: ${count}` : undefined">{{ count }}</span>
        </h2>
        <p v-if="subtitle" class="widget-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions && !locked" class="widget-actions"><slot name="actions" /></div>
    </header>

    <div v-if="locked" class="widget-locked">
      <span class="lock-icon" aria-hidden="true"><LockOutlined /></span>
      <p>{{ lockedText }}</p>
      <a-button @click="emit('login')">Войти</a-button>
    </div>
    <slot v-else />

    <footer v-if="$slots.footer && !locked" class="widget-foot"><slot name="footer" /></footer>
  </section>
</template>

<style scoped>
.widget { display: flex; min-width: 0; flex-direction: column; gap: 16px; padding: 20px; border-radius: 16px; background: #fff; color: rgba(0, 0, 0, .88); }
.widget.bare { padding: 0; background: transparent; }
.widget-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.widget-heading { min-width: 0; }
.widget-head h2 { display: flex; margin: 0; align-items: center; gap: 8px; color: #101828; font-size: 17px; font-weight: 700; line-height: 24px; }
.widget-subtitle { margin: 2px 0 0; color: rgba(0, 0, 0, .55); font-size: 13px; line-height: 18px; }
.widget-count { display: inline-grid; min-width: 22px; height: 22px; padding: 0 7px; place-items: center; border-radius: 11px; background: #f0f0f0; color: rgba(0, 0, 0, .65); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.widget-actions { display: flex; flex-shrink: 0; align-items: center; gap: 4px; }
.widget-foot { display: flex; justify-content: flex-end; margin-top: -4px; }
.widget-locked { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 16px; border: 1px dashed #d9d9d9; border-radius: 12px; color: rgba(0, 0, 0, .55); font-size: 14px; line-height: 20px; }
.widget-locked p { min-width: 180px; flex: 1; margin: 0; }
.lock-icon { display: grid; width: 36px; height: 36px; flex-shrink: 0; place-items: center; border-radius: 10px; background: #f5f5f5; font-size: 16px; }
</style>
