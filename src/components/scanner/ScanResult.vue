<script setup>
import { computed } from 'vue'
import { CheckCircleFilled } from '@ant-design/icons-vue'
import LessonCard from './LessonCard.vue'
import PassportView from './PassportView.vue'
import SessionDone from './SessionDone.vue'
import { scanErrors } from '../../data/scanModel'
import { findAsset } from '../../data/assets'
import { userName } from '../../data/campus'
import { MONTHS, parts } from '../../data/requestModel'

// Экран результата скана: паспорт, подтверждение чекина (его показывают модератору), отметка на паре
// или экран ошибки из таблицы scanErrors. Кнопки действий общие для всех вариантов.
const props = defineProps({
  result: { type: Object, required: true },
  // Есть ли камера: от этого зависит, что предлагать дальше.
  canUseCamera: Boolean,
  staff: Boolean,
})
const emit = defineEmits(['again', 'manual', 'close', 'open', 'feedback', 'sessions'])

const when = computed(() => {
  if (!props.result.at) return null
  const { day, month, time } = parts(props.result.at)
  return { date: `${day} ${MONTHS[month - 1]}`, time }
})

const isPassport = computed(() => props.result.ok && props.result.kind === 'passport')
const isCheckin = computed(() => props.result.ok && props.result.kind === 'checkin')
const isClass = computed(() => props.result.ok && props.result.kind === 'class')
const isInventory = computed(() => props.result.ok && props.result.kind === 'inventory')
const isSessionDone = computed(() => props.result.ok && props.result.kind === 'session-done')

// Итог инвентаризации: что найдено, чего нет и какие единицы оказались не на своём месте.
const inventory = computed(() => {
  if (!isInventory.value) return null
  const { summary } = props.result
  const title = (id) => `${findAsset(id)?.title ?? 'Неизвестный код'} · ${id}`
  const clean = !summary.missing.length && !summary.elsewhere.length && !summary.unknown.length
  return {
    status: clean ? 'success' : 'warning',
    text: `Найдено ${summary.found.length} из ${summary.total}`,
    groups: [
      { title: 'Не найдено', items: summary.missing.map(title) },
      { title: 'Числится в другом месте', items: summary.elsewhere.map(title) },
      { title: 'Неизвестные коды', items: summary.unknown },
    ].filter((group) => group.items.length),
  }
})

const view = computed(() => {
  const { result } = props
  if (!result.ok) {
    const error = scanErrors[result.error] ?? scanErrors.unrecognized
    return { status: error.status, title: error.title, text: result.detail ?? error.text }
  }
  // Итог действия сотрудника: выдача, приёмка или завершение сессии.
  if (result.kind === 'done') return { status: 'success', title: result.title, text: result.text }
  if (result.kind === 'class') {
    return { status: 'success', title: 'Вы отметились на паре', text: `${result.lesson.title} · ${result.lesson.place} · ${when.value.time}` }
  }
  return { status: 'success', title: 'Код принят', text: result.id }
})
</script>

<template>
  <PassportView v-if="isPassport" :asset="result.asset" :staff="staff" @open="(id) => emit('open', id)" />

  <!-- Отметка на паре: подтверждение и карточка занятия (на телефоне то же самое лежит поверх камеры). -->
  <section v-else-if="isClass" class="class-result">
    <p class="class-toast" role="status"><CheckCircleFilled aria-hidden="true" /> Вы отмечены · {{ when.time }}</p>
    <LessonCard :lesson="result.lesson" @feedback="emit('feedback')" />
  </section>

  <section v-else-if="isInventory" class="inventory-result">
    <a-result class="scan-result" :status="inventory.status" title="Инвентаризация завершена" :sub-title="inventory.text" />
    <div v-for="group in inventory.groups" :key="group.title" class="inventory-group">
      <h4>{{ group.title }}</h4>
      <ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul>
    </div>
  </section>

  <!-- Экран для модератора: крупно, с названием, именем и временем отметки. -->
  <section v-else-if="isCheckin" class="moderator-screen" role="status" aria-live="polite">
    <CheckCircleFilled class="moderator-check" aria-hidden="true" />
    <p class="moderator-label">Чекин подтверждён</p>
    <h3>{{ result.event.title }}</h3>
    <p class="moderator-name">{{ userName }}</p>
    <p class="moderator-time">{{ when.date }}, {{ when.time }}</p>
    <small>Покажите этот экран модератору</small>
  </section>

  <!-- Итог приёмки: сводка заявки со своими кнопками. -->
  <SessionDone v-else-if="isSessionDone" :request="result.request" @home="emit('close')" @sessions="emit('sessions')" />

  <a-result v-else class="scan-result" :status="view.status" :title="view.title" :sub-title="view.text" />

  <div v-if="!isSessionDone" class="result-actions">
    <a-button v-if="canUseCamera" type="primary" size="large" block @click="emit('again')">Сканировать ещё</a-button>
    <a-button :type="canUseCamera ? 'default' : 'primary'" size="large" block @click="emit('manual')">Ввести код вручную</a-button>
    <a-button size="large" block @click="emit('close')">Закрыть</a-button>
  </div>
</template>

<style scoped>
.scan-result { padding: 24px 0 0; }
.class-result { display: grid; gap: 12px; }
.class-toast { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0; padding: 12px 16px; border-radius: 12px; background: #f6ffed; color: #389e0d; font-size: 16px; font-weight: 600; }
.inventory-result { display: grid; gap: 12px; }
.inventory-group { display: grid; gap: 4px; }
.inventory-group h4 { margin: 0; color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 600; }
.inventory-group ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.inventory-group li { padding: 8px 12px; border-radius: 12px; background: #fff7e6; color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.result-actions { display: grid; gap: 8px; margin-top: 24px; }
.result-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
.moderator-screen { display: grid; justify-items: center; gap: 8px; padding: 32px 16px; border-radius: 16px; background: #389e0d; color: #fff; text-align: center; }
.moderator-check { font-size: 56px; }
.moderator-label { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; opacity: .9; }
.moderator-screen h3 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; line-height: 32px; }
.moderator-name { margin: 8px 0 0; font-size: 20px; font-weight: 600; }
.moderator-time { margin: 0; font-size: 18px; font-variant-numeric: tabular-nums; }
.moderator-screen small { margin-top: 8px; opacity: .85; }
</style>
