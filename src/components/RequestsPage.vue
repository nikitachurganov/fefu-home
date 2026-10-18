<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import BottomSheet from './BottomSheet.vue'
import { mockRequests } from '../data/requests'
import {
  canCancel,
  cancelRequest,
  countByFilter,
  countOpenBySource,
  feedRequests,
  formatWhen,
  isMultiDay,
  pickHighlights,
  requestFilters,
  requestGroups,
  requestSortOptions,
  requestSources,
  requestSteps,
  requestStatuses,
  statusHints,
  timerLabel,
  whenLabel,
} from '../data/requestModel'
import dateIcon from '../assets/requests/date.svg'
import placeIcon from '../assets/requests/place.svg'
import placeWhiteIcon from '../assets/requests/place-white.svg'
import dateMutedIcon from '../assets/requests/date-muted.svg'
import placeMutedIcon from '../assets/requests/place-muted.svg'
import rightMutedIcon from '../assets/requests/right-muted.svg'
import rightWhiteIcon from '../assets/requests/right-white.svg'
import chevronIcon from '../assets/requests/down.svg'
import eventsIcon from '../assets/figma/event-candidate-1.svg'

const props = defineProps({
  authenticated: Boolean,
  // Заявка, которую нужно сразу открыть (переход из уведомления).
  focusRequestId: { type: String, default: null },
})
const emit = defineEmits(['login', 'focused'])

const requests = ref(mockRequests.map((request) => ({ ...request })))
const selectedSource = ref('events')
const selectedFilter = ref('all')
const selectedId = ref(null)
const confirmingCancel = ref(false)
const selectedSort = ref('relevance')

const selectedRequest = computed(() => requests.value.find((request) => request.id === selectedId.value) ?? null)
const feed = computed(() => feedRequests(requests.value, selectedSource.value, selectedFilter.value, selectedSort.value))
const filterCounts = computed(() => countByFilter(requests.value, selectedSource.value))
const openSheet = ref(null)
const currentFilter = computed(() => requestFilters.find((filter) => filter.value === selectedFilter.value))
const currentSort = computed(() => requestSortOptions.find((option) => option.value === selectedSort.value))
const sheetTitle = computed(() => (openSheet.value === 'filter' ? 'Статус заявки' : 'Сортировка'))
const sheetOptions = computed(() => (openSheet.value === 'filter'
  ? requestFilters.map((filter) => ({ ...filter, count: filterCounts.value[filter.value] }))
  : requestSortOptions))
const sheetValue = computed(() => (openSheet.value === 'filter' ? selectedFilter.value : selectedSort.value))
function pickOption(value) {
  if (openSheet.value === 'filter') selectedFilter.value = value
  else selectedSort.value = value
  openSheet.value = null
}
const emptyText = computed(() => requestGroups.find((group) => group.key === selectedFilter.value)?.emptyText ?? 'В этом разделе у вас пока нет заявок')
const openCounts = computed(() => countOpenBySource(requests.value))
const highlights = computed(() => pickHighlights(requests.value))

// Таймер активной заявки тикает раз в секунду, пока открыта страница.
const now = ref(Date.now())
let tick
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(tick))
const timerOf = (request) => timerLabel(request, now.value)
// У активной заявки плитка цветная (синяя, жёлтая или красная) — текст и иконки белые.
const onDark = (request) => request.status === 'active'
const highlightIndex = ref(0)
function onHighlightsScroll(event) {
  const track = event.currentTarget
  const card = track.firstElementChild
  if (!card) return
  const step = card.offsetWidth + 8
  highlightIndex.value = Math.min(highlights.value.length - 1, Math.round(track.scrollLeft / step))
}
const steps = computed(() => (selectedRequest.value ? requestSteps(selectedRequest.value) : null))
const sourceLabel = (source) => requestSources.find((item) => item.value === source)?.label

// Переход из уведомления: переключаем категорию, сбрасываем фильтр и открываем деталь заявки.
watch(() => props.focusRequestId, (id) => {
  const target = requests.value.find((request) => request.id === id)
  if (!target) return
  selectedSource.value = target.source
  selectedFilter.value = 'all'
  selectedId.value = target.id
  emit('focused')
}, { immediate: true })

// Состояние подтверждения отмены не должно переходить на другую заявку.
watch(selectedId, () => { confirmingCancel.value = false })

// Блок подтверждения появляется внизу длинной карточки — подводим к нему экран.
const cancelBox = ref(null)
watch(confirmingCancel, async (open) => {
  if (!open) return
  await nextTick()
  cancelBox.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

function iconsFor(request) {
  if (request.statusGroup === 'archive') return { date: dateMutedIcon, place: placeMutedIcon }
  return { date: dateIcon, place: placeIcon }
}

function confirmCancel() {
  const request = selectedRequest.value
  if (!request) return
  const index = requests.value.findIndex((item) => item.id === request.id)
  requests.value[index] = cancelRequest(request)
  selectedId.value = null
  message.success(`Заявка №${request.id} отменена и перенесена в архив`)
}
</script>

<template>
  <section class="requests-page" aria-labelledby="requests-title">
    <a-typography-title id="requests-title" class="requests-title" :level="3">Мои заявки</a-typography-title>

    <div v-if="!authenticated" class="requests-login">
      <a-empty description="Войдите, чтобы увидеть свои заявки" />
      <a-button type="primary" size="large" @click="emit('login')">Войти в аккаунт</a-button>
    </div>

    <template v-else>
      <section v-if="highlights.length" class="request-highlights" aria-label="Ближайшие заявки">
        <div class="highlights-track" @scroll.passive="onHighlightsScroll">
          <button
            v-for="request in highlights"
            :key="request.id"
            type="button"
            class="highlight-card"
            :class="request.status === 'active' ? ['is-active', `state-${timerOf(request).state}`] : null"
            :aria-label="`${request.status === 'active' ? `Активная заявка: ${request.title}. ${timerOf(request).overdue ? 'Превышено на' : 'Осталось'} ${timerOf(request).spoken}` : `Ближайшая заявка: ${request.title}. ${whenLabel(request)}`}. ${request.place}`"
            @click="selectedId = request.id"
          >
            <span class="highlight-top">
              <span class="highlight-tag">{{ request.status === 'active' ? (timerOf(request).overdue ? 'Просрочено' : 'Активная') : 'Ближайшая' }}</span>
              <img :src="onDark(request) ? rightWhiteIcon : rightMutedIcon" alt="" />
            </span>
            <strong>{{ request.title }}</strong>
            <span
              v-if="request.status === 'active'"
              class="highlight-progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="timerOf(request).percent"
              :aria-valuetext="`${timerOf(request).overdue ? 'Превышено на' : 'Осталось'} ${timerOf(request).spoken}`"
            >
              <span class="progress-head">
                <span>{{ timerOf(request).overdue ? 'Превышено на' : 'Осталось' }}</span>
                <b class="timer-value">{{ timerOf(request).text }}</b>
              </span>
              <span class="progress-track"><span class="progress-fill" :style="{ width: `${timerOf(request).percent}%` }"></span></span>
            </span>
            <span v-else class="request-meta"><img :src="dateMutedIcon" alt="" />{{ whenLabel(request) }}</span>
            <span class="request-meta"><img :src="onDark(request) ? placeWhiteIcon : placeMutedIcon" alt="" />{{ request.place }}</span>
          </button>
        </div>
        <div v-if="highlights.length > 1" class="highlight-dots" aria-hidden="true">
          <i v-for="(request, index) in highlights" :key="request.id" :class="{ on: index === highlightIndex }"></i>
        </div>
      </section>

      <div class="request-sources-bar">
        <a-tabs v-model:active-key="selectedSource" class="request-sources" aria-label="Категории заявок">
          <a-tab-pane v-for="source in requestSources" :key="source.value">
            <template #tab>
              {{ source.label }}
              <span
                v-if="openCounts[source.value]"
                class="source-count"
                :aria-label="`, активных заявок: ${openCounts[source.value]}`"
              >{{ openCounts[source.value] }}</span>
            </template>
          </a-tab-pane>
        </a-tabs>
        <div class="request-controls">
          <button type="button" class="sheet-trigger" aria-haspopup="dialog" :aria-label="`Статус: ${currentFilter.label}. Изменить`" @click="openSheet = 'filter'">
            <span class="sheet-trigger-text"><small>Статус</small>{{ currentFilter.label }}</span>
            <img :src="chevronIcon" alt="" />
          </button>
          <button type="button" class="sheet-trigger" aria-haspopup="dialog" :aria-label="`Сортировка: ${currentSort.label}. Изменить`" @click="openSheet = 'sort'">
            <span class="sheet-trigger-text"><small>Сортировка</small>{{ currentSort.short }}</span>
            <img :src="chevronIcon" alt="" />
          </button>
        </div>
      </div>

      <div v-if="feed.length" class="request-list">
        <button
          v-for="request in feed"
          :key="request.id"
          type="button"
          class="request-card"
          :class="{ 'is-archive': request.statusGroup === 'archive' }"
          :aria-label="`${request.title}. ${requestStatuses[request.status].label}. ${formatWhen(request)}. ${request.place}`"
          @click="selectedId = request.id"
        >
          <img v-if="request.image" class="request-photo" :src="request.image" alt="" width="103" height="104" />
          <span v-else class="request-photo request-photo-placeholder"><img :src="eventsIcon" alt="" /></span>
          <span class="request-copy">
            <strong>{{ request.title }}</strong>
            <span class="request-meta"><img :src="iconsFor(request).date" alt="" />{{ formatWhen(request, { compact: isMultiDay(request) }) }}</span>
            <span class="request-meta"><img :src="iconsFor(request).place" alt="" />{{ request.place }}</span>
            <span class="request-tags">
              <a-tag :color="requestStatuses[request.status].color">{{ requestStatuses[request.status].label }}</a-tag>
            </span>
          </span>
        </button>
      </div>
      <a-empty v-else class="requests-empty" :description="emptyText">
        <a-button v-if="selectedFilter !== 'all'" @click="selectedFilter = 'all'">Показать все статусы</a-button>
      </a-empty>
    </template>

    <BottomSheet
      :open="!!openSheet"
      :title="sheetTitle"
      :options="sheetOptions"
      :value="sheetValue"
      @close="openSheet = null"
      @select="pickOption"
    />

    <a-modal
      :open="!!selectedRequest"
      :title="selectedRequest ? `Заявка №${selectedRequest.id}` : ''"
      :footer="null"
      :width="378"
      centered
      @cancel="selectedId = null"
    >
      <div v-if="selectedRequest" class="request-details">
        <img v-if="selectedRequest.image" class="request-detail-photo" :src="selectedRequest.image" :alt="selectedRequest.title" />
        <div class="request-detail-head">
          <a-typography-text type="secondary">{{ sourceLabel(selectedRequest.source) }}</a-typography-text>
          <span class="request-tags">
            <a-tag :color="requestStatuses[selectedRequest.status].color">{{ requestStatuses[selectedRequest.status].label }}</a-tag>
          </span>
        </div>
        <a-typography-title :level="4">{{ selectedRequest.title }}</a-typography-title>
        <p><img :src="dateIcon" alt="" />{{ formatWhen(selectedRequest) }}</p>
        <p><img :src="placeIcon" alt="" />{{ selectedRequest.place }}</p>

        <a-alert
          class="request-hint"
          show-icon
          :type="statusHints[selectedRequest.status].type"
          :message="statusHints[selectedRequest.status].text"
          :description="selectedRequest.reason"
        />

        <a-steps class="request-steps" direction="vertical" size="small" :current="steps.current" :status="steps.status" :items="steps.titles.map((title) => ({ title }))" />

        <template v-if="canCancel(selectedRequest)">
          <a-button v-if="!confirmingCancel" block danger size="large" @click="confirmingCancel = true">Отменить заявку</a-button>
          <div v-else ref="cancelBox" class="cancel-confirm" role="alertdialog" aria-label="Подтверждение отмены">
            <strong>Отменить заявку?</strong>
            <span>Вернуть её будет нельзя — придётся подать новую.</span>
            <div class="cancel-actions">
              <a-button size="large" @click="confirmingCancel = false">Оставить</a-button>
              <a-button type="primary" danger size="large" @click="confirmCancel">Да, отменить</a-button>
            </div>
          </div>
        </template>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.requests-page {
  --requests-primary: #1677ff;
  --requests-secondary: rgba(0, 0, 0, .65);
  --requests-surface: #fff;
  --requests-radius: 12px;
  color: rgba(0, 0, 0, .88);
}
.requests-title.ant-typography { margin: 0 -12px; padding: 16px 12px 12px; background: var(--requests-surface); }
.requests-login { display: grid; margin: 0 -12px; padding: 24px 12px; justify-items: center; gap: 12px; background: var(--requests-surface); }
.requests-empty { padding: 48px 0; }
.request-highlights { margin: 0 -12px; padding: 0 0 12px; background: var(--requests-surface); }
.highlights-track { display: flex; gap: 8px; padding: 0 12px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 12px; scrollbar-width: none; }
.highlights-track::-webkit-scrollbar { display: none; }
.highlight-card { display: flex; flex: 0 0 min(260px, 78%); flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px; border: 0; border-radius: var(--requests-radius); background: #e8e8e8; color: rgba(0, 0, 0, .88); text-align: left; cursor: pointer; scroll-snap-align: start; transition: opacity 150ms ease; }
.highlight-card.is-active { --track: rgba(255, 255, 255, .28); --fill: #d6e8ff; background: linear-gradient(122.46deg, #0067b1 0%, #479ae8 100%); color: #fff; }
/* Цвет плитки зависит от времени: идёт — синяя, подходит к концу — жёлтая, просрочена — красная; шкала в оттенке плитки. */
.highlight-card.state-soon { --track: rgba(255, 255, 255, .28); --fill: #fff8d1; background: linear-gradient(122.46deg, #d4b106 0%, #fadb14 100%); color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, .25); }
.highlight-card.state-overdue { --track: rgba(255, 255, 255, .28); --fill: #ffd6d6; background: linear-gradient(122.46deg, #cf1322 0%, #ff4d4f 100%); color: #fff; }
.highlight-card:active { opacity: .85; }
.highlight-card:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; }
.highlight-card strong { display: block; max-width: 100%; overflow: hidden; font-size: 17px; line-height: 24px; text-overflow: ellipsis; white-space: nowrap; }
.highlight-card.is-active .request-meta { color: rgba(255, 255, 255, .92); }
.highlight-progress { display: grid; width: 100%; gap: 6px; font-size: 13px; line-height: 20px; }
.progress-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.timer-value { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.progress-track { display: block; height: 6px; overflow: hidden; border-radius: 3px; background: var(--track); }
.progress-fill { display: block; height: 100%; border-radius: 3px; background: var(--fill); }
.highlight-top { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; }
.highlight-tag { padding: 0 8px; border-radius: 4px; background: rgba(0, 0, 0, .08); font-size: 12px; line-height: 20px; }
.highlight-card.is-active .highlight-tag { background: rgba(255, 255, 255, .24); }
.highlight-dots { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
.highlight-dots i { width: 6px; height: 6px; border-radius: 3px; background: rgba(0, 0, 0, .18); transition: width 150ms ease, background-color 150ms ease; }
.highlight-dots i.on { width: 16px; background: var(--requests-primary); }
.request-sources-bar { position: sticky; z-index: 1; top: 56px; margin: 0 -12px; padding: 0 12px 12px; border-bottom: 1px solid rgba(0, 0, 0, .1); background: var(--requests-surface); }
.request-sources.ant-tabs { margin: 0 -12px; padding: 0 12px; }
.request-sources :deep(.ant-tabs-nav) { margin: 0; }
.request-sources :deep(.ant-tabs-tab) { min-height: 44px; padding: 10px 0; font-size: 15px; }
.request-sources :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 16px; }
.request-sources :deep(.ant-tabs-content-holder) { display: none; }
.source-count { display: inline-grid; min-width: 18px; height: 18px; margin-left: 6px; padding: 0 5px; place-items: center; border-radius: 9px; background: rgba(0, 0, 0, .06); font-size: 12px; line-height: 18px; font-variant-numeric: tabular-nums; }
.ant-tabs-tab-active .source-count { background: #e6f4ff; color: var(--requests-primary); }
.request-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.sheet-trigger { display: flex; min-width: 0; min-height: 48px; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 8px; background: #fff; color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; text-align: left; cursor: pointer; }
.sheet-trigger:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; }
.sheet-trigger-text { display: flex; min-width: 0; flex-direction: column; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sheet-trigger-text small { color: var(--requests-secondary); font-size: 12px; line-height: 16px; }
.sheet-trigger img { flex-shrink: 0; transform: rotate(90deg); }
.request-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin-top: 16px; }
.request-card { display: flex; width: 100%; align-items: center; gap: 12px; padding: 4px; border: 0; border-radius: var(--requests-radius); background: var(--requests-surface); color: inherit; text-align: left; cursor: pointer; transition: opacity 150ms ease; }
.request-card.is-archive strong { color: var(--requests-secondary); }
.request-card.is-archive .request-photo { opacity: .6; filter: grayscale(.6); }
.request-photo { flex: 0 0 103px; align-self: center; object-fit: cover; border-radius: 10px; }
.request-photo-placeholder { display: grid; width: 103px; height: 104px; place-items: center; background: #e6f4ff; }
.request-photo-placeholder img { width: 44px; height: 44px; }
.request-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; gap: 6px; padding: 0; }
.request-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.request-tags :deep(.ant-tag), .request-copy :deep(.ant-tag) { max-width: 100%; margin: 0; padding: 0 7px; border-radius: 4px; font-size: 13px; line-height: 20px; white-space: normal; }
.request-copy strong { max-width: 100%; overflow: hidden; font-size: 15px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.request-meta { display: flex; align-items: flex-start; gap: 4px; color: var(--requests-secondary); font-size: 12px; line-height: 16px; overflow-wrap: anywhere; }
.request-meta img { flex-shrink: 0; margin-top: 1px; }
.request-card:active { opacity: .8; }
.request-card:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; }
.request-details { display: flex; max-height: calc(100dvh - 160px); flex-direction: column; align-items: stretch; gap: 12px; overflow-y: auto; }
.request-detail-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.request-detail-photo { width: 100%; height: 160px; object-fit: contain; background: #f5f5f5; border-radius: 12px; }
.request-details :deep(.ant-typography) { margin: 0; }
.request-details p { display: flex; align-items: flex-start; gap: 8px; margin: 0; line-height: 20px; }
.request-details p img { margin-top: 3px; flex-shrink: 0; }
.request-steps { padding: 4px 0; }
.cancel-confirm { display: grid; gap: 8px; padding: 12px; border-radius: var(--requests-radius); background: #fff1f0; font-size: 14px; line-height: 20px; }
.cancel-confirm span { color: var(--requests-secondary); }
.cancel-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
@media (max-width: 355px) {
  .request-sources :deep(.ant-tabs-tab) { font-size: 13px; }
  .request-sources :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 10px; }
  .source-count { margin-left: 4px; padding: 0 4px; }
  .request-photo { width: 88px; height: 104px; flex-basis: 88px; }
}
@media (prefers-reduced-motion: reduce) {
  .request-card, .highlight-card, .highlight-dots i { transition: none; }
}
</style>
