<script setup>
// Акцентный блок над «Сейчас у вас»: только просроченные возвраты. Появляется, пока есть что вернуть.
defineProps({
  items: { type: Array, required: true },
})
const emit = defineEmits(['action'])
</script>

<template>
  <section class="overdue" aria-labelledby="widget-attention">
    <header class="overdue-head">
      <h2 id="widget-attention">Просрочен возврат</h2>
      <span class="overdue-count" :aria-label="`, заявок: ${items.length}`">{{ items.length }}</span>
    </header>
    <ul class="overdue-list">
      <li v-for="item in items" :key="item.key" class="overdue-row">
        <span class="overdue-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z M12 10v5 M12 18h.01" /></svg>
        </span>
        <span class="overdue-copy">
          <strong>{{ item.title }}</strong>
          <span>{{ item.body }}</span>
        </span>
        <a-button class="overdue-action" @click="emit('action', item)">{{ item.action.label }}</a-button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.overdue { display: flex; flex-direction: column; gap: 12px; padding: 16px 20px; border-radius: 16px; background: #262626; color: #fff; }
.overdue-head { display: flex; align-items: center; gap: 8px; }
.overdue-head h2 { margin: 0; color: #fff; font-size: 17px; font-weight: 700; line-height: 24px; }
.overdue-count { display: inline-grid; min-width: 22px; height: 22px; padding: 0 7px; place-items: center; border-radius: 11px; background: rgba(255, 255, 255, .2); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.overdue-list { display: grid; margin: 0; padding: 0; gap: 8px; list-style: none; }
.overdue-row { display: flex; min-height: 56px; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 12px; background: rgba(255, 255, 255, .08); }
.overdue-icon { display: grid; width: 36px; height: 36px; flex-shrink: 0; place-items: center; border-radius: 50%; background: rgba(255, 255, 255, .16); }
.overdue-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.overdue-copy strong { font-size: 15px; line-height: 20px; }
.overdue-copy span { color: rgba(255, 255, 255, .75); font-size: 13px; line-height: 18px; }
.overdue-action.ant-btn { flex-shrink: 0; border-color: transparent; border-radius: 8px; }
</style>
