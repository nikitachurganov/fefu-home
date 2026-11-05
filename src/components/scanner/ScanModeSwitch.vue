<script setup>
// Режим сканера сотрудника: обычный (коды объектов, заявок, возврата) или инвентаризация области.
// Пользователю переключатель не показываем: у него один режим.
const mode = defineModel({ type: String, default: 'scan' })

const options = [
  { label: 'Сканер', value: 'scan' },
  { label: 'Инвентаризация', value: 'inventory' },
]
</script>

<template>
  <a-segmented v-model:value="mode" class="scan-mode" block size="large" :options="options" aria-label="Режим сканера" />
</template>

<style scoped>
.scan-mode { border-radius: 12px; }
</style>
