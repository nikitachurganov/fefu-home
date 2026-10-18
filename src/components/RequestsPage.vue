<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { mockRequests } from '../data/requests'
import {
  canCancel,
  cancelRequest,
  countByFilter,
  countOpenBySource,
  groupRequests,
  pickHighlights,
  relativeDay,
  requestFilters,
  requestSources,
  requestSteps,
  requestStatuses,
  statusHints,
  whenLabel,
} from '../data/requestModel'
import dateIcon from '../assets/requests/date.svg'
import placeIcon from '../assets/requests/place.svg'
import dateWhiteIcon from '../assets/requests/date-white.svg'
import placeWhiteIcon from '../assets/requests/place-white.svg'
import dateMutedIcon from '../assets/requests/date-muted.svg'
import placeMutedIcon from '../assets/requests/place-muted.svg'
import rightMutedIcon from '../assets/requests/right-muted.svg'
import rightWhiteIcon from '../assets/requests/right-white.svg'
import chevronIcon from '../assets/requests/down.svg'
import eventsIcon from '../assets/figma/event-candidate-1.svg'

defineProps({ authenticated: Boolean })
defineEmits(['login'])

const requests = ref(mockRequests.map((request) => ({ ...request })))
const selectedSource = ref('events')
const selectedFilter = ref('all')
const selectedId = ref(null)
const confirmingCancel = ref(false)
// Архив свёрнут по умолчанию, чтобы актуальные заявки были сразу на экране.
const archiveOpen = reactive({ events: false, equipment: false, tmc: false })

const selectedRequest = computed(() => requests.value.find((request) => request.id === selectedId.value) ?? null)
const showSections = computed(() => selectedFilter.value === 'all')
const groupedRequests = computed(() => groupRequests(requests.value, selectedSource.value)
  .filter((group) => showSections.value || group.key === selectedFilter.value))
const filterCounts = computed(() => countByFilter(requests.value, selectedSource.value))
const isArchiveOpen = (group) => group.key === 'archive' && (!showSections.value || archiveOpen[selectedSource.value])
const openCounts = computed(() => countOpenBySource(requests.value))
const highlights = computed(() => pickHighlights(requests.value))
const highlightIndex = ref(0)
function onHighlightsScroll(event) {
  const track = event.currentTarget
  const card = track.firstElementChild
  if (!card) return
  const step = card.offsetWidth + 8
  highlightIndex.value = Math.min(highlights.value.length - 1, Math.round(track.scrollLeft / step))
}
const sourceIsEmpty = computed(() => filterCounts.value.all === 0)
const steps = computed(() => (selectedRequest.value ? requestSteps(selectedRequest.value) : null))
const sourceLabel = (source) => requestSources.find((item) => item.value === source)?.label

// Состояние подтверждения отмены не должно переходить на другую заявку.
watch(selectedId, () => { confirmingCancel.value = false })

// Блок подтверждения появляется внизу длинной карточки — подводим к нему экран.
const cancelBox = ref(null)
watch(confirmingCancel, async (open) => {
  if (!open) return
  await nextTick()
  cancelBox.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

function iconsFor(request, group) {
  if (request.status === 'active') return { date: dateWhiteIcon, place: placeWhiteIcon, chevron: rightWhiteIcon }
  if (group.key === 'archive') return { date: dateMutedIcon, place: placeMutedIcon, chevron: rightMutedIcon }
  return { date: dateIcon, place: placeIcon, chevron: rightMutedIcon }
}

function confirmCancel() {
  const request = selectedRequest.value
  if (!request) return
  const index = requests.value.findIndex((item) => item.id === request.id)
  requests.value[index] = cancelRequest(request)
  archiveOpen[request.source] = true
  selectedId.value = null
  message.success(`Заявка №${request.id} отменена и перенесена в архив`)
}
</script>

<template>
  <section class="requests-page" aria-labelledby="requests-title">
    <a-typography-title id="requests-title" :level="3">Мои заявки</a-typography-title>

    <div v-if="!authenticated" class="requests-login">
      <a-empty description="Войдите, чтобы увидеть свои заявки" />
      <a-button type="primary" size="large" @click="$emit('login')">Войти в аккаунт</a-button>
    </div>

    <template v-else>
      <section v-if="highlights.length" class="request-highlights" aria-label="Ближайшие заявки">
        <div class="highlights-track" @scroll.passive="onHighlightsScroll">
          <button
            v-for="request in highlights"
            :key="request.id"
            type="button"
            class="highlight-card"
            :class="{ 'is-active': request.status === 'active' }"
            :aria-label="`${request.status === 'active' ? 'Активная' : 'Ближайшая'} заявка: ${request.title}. ${whenLabel(request)}. ${request.place}`"
            @click="selectedId = request.id"
          >
            <span class="highlight-top">
              <span class="highlight-tag">{{ request.status === 'active' ? 'Активная' : 'Ближайшая' }}</span>
              <img :src="request.status === 'active' ? rightWhiteIcon : rightMutedIcon" alt="" />
            </span>
            <strong>{{ request.title }}</strong>
            <span class="request-meta"><img :src="request.status === 'active' ? dateWhiteIcon : dateMutedIcon" alt="" />{{ whenLabel(request) }}</span>
            <span class="request-meta"><img :src="request.status === 'active' ? placeWhiteIcon : placeMutedIcon" alt="" />{{ request.place }}</span>
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
        <div class="request-filters" role="group" aria-label="Статус заявок">
          <button
            v-for="filter in requestFilters"
            :key="filter.value"
            type="button"
            class="request-filter"
            :class="{ 'is-selected': selectedFilter === filter.value }"
            :aria-pressed="selectedFilter === filter.value"
            @click="selectedFilter = filter.value"
          >
            {{ filter.label }}<span class="request-filter-count">{{ filterCounts[filter.value] }}</span>
          </button>
        </div>
      </div>

      <a-empty v-if="sourceIsEmpty" class="requests-empty" description="В этом разделе у вас пока нет заявок" />

      <div v-else class="request-groups">
        <section
          v-for="group in groupedRequests"
          :key="`${selectedSource}-${group.key}`"
          class="request-group"
          :aria-labelledby="showSections ? `request-group-${group.key}` : undefined"
          :aria-label="showSections ? undefined : group.label"
        >
          <component
            :is="showSections && group.key === 'archive' ? 'button' : 'div'"
            v-if="showSections"
            class="request-group-heading"
            :class="{ 'is-toggle': group.key === 'archive' }"
            v-bind="group.key === 'archive' ? { type: 'button', 'aria-expanded': archiveOpen[selectedSource], 'aria-controls': 'request-archive-list' } : {}"
            @click="group.key === 'archive' && (archiveOpen[selectedSource] = !archiveOpen[selectedSource])"
          >
            <a-typography-title :id="`request-group-${group.key}`" :level="4">{{ group.label }}</a-typography-title>
            <span class="request-count" :aria-label="`Количество заявок: ${group.requests.length}`">{{ group.requests.length }}</span>
            <img
              v-if="group.key === 'archive' && group.requests.length"
              class="archive-chevron"
              :class="{ open: archiveOpen[selectedSource] }"
              :src="chevronIcon"
              alt=""
            />
          </component>

          <template v-if="group.key !== 'archive' || isArchiveOpen(group)">
            <div v-if="group.requests.length" :id="group.key === 'archive' ? 'request-archive-list' : undefined" class="request-list">
              <button
                v-for="request in group.requests"
                :key="request.id"
                type="button"
                class="request-card"
                :class="{ 'is-active': request.status === 'active', 'is-archive': group.key === 'archive' }"
                :aria-label="`${request.title}. ${requestStatuses[request.status].label}. ${request.date}. ${request.place}`"
                @click="selectedId = request.id"
              >
                <img v-if="request.image" class="request-photo" :src="request.image" alt="" width="103" height="104" />
                <span v-else class="request-event-icon"><img :src="eventsIcon" alt="" /></span>
                <span class="request-copy">
                  <span class="request-tags">
                    <a-tag :color="requestStatuses[request.status].color">{{ requestStatuses[request.status].label }}</a-tag>
                    <a-tag v-if="relativeDay(request)" color="processing">{{ relativeDay(request) }}</a-tag>
                  </span>
                  <strong>{{ request.title }}</strong>
                  <span class="request-meta"><img :src="iconsFor(request, group).date" alt="" />{{ request.date }}</span>
                  <span class="request-meta"><img :src="iconsFor(request, group).place" alt="" />{{ request.place }}</span>
                  <span v-if="request.reason" class="request-reason">{{ request.reason }}</span>
                </span>
                <img class="request-chevron" :src="iconsFor(request, group).chevron" alt="" />
              </button>
            </div>
            <p v-else class="request-group-empty">{{ group.emptyText }}</p>
          </template>
        </section>
      </div>
    </template>

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
            <a-tag v-if="relativeDay(selectedRequest)" color="processing">{{ relativeDay(selectedRequest) }}</a-tag>
          </span>
        </div>
        <a-typography-title :level="4">{{ selectedRequest.title }}</a-typography-title>
        <p><img :src="dateIcon" alt="" />{{ selectedRequest.date }}</p>
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
  padding-top: 24px;
  color: rgba(0, 0, 0, .88);
}
.requests-login { display: grid; justify-items: center; gap: 12px; padding: 24px 0; }
.requests-empty { padding: 48px 0; }
.request-highlights { margin: 0 -12px 8px; }
.highlights-track { display: flex; gap: 8px; padding: 0 12px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 12px; scrollbar-width: none; }
.highlights-track::-webkit-scrollbar { display: none; }
.highlight-card { display: flex; flex: 0 0 min(260px, 78%); flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px; border: 0; border-radius: var(--requests-radius); background: #e8e8e8; color: rgba(0, 0, 0, .88); text-align: left; cursor: pointer; scroll-snap-align: start; transition: opacity 150ms ease; }
.highlight-card.is-active { background: linear-gradient(122.46deg, #0067b1 0%, #479ae8 100%); color: #fff; }
.highlight-card:active { opacity: .85; }
.highlight-card:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; }
.highlight-card strong { font-size: 17px; line-height: 24px; overflow-wrap: anywhere; }
.highlight-card.is-active .request-meta { color: rgba(255, 255, 255, .92); }
.highlight-top { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 8px; }
.highlight-tag { padding: 0 8px; border-radius: 4px; background: rgba(0, 0, 0, .08); font-size: 12px; line-height: 20px; }
.highlight-card.is-active .highlight-tag { background: rgba(255, 255, 255, .24); }
.highlight-dots { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
.highlight-dots i { width: 6px; height: 6px; border-radius: 3px; background: rgba(0, 0, 0, .18); transition: width 150ms ease, background-color 150ms ease; }
.highlight-dots i.on { width: 16px; background: var(--requests-primary); }
.request-sources-bar { position: sticky; z-index: 1; top: 56px; margin: 0 -12px; padding: 0 12px 8px; background: #f5f5f5; }
.request-sources.ant-tabs { margin: 0 -12px; padding: 0 12px; }
.request-sources :deep(.ant-tabs-nav) { margin: 0; }
.request-sources :deep(.ant-tabs-tab) { min-height: 44px; padding: 10px 0; font-size: 15px; }
.request-sources :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 16px; }
.request-sources :deep(.ant-tabs-content-holder) { display: none; }
.source-count { display: inline-grid; min-width: 18px; height: 18px; margin-left: 6px; padding: 0 5px; place-items: center; border-radius: 9px; background: rgba(0, 0, 0, .06); font-size: 12px; line-height: 18px; font-variant-numeric: tabular-nums; }
.ant-tabs-tab-active .source-count { background: #e6f4ff; color: var(--requests-primary); }
.request-filters { display: flex; gap: 8px; margin: 12px -12px 0; padding: 0 12px; overflow-x: auto; scrollbar-width: none; }
.request-filters::-webkit-scrollbar { display: none; }
.request-filter { position: relative; display: inline-flex; height: 32px; flex: 0 0 auto; align-items: center; gap: 6px; padding: 0 12px; border: 1px solid #d9d9d9; border-radius: 16px; background: #fff; color: rgba(0, 0, 0, .88); font-size: 14px; cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.request-filter::after { position: absolute; inset: -6px -2px; content: ''; }
.request-filter-count { color: var(--requests-secondary); font-size: 12px; font-variant-numeric: tabular-nums; }
.request-filter.is-selected { border-color: var(--requests-primary); background: #e6f4ff; color: var(--requests-primary); }
.request-filter.is-selected .request-filter-count { color: var(--requests-primary); }
.request-filter:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; }
.request-groups { display: grid; gap: 24px; margin-top: 16px; }
.request-group-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.request-group-heading.is-toggle { width: 100%; min-height: 44px; margin-bottom: 0; padding: 0; border: 0; background: none; color: inherit; text-align: left; cursor: pointer; }
.request-group-heading.is-toggle:focus-visible { outline: 3px solid var(--requests-primary); outline-offset: 2px; border-radius: 8px; }
.request-group-heading :deep(.ant-typography) { margin: 0; }
.archive-chevron { margin-left: auto; transform: rotate(90deg); transition: transform 150ms ease; }
.archive-chevron.open { transform: rotate(-90deg); }
.request-count { display: grid; min-width: 24px; height: 24px; padding: 0 6px; place-items: center; border-radius: 12px; background: rgba(0, 0, 0, .06); color: var(--requests-secondary); font-size: 13px; line-height: 20px; font-variant-numeric: tabular-nums; }
.request-list { display: grid; gap: 8px; margin-top: 8px; }
.request-card { display: flex; width: 100%; align-items: stretch; gap: 8px; padding: 0 4px 0 0; border: 4px solid var(--requests-surface); border-radius: var(--requests-radius); background: var(--requests-surface); color: inherit; text-align: left; cursor: pointer; transition: opacity 150ms ease; }
.request-card.is-active { border-color: var(--requests-primary); background: var(--requests-primary); color: #fff; }
.request-card.is-active .request-meta { color: rgba(255, 255, 255, .88); }
.request-card.is-archive strong { color: var(--requests-secondary); }
.request-card.is-archive .request-photo { opacity: .6; filter: grayscale(.6); }
.request-photo { flex: 0 0 103px; align-self: center; object-fit: cover; border-radius: 10px; }
.request-event-icon { display: grid; flex: 0 0 44px; height: 44px; margin: 8px 0 0 4px; place-items: center; border-radius: 10px; background: #e6f4ff; }
.request-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; gap: 6px; padding: 8px 0; }
.request-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.request-tags :deep(.ant-tag), .request-copy :deep(.ant-tag) { max-width: 100%; margin: 0; padding: 0 7px; border-radius: 4px; font-size: 13px; line-height: 20px; white-space: normal; }
.request-copy strong { font-size: 15px; line-height: 20px; overflow-wrap: anywhere; }
.request-meta { display: flex; align-items: flex-start; gap: 4px; color: var(--requests-secondary); font-size: 12px; line-height: 16px; overflow-wrap: anywhere; }
.request-meta img { flex-shrink: 0; margin-top: 1px; }
.request-reason { color: #cf1322; font-size: 12px; line-height: 16px; }
.request-chevron { flex-shrink: 0; align-self: center; margin-right: 4px; }
.request-group-empty { margin: 8px 0 0; padding: 16px; border-radius: var(--requests-radius); background: var(--requests-surface); color: var(--requests-secondary); font-size: 14px; line-height: 20px; }
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
  .request-sources :deep(.ant-tabs-tab) { font-size: 14px; }
  .request-sources :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 14px; }
  .request-photo { width: 88px; height: 104px; flex-basis: 88px; }
}
@media (prefers-reduced-motion: reduce) {
  .request-card, .archive-chevron, .request-filter, .highlight-card, .highlight-dots i { transition: none; }
}
</style>
