<script setup>
import { computed, ref } from 'vue'
import { CheckCircleFilled, DownloadOutlined, EnvironmentOutlined, ScanOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons-vue'
import CodeEntrySheet from './CodeEntrySheet.vue'
import TimerRing from './TimerRing.vue'
import { tmcCategories } from '../../data/assets'
import { userEmail, userName, userPhone, userRole } from '../../data/campus'
import { MONTHS, parts, relativeDay } from '../../data/requestModel'
import { itemLabel, previewCode, progress, sessionKinds } from '../../data/sessionModel'

// Выдача или приёмка ТМЦ и оборудования. Обычный вид — заявка со списком позиций: у каждой
// «Ввести код» и кнопка камеры. Компактный вид лежит поверх камеры: только список со статусами.
const props = defineProps({
  session: { type: Object, required: true },
  request: { type: Object, required: true },
  // { type: 'success' | 'warning' | 'error' | 'info', text }
  feedback: { type: Object, default: null },
  compact: Boolean,
  // Камера есть только на телефоне: на ПК остаётся ввод кода.
  canUseCamera: Boolean,
  // Шторку ввода кода поднимаем выше экрана сканера.
  sheetZ: { type: Number, default: undefined },
})
const emit = defineEmits(['scan', 'code'])

const info = computed(() => sessionKinds[props.session.kind])
const isIssue = computed(() => props.session.kind === 'issue')
const counter = computed(() => progress(props.session))
const noun = computed(() => (props.request.source === 'tmc' ? 'ТМЦ' : 'оборудования'))
const listTitle = computed(() => (props.request.source === 'tmc' ? 'Список ТМЦ' : 'Список оборудования'))

const pad = (value) => String(value).padStart(2, '0')
const receive = computed(() => {
  const start = parts(props.request.startsAt)
  const day = relativeDay(props.request)?.toLowerCase() || `${start.day} ${MONTHS[start.month - 1]}`
  return `${day}, ${start.time}`
})
const giveBack = computed(() => {
  const end = parts(props.request.endsAt)
  return `до ${end.time}, ${pad(end.day)}.${pad(end.month)}.${end.year}`
})

const category = (item) => tmcCategories[item.modelId] ?? 'Оборудование'
// У позиции-модели единица выбирается сканом, поэтому после него показываем, какая именно.
const subtitle = (item) => (item.unitId && item.kind === 'model' ? `${category(item)} · ${item.unitId}` : category(item))
const doneLabel = (item) => {
  if (item.replaced) return 'Аналог'
  return isIssue.value ? 'Подтверждено' : 'Принято'
}

// Ручной ввод кода для одной позиции: шторка открывается по «Ввести код».
const entering = ref(null)
const checkCode = (text) => (entering.value ? previewCode(props.session, entering.value.key, text) : 'empty')
const entryHint = computed(() => (isIssue.value
  ? `Введите инвентарный код ${noun.value} для подтверждения наличия`
  : `Введите инвентарный код ${noun.value} для подтверждения возврата и отсутствия дефектов`))

function submitCode(code) {
  entering.value = null
  emit('code', code)
}
</script>

<template>
  <!-- Поверх камеры: только список позиций и подсказка по последнему скану. -->
  <section v-if="compact" class="session compact" :aria-label="info.title">
    <a-alert v-if="feedback" show-icon :type="feedback.type" :message="feedback.text" role="status" />
    <ul class="items">
      <li v-for="item in session.items" :key="item.key">
        <div class="row">
          <span class="copy"><strong>{{ itemLabel(item) }}</strong><small>{{ category(item) }}</small></span>
          <span class="state" :class="{ ok: item.unitId }">{{ item.unitId ? 'Готово' : 'Ждёт скана' }}</span>
        </div>
      </li>
    </ul>
  </section>

  <section v-else class="session" :aria-label="info.title">
    <!-- Выдача: сводка заявки. Приёмка: кто пришёл и сколько осталось до возврата. -->
    <article v-if="isIssue" class="card request-card">
      <header class="request-head">
        <h3>Заявка #{{ request.id }}</h3>
        <a-tag color="gold">К выдаче</a-tag>
      </header>
      <p class="line who"><UserOutlined aria-hidden="true" /><span><strong>{{ userName }}</strong><small>{{ userEmail }}</small></span></p>
      <p class="line"><UploadOutlined aria-hidden="true" /><span><span class="muted">Получение:</span> {{ receive }}</span></p>
      <p class="line"><DownloadOutlined aria-hidden="true" /><span><span class="muted">Возврат:</span> {{ giveBack }}</span></p>
      <p class="line"><EnvironmentOutlined aria-hidden="true" /><span>{{ request.place }}</span></p>
    </article>

    <template v-else>
      <article class="card user-card">
        <h3>{{ userName }}</h3>
        <p>{{ userEmail }} <span aria-hidden="true">•</span> {{ userPhone }}</p>
        <p>{{ userRole }}</p>
      </article>
      <TimerRing :request="request" />
    </template>

    <h3 class="list-title">
      {{ listTitle }}
      <span v-if="!isIssue" class="counter" aria-live="polite">Принято: {{ counter.done }} из {{ counter.total }}</span>
    </h3>

    <a-alert v-if="feedback" show-icon :type="feedback.type" :message="feedback.text" role="status" />

    <ul class="items">
      <li v-for="item in session.items" :key="item.key">
        <div class="row">
          <span class="copy">
            <strong>{{ itemLabel(item) }}</strong>
            <small>{{ subtitle(item) }}</small>
          </span>
          <span v-if="item.unitId" class="done-state" :class="{ analog: item.replaced }">
            <a-tag v-if="item.condition === 'problem'" color="red">Проблема</a-tag>
            <CheckCircleFilled aria-hidden="true" />{{ doneLabel(item) }}
          </span>
          <span v-else class="row-actions">
            <button type="button" class="enter-code" @click="entering = item">Ввести код</button>
            <button v-if="canUseCamera" type="button" class="scan-button" :aria-label="`Сканировать: ${itemLabel(item)}`" @click="emit('scan')">
              <ScanOutlined aria-hidden="true" />
            </button>
          </span>
        </div>
      </li>
    </ul>

    <a-alert
      v-if="!isIssue && request.problems?.length"
      type="warning"
      show-icon
      message="Пользователь сообщил о проблемах"
      :description="request.problems.map((problem) => problem.text).join('; ')"
    />

    <slot />

    <CodeEntrySheet
      :open="!!entering"
      :z-index="sheetZ"
      :title="entering ? itemLabel(entering) : ''"
      :hint="entryHint"
      :check="checkCode"
      @close="entering = null"
      @submit="submitCode"
    />
  </section>
</template>

<style scoped>
.session { display: grid; gap: 16px; }
.session.compact { gap: 8px; max-height: 46dvh; overflow-y: auto; padding: 12px; border-radius: 12px; background: #fff; }
.card { display: grid; gap: 8px; padding: 12px 16px; border-radius: 12px; background: #fff; }
.request-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.request-head h3 { margin: 0; color: #0e1325; font-size: 19px; font-weight: 700; line-height: 26px; }
.request-head :deep(.ant-tag) { margin: 0; }
.line { display: flex; align-items: flex-start; gap: 8px; margin: 0; color: rgba(0, 0, 0, .88); font-size: 13px; line-height: 16px; }
.line > :first-child { color: rgba(0, 0, 0, .45); font-size: 16px; }
.who span { display: grid; gap: 4px; }
.who strong { font-weight: 400; }
.who small { color: rgba(0, 0, 0, .45); font-size: 11px; line-height: 12px; }
.muted { color: rgba(0, 0, 0, .45); }
.user-card { gap: 4px; padding: 16px; }
.user-card h3 { margin: 0; color: #101828; font-size: 15px; font-weight: 700; line-height: 20px; }
.user-card p { margin: 0; color: rgba(0, 0, 0, .45); font-size: 13px; line-height: 20px; }
.list-title { display: flex; align-items: baseline; justify-content: space-between; margin: 0; color: rgba(0, 0, 0, .88); font-size: 19px; font-weight: 700; line-height: 24px; }
.counter { color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 400; line-height: 16px; font-variant-numeric: tabular-nums; }
.items { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.items li { padding: 12px; border-radius: 12px; background: #fbfcff; }
.compact .items li { padding: 8px 12px; background: #fff; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.copy { display: grid; min-width: 0; gap: 4px; }
.copy strong { color: rgba(0, 0, 0, .88); font-size: 15px; font-weight: 700; line-height: 20px; }
.copy small { color: rgba(0, 0, 0, .45); font-size: 11px; line-height: 12px; }
.state { color: rgba(0, 0, 0, .45); font-size: 11px; white-space: nowrap; }
.state.ok { color: #52c41a; }
.done-state { display: flex; flex-shrink: 0; align-items: center; gap: 4px; color: #52c41a; font-size: 14px; line-height: 22px; white-space: nowrap; }
.done-state.analog { color: #d48806; }
.done-state :deep(.ant-tag) { margin: 0 4px 0 0; }
.row-actions { display: flex; flex-shrink: 0; align-items: center; gap: 4px; }
.enter-code { min-height: 32px; padding: 0 15px; border: 1px solid #d9d9d9; border-radius: 6px; background: #fff; box-shadow: 0 2px 0 rgba(0, 0, 0, .02); color: rgba(0, 0, 0, .88); font-size: 14px; cursor: pointer; }
.scan-button { display: grid; width: 32px; height: 32px; place-items: center; border: 0; border-radius: 6px; background: #2d82cf; box-shadow: 0 2px 0 rgba(5, 145, 255, .1); color: #fff; font-size: 14px; cursor: pointer; }
.enter-code:active, .scan-button:active { opacity: .72; }
.enter-code:focus-visible, .scan-button:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
</style>
