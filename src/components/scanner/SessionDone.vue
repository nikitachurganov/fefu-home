<script setup>
import { CheckOutlined } from '@ant-design/icons-vue'
import { dateTimeLabel } from '../../data/requestModel'

// Итог приёмки для сотрудника (макет «Завершение сессии на стороне админа»): сводка закрытой заявки.
defineProps({ request: { type: Object, required: true } })
const emit = defineEmits(['home', 'sessions'])
</script>

<template>
  <section class="session-done" role="status" aria-live="polite">
    <article class="summary">
      <span class="done-icon" aria-hidden="true"><CheckOutlined /></span>
      <h3>Сессия завершена</h3>
      <p class="number">№ {{ request.id }}</p>
      <dl>
        <div><dt>ТМЦ</dt><dd>{{ request.title }}</dd></div>
        <div><dt>Склад</dt><dd>{{ request.place }}</dd></div>
        <div><dt>Дата и время начала</dt><dd>{{ dateTimeLabel(request.startsAt) }}</dd></div>
        <div><dt>Дата и время окончания</dt><dd>{{ dateTimeLabel(request.endsAt) }}</dd></div>
      </dl>
    </article>
    <div class="done-actions">
      <a-button size="large" block @click="emit('home')">Главная</a-button>
      <a-button type="primary" size="large" block @click="emit('sessions')">Активные сессии</a-button>
    </div>
  </section>
</template>

<style scoped>
.session-done { display: grid; gap: 16px; }
.summary { display: grid; justify-items: center; gap: 4px; padding: 16px; border-radius: 12px; background: #fff; }
.done-icon { display: grid; width: 52px; height: 52px; place-items: center; border-radius: 50%; background: #52c41a; color: #fff; font-size: 26px; }
.summary h3 { margin: 8px 0 0; color: #101828; font-size: 15px; font-weight: 700; line-height: 20px; }
.number { margin: 0; color: rgba(0, 0, 0, .45); font-size: 13px; line-height: 16px; }
dl { display: grid; gap: 8px; width: 100%; margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #f0f0f0; }
dl > div { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; }
dt { color: rgba(0, 0, 0, .65); font-size: 15px; line-height: 20px; }
dd { margin: 0; color: #101828; font-size: 15px; line-height: 20px; }
.done-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.done-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
