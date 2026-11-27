<script setup>
import { computed } from 'vue'
import { role, roleOptions } from '../data/userStore'

// Профиль пока состоит из демо-переключателя роли: от неё зависит, какие коды может сканировать пользователь.
const current = computed({
  get: () => role.value,
  set: (value) => { role.value = value },
})
</script>

<template>
  <section class="profile-page" aria-labelledby="profile-title">
    <a-typography-title id="profile-title" :level="3">Профиль</a-typography-title>

    <div class="demo-card">
      <h2>Демо-режим</h2>
      <p>Роль определяет, какие коды принимает сканер: сотрудник склада и модератор бронирования сканируют коды заявок, возврата и чекаута и проводят инвентаризацию, преподаватель — QR студентов. Роли взяты из спецификации ролей. В настоящем приложении роль приходит с сервера.</p>
      <a-select v-model:value="current" size="large" :options="roleOptions" show-search option-filter-prop="label" aria-label="Роль в демо-режиме" />
    </div>
  </section>
</template>

<style scoped>
.profile-page { display: grid; gap: 16px; }
.profile-page :deep(.ant-typography) { margin: 0; }
.demo-card { display: grid; gap: 12px; padding: 16px; border-radius: 12px; background: #fff; }
.demo-card h2 { margin: 0; color: #101828; font-size: 16px; font-weight: 600; line-height: 24px; }
.demo-card p { margin: 0; color: rgba(0, 0, 0, .65); font-size: 14px; line-height: 20px; }
</style>
