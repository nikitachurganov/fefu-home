<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import BottomSheet from './BottomSheet.vue'
import RequestHighlightCard from './RequestHighlightCard.vue'
import HighlightsSlider from './HighlightsSlider.vue'
import RequestCodeModal from './RequestCodeModal.vue'
import PhotoCapture from './PhotoCapture.vue'
import ProblemReportSheet from './ProblemReportSheet.vue'
import { useMediaQuery } from '../composables/useMediaQuery'
import { codeActionsFor } from '../data/actionCodes'
import { pushNotification } from '../data/notificationStore'
import { requests, updateRequest } from '../data/requestStore'
import {
  addProblem,
  canCancel,
  cancelRequest,
  countByFilter,
  countOpenBySource,
  feedRequests,
  formatWhen,
  isMultiDay,
  parts,
  pickHighlights,
  requestFilters,
  requestGroups,
  requestSortOptions,
  requestSources,
  requestSteps,
  requestStatuses,
  startAfterPhoto,
  statusHints,
} from '../data/requestModel'
import dateIcon from '../assets/requests/date.svg'
import placeIcon from '../assets/requests/place.svg'
import dateMutedIcon from '../assets/requests/date-muted.svg'
import placeMutedIcon from '../assets/requests/place-muted.svg'
import chevronIcon from '../assets/requests/down.svg'
import eventsIcon from '../assets/figma/event-candidate-1.svg'

const props = defineProps({
  authenticated: Boolean,
  // Заявка, которую нужно сразу открыть (переход из уведомления).
  focusRequestId: { type: String, default: null },
})
const emit = defineEmits(['login', 'focused'])

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
// На ПК плитки разложены на два слайдера: активные (с таймером) и ближайшие.
const isDesktop = useMediaQuery('(min-width: 1024px)')
const desktopHighlights = computed(() => pickHighlights(requests.value, 20))
const activeHighlights = computed(() => desktopHighlights.value.filter((request) => request.status === 'active'))
const upcomingHighlights = computed(() => desktopHighlights.value.filter((request) => request.status !== 'active'))

// Таймер активной заявки тикает раз в секунду, пока открыта страница.
const now = ref(Date.now())
let tick
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(tick))
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

// Коды, которые пользователь может показать сотруднику на текущем этапе заявки.
const codeActions = computed(() => (selectedRequest.value ? codeActionsFor(selectedRequest.value, requests.value) : []))
const codeView = ref(null)
const problemOpen = ref(false)
const canReportProblem = computed(() => selectedRequest.value?.status === 'active' && selectedRequest.value.source !== 'events')

// Фото сделано — пользование начинается, таймер запускается сам: заявка становится «Используется сейчас».
function startUsing(photo) {
  const request = selectedRequest.value
  if (!request) return
  updateRequest(request.id, (item) => startAfterPhoto(item, photo))
  pushNotification({
    severity: 'success',
    title: 'Пользование началось',
    body: `${request.title}: верните до ${parts(request.endsAt).time}.`,
    target: { kind: 'request', id: request.id },
  })
  message.success('Пользование началось')
}

function reportProblem(text) {
  const request = selectedRequest.value
  if (!request) return
  updateRequest(request.id, (item) => addProblem(item, text))
  problemOpen.value = false
  message.success('Сообщение отправлено, сотрудник увидит его при приёмке')
}

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
      <div v-if="isDesktop && highlights.length" class="desktop-sliders">
        <HighlightsSlider v-if="activeHighlights.length" title="Активные" :items="activeHighlights" :now="now" @open="selectedId = $event" />
        <HighlightsSlider v-if="upcomingHighlights.length" title="Ближайшие" :items="upcomingHighlights" :now="now" @open="selectedId = $event" />
      </div>

      <section v-else-if="highlights.length" class="request-highlights" aria-label="Ближайшие заявки">
        <div class="highlights-track" @scroll.passive="onHighlightsScroll">
          <RequestHighlightCard
            v-for="request in highlights"
            :key="request.id"
            :request="request"
            :now="now"
            @open="selectedId = $event"
          />
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

        <div v-if="codeActions.length" class="request-actions">
          <a-button v-for="action in codeActions" :key="action.kind" type="primary" size="large" block @click="codeView = action">{{ action.label }}</a-button>
        </div>
        <PhotoCapture v-if="selectedRequest.status === 'issued'" :label="selectedRequest.source === 'workplace' ? 'Сфотографируйте рабочее место' : 'Сфотографируйте предмет'" @confirm="startUsing" />
        <img v-if="selectedRequest.photo" class="request-photo-taken" :src="selectedRequest.photo" alt="Снимок перед началом пользования" />
        <ul v-if="selectedRequest.problems?.length" class="request-problems" aria-label="Сообщения о проблемах">
          <li v-for="(problem, index) in selectedRequest.problems" :key="index">{{ problem.text }}</li>
        </ul>
        <a-button v-if="canReportProblem" size="large" block @click="problemOpen = true">Сообщить о проблеме</a-button>

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

    <RequestCodeModal :open="!!codeView" :code="codeView" @close="codeView = null" />
    <ProblemReportSheet :open="problemOpen" @close="problemOpen = false" @submit="reportProblem" />
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
.highlight-card { flex: 0 0 min(260px, 78%); scroll-snap-align: start; }
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
.request-actions { display: grid; gap: 8px; }
.request-photo-taken { width: 100%; max-height: 160px; border-radius: 12px; object-fit: cover; }
.request-problems { display: grid; gap: 4px; margin: 0; padding: 8px 12px 8px 28px; border-radius: var(--requests-radius); background: #fff7e6; color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.cancel-confirm { display: grid; gap: 8px; padding: 12px; border-radius: var(--requests-radius); background: #fff1f0; font-size: 14px; line-height: 20px; }
.cancel-confirm span { color: var(--requests-secondary); }
.cancel-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
/* ПК: поля задаёт .content, поэтому мобильные «белые полосы» на отрицательных отступах
   превращаются в карточки на сером фоне. Ближайшие заявки — сеткой вместо скрытой прокрутки,
   основной список — в две колонки комфортной ширины. */
@media (min-width: 1024px) {
  .requests-title.ant-typography { margin: 0; padding: 24px 0 16px; background: transparent; }
  .requests-login { margin: 0; padding: 32px; border-radius: 16px; }
  .desktop-sliders { display: flex; margin-bottom: 16px; padding: 20px; flex-direction: column; gap: 20px; border-radius: 16px; background: var(--requests-surface); }
  .request-highlights { margin: 0 0 16px; padding: 0; background: transparent; }
  .highlights-track { display: grid; padding: 0; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; overflow: visible; }
  .highlight-card { flex: none; }
  .highlight-card:not(.is-active) { background: var(--requests-surface); }
  .highlight-dots { display: none; }
  .request-sources-bar { display: flex; top: 64px; margin: 0; padding: 4px 20px 12px; align-items: flex-end; justify-content: space-between; gap: 24px; border-bottom: 0; border-radius: 16px; }
  .request-sources.ant-tabs { min-width: 0; margin: 0; padding: 0; }
  .request-controls { flex-shrink: 0; margin-top: 0; grid-template-columns: repeat(2, 220px); }
  .request-list { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 12px; }
  .request-card { padding: 8px; }
  .request-card:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, .06); }
}
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
