<script setup>
import { computed, ref } from 'vue'
import { assetTypes, findAsset, tmcModels } from '../../data/assets'
import { userName } from '../../data/campus'
import { formatWhen, requestSources, requestStatuses } from '../../data/requestModel'

// Заявка по коду для сотрудника: кто взял, на какой срок, что в составе. Действие зависит от кода:
// заявка на оборудование или ТМЦ ведёт к выдаче, рабочее место — к подтверждению начала,
// код возврата — к приёмке, код чекаута — к проверке места.
const props = defineProps({
  request: { type: Object, required: true },
  kind: { type: String, required: true },
})
const emit = defineEmits(['confirm-start', 'finish-workplace'])

const source = computed(() => requestSources.find((item) => item.value === props.request.source)?.label)
const status = computed(() => requestStatuses[props.request.status])
const items = computed(() => (props.request.items ?? []).map((item) => {
  if (item.kind === 'model') return { title: `${tmcModels[item.modelId] ?? 'Позиция'} (любая свободная)`, caption: 'Подойдёт любой экземпляр модели' }
  const asset = findAsset(item.unitId)
  return { title: asset?.title ?? item.unitId, caption: `${assetTypes[asset?.type]?.label ?? 'Единица'} · ${item.unitId}` }
}))

const condition = ref('ok')
const note = ref('')
const noteError = computed(() => condition.value === 'problem' && !note.value.trim())
const checked = ref(false)

function finishWorkplace() {
  checked.value = true
  if (noteError.value) return
  emit('finish-workplace', { condition: condition.value, note: note.value.trim() })
}
</script>

<template>
  <article class="staff-request" aria-label="Заявка">
    <header class="staff-head">
      <span class="staff-source">{{ source }} · заявка №{{ request.id }}</span>
      <h3>{{ request.title }}</h3>
      <p class="staff-line"><strong>{{ userName }}</strong></p>
      <p class="staff-line">{{ formatWhen(request) }}</p>
      <p class="staff-line">{{ request.place }}</p>
      <a-tag :color="status.color">{{ status.label }}</a-tag>
    </header>

    <section class="staff-items" aria-labelledby="staff-items-title">
      <h4 id="staff-items-title">Состав</h4>
      <ul>
        <li v-for="(item, index) in items" :key="index">
          <strong>{{ item.title }}</strong>
          <small>{{ item.caption }}</small>
        </li>
      </ul>
    </section>

    <a-alert
      v-if="request.problems?.length"
      type="warning"
      show-icon
      message="Пользователь сообщил о проблемах"
      :description="request.problems.map((problem) => problem.text).join('; ')"
    />

    <!-- Выдача и приёмка оборудования и ТМЦ открываются сразу списком позиций (SessionView), здесь — рабочие места. -->
    <div v-if="kind === 'request'" class="staff-actions">
      <a-button type="primary" size="large" block @click="emit('confirm-start')">Подтвердить начало</a-button>
    </div>

    <form v-else class="staff-checkout" novalidate @submit.prevent="finishWorkplace">
      <h4>Целостность места</h4>
      <a-segmented v-model:value="condition" block size="large" :options="[{ value: 'ok', label: 'Всё в порядке' }, { value: 'problem', label: 'Есть замечания' }]" aria-label="Состояние рабочего места" />
      <template v-if="condition === 'problem'">
        <a-textarea v-model:value="note" class="staff-note" :auto-size="{ minRows: 2, maxRows: 4 }" :status="checked && noteError ? 'error' : undefined" placeholder="Что не так с местом" aria-label="Замечание" />
        <p v-if="checked && noteError" class="staff-error" role="alert">Опишите замечание</p>
      </template>
      <a-button type="primary" size="large" block html-type="submit">Завершить сессию</a-button>
    </form>
  </article>
</template>

<style scoped>
.staff-request { display: grid; gap: 16px; }
.staff-head { display: grid; justify-items: start; gap: 4px; padding: 16px; border-radius: 12px; background: #fff; }
.staff-source { color: rgba(0, 0, 0, .45); font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.staff-head h3 { margin: 0; color: #101828; font-size: 20px; font-weight: 700; line-height: 28px; }
.staff-line { margin: 0; color: rgba(0, 0, 0, .65); font-size: 14px; line-height: 20px; }
.staff-line strong { color: rgba(0, 0, 0, .88); }
.staff-head :deep(.ant-tag) { margin: 8px 0 0; }
.staff-items { display: grid; gap: 4px; }
.staff-items h4, .staff-checkout h4 { margin: 0; color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 600; }
.staff-items ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.staff-items li { display: grid; gap: 2px; padding: 8px 16px; border-radius: 12px; background: #fff; }
.staff-items li strong { color: rgba(0, 0, 0, .88); font-size: 15px; line-height: 20px; }
.staff-items li small { color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; }
.staff-actions, .staff-checkout { display: grid; gap: 8px; }
.staff-error { margin: 0; color: #cf1322; font-size: 13px; line-height: 18px; }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.staff-note { font-size: 16px; }
.staff-request :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
