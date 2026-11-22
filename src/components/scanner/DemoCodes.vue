<script setup>
import { computed } from 'vue'
import { demoCodeGroupsFor } from '../../data/demoCodes'
import { role, roleOptions } from '../../data/userStore'

// Список демо-кодов: в превью и на ПК нет камеры, а коды действий руками не введёшь.
// Тап по строке действует как скан этого кода. По умолчанию показываем коды текущей роли;
// в сессии ScannerFlow передаёт свои группы (единицы заявки).
const props = defineProps({ groups: { type: Array, default: null } })
const emit = defineEmits(['pick'])

const shown = computed(() => props.groups ?? demoCodeGroupsFor(role.value))
const roleLabel = computed(() => roleOptions.find((option) => option.value === role.value)?.label)
// Роль можно сменить не выходя из сканера: флоу ТМЦ (выдача и приёмка) открывается только у сотрудника.
const current = computed({
  get: () => role.value,
  set: (value) => { role.value = value },
})
</script>

<template>
  <section class="demo-codes" aria-label="Демо-коды">
    <h3>Демо-коды (только dev){{ groups ? '' : ` · ${roleLabel}` }}</h3>
    <template v-if="!groups">
      <a-segmented v-model:value="current" block :options="roleOptions" aria-label="Роль в демо-режиме" />
      <p class="demo-hint">Показаны коды для роли «{{ roleLabel }}». Выдача и приёмка ТМЦ — в роли «Сотрудник»: коды заявки и возврата.</p>
    </template>
    <div v-for="group in shown" :key="group.title" class="demo-group">
      <h4>{{ group.title }}</h4>
      <button v-for="code in group.codes" :key="code.text" type="button" class="demo-code" @click="emit('pick', code.text)">
        <span>{{ code.label }}</span>
        <small>{{ code.text }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.demo-codes { display: grid; min-width: 0; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #d9d9d9; }
.demo-codes h3 { margin: 0; color: rgba(0, 0, 0, .45); font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.demo-hint { margin: 0; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; }
.demo-codes :deep(.ant-segmented) { min-width: 0; max-width: 100%; overflow-x: auto; }
.demo-group { display: grid; min-width: 0; gap: 4px; }
.demo-group h4 { margin: 4px 0 0; color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 600; }
.demo-code { display: grid; gap: 2px; padding: 8px 12px; border: 1px solid #f0f0f0; border-radius: 8px; background: #fff; color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; text-align: left; cursor: pointer; }
.demo-code:active { background: #f5f5f5; }
.demo-code:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.demo-code small { overflow: hidden; color: rgba(0, 0, 0, .45); font-size: 12px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap; }
</style>
