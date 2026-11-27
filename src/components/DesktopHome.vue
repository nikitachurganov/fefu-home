<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  BellOutlined, BookOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseOutlined, EnvironmentOutlined,
  FileTextOutlined, HistoryOutlined, LeftOutlined, LockOutlined, MessageOutlined,
  QrcodeOutlined, SolutionOutlined,
  QuestionCircleOutlined, RightOutlined, ScanOutlined, SearchOutlined,
} from '@ant-design/icons-vue'
import TeacherDialogs from './TeacherDialogs.vue'
import {
  isPairFinished, lessonBanner, lessonClock, lessonFeedback, markedCount, needsDelayReason, pairStatuses,
  riskStudents, teacherPairs, unassignedStudents,
} from '../data/teacherStore'
import { weather } from '../data/campus'
import ProfileMenu from './ProfileMenu.vue'
import { isDark } from '../data/theme'
import mapDark from '../assets/services/map-dark.svg'
import busDark from '../assets/services/bus-dark.svg'
import educationDark from '../assets/services/edu-dark.svg'
import eventDark from '../assets/services/event-dark.svg'
import bookingDark from '../assets/services/calendar-dark.svg'
import rentalDark from '../assets/services/rent-dark.svg'
import { requests } from '../data/requestStore'
import { feedRequests, parts, requestStatuses } from '../data/requestModel'
import { isTeacher, role, roleOptions } from '../data/userStore'
import NotificationsPopover from './NotificationsPopover.vue'
import DesktopServiceDialog from './DesktopServiceDialog.vue'
import passDarkIllustration from '../assets/portal/updates/pass-dark.png'
import scannerDarkIllustration from '../assets/portal/updates/scanner-dark.png'
import workplaceDarkIllustration from '../assets/portal/updates/workplace-dark.png'
import shuttlesDarkIllustration from '../assets/portal/updates/shuttles-dark.png'
import mapDarkIllustration from '../assets/portal/updates/map-dark.png'
import toolsDarkIllustration from '../assets/portal/updates/tools-dark.png'
import requestsDarkIllustration from '../assets/portal/updates/requests-dark.png'
import feedbackDarkIllustration from '../assets/portal/updates/feedback-dark.png'
import passIllustration from '../assets/portal/updates/pass.png'
import scannerIllustration from '../assets/portal/updates/scanner.png'
import workplaceIllustration from '../assets/portal/updates/workplace.png'
import shuttlesIllustration from '../assets/portal/updates/shuttles.png'
import mapIllustration from '../assets/portal/updates/map.png'
import toolsIllustration from '../assets/portal/updates/tools.png'
import requestsIllustration from '../assets/portal/updates/requests.png'
import feedbackIllustration from '../assets/portal/updates/feedback.png'
import logo from '../assets/figma/logo.png'
import cloudIcon from '../assets/figma/cloud.svg'
import schedule3d from '../assets/services/schedule-3d.webp'
import event3d from '../assets/services/event-3d.webp'
import booking3d from '../assets/services/booking-3d.webp'
import rental3d from '../assets/services/rental-3d.webp'
import mapIcon from '../assets/services/map.svg'
import busIcon from '../assets/services/bus.svg'
import educationIcon from '../assets/services/edu.svg'
import eventIcon from '../assets/services/event.svg'
import bookingIcon from '../assets/services/calendar.svg'
import rentalIcon from '../assets/services/rent.svg'

const props = defineProps({ authenticated: Boolean, services: Array, now: Number })
const emit = defineEmits(['login', 'open-request', 'open-scanner', 'open-student-code', 'navigate', 'feedback', 'logout'])

const query = ref('')
const expanded = ref(false)
const highlighted = ref(-1)
const field = ref(null)
const serviceDetails = ref(null)
const heroIcons = {
  'Расписание': schedule3d,
  'Мероприятия': event3d,
  'Бронирование': booking3d,
  'Аренда': rental3d,
}
const heroServices = computed(() => Object.keys(heroIcons).map((label) => props.services.find((s) => s.label === label)).filter(Boolean))
// Главная преподавателя (ROLES_SPEC.md §3.5, docs/useful-services-by-role.md): вместо пропуска — «Начать пару»,
// в «Полезных сервисах» — «Занятия сегодня», «Требует внимания» и плитки кабинета.
const teacherView = computed(() => props.authenticated && isTeacher.value)
const quickLinks = computed(() => [
  { label: 'QR-сканер', action: 'open-scanner' },
  teacherView.value
    ? { label: 'Начать пару', action: 'open-scanner' }
    : { label: 'Пропуск', action: 'open-student-code', requiresAuth: true },
  { label: 'Мои заявки', nav: 'requests', requiresAuth: true },
  { label: 'Карта кампуса', service: 'Карта' },
  { label: 'Шаттлы', service: 'Шаттлы' },
  { label: 'Обратная связь', action: 'feedback' },
])
const updates = [
  { label: 'QR-сканер', description: 'Паспорта объектов и отметка по коду', icon: ScanOutlined, action: 'open-scanner' },
  { label: 'Мои заявки', description: 'Брони, аренда и статусы заявок', icon: FileTextOutlined, nav: 'requests', requiresAuth: true },
  { label: 'Обратная связь', description: 'Задать вопрос команде портала', icon: MessageOutlined, action: 'feedback' },
]
const pass = { label: 'QR-пропуск', description: 'Код студента для отметки на занятии', icon: QrcodeOutlined, action: 'open-student-code', requiresAuth: true }
const notificationsCatalogItem = { label: 'Уведомления', description: 'Изменения по вашим заявкам', icon: BellOutlined, nav: 'notifications', requiresAuth: true }
const featureLabels = [
  { label: 'Карта', title: 'Карта кампуса', detail: 'Корпуса и маршруты' },
  { label: 'Шаттлы', title: 'Шаттлы', detail: 'Остановки и рейсы' },
  { label: 'Расписание', title: 'Расписание занятий', detail: 'Пары и аудитории' },
  { label: 'Мероприятия', title: 'Мероприятия', detail: 'Афиша событий ДВФУ' },
  { label: 'Бронирование', title: 'Бронирование', detail: 'Места и оборудование' },
  { label: 'Аренда', title: 'Аренда', detail: 'Инвентарь и переносное оборудование' },
]
const campusDate = computed(() => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Vladivostok',
}).format(props.now))
const requestDateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Vladivostok',
})
const myRequests = computed(() => props.authenticated
  ? feedRequests(requests.value.filter(item => !item.instructor))
  : [])

const requestViewport = ref(null)
const requestList = ref(null)
const hasRequestsAbove = ref(false)
const hasRequestsBelow = ref(false)
const requestThumbHeight = ref(0)
const requestThumbOffset = ref(0)
const scrollingRequests = ref(false)
let hideRequestThumb

function updateRequestScrollState() {
  const el = requestViewport.value
  if (!el) return
  const { clientHeight, scrollHeight, scrollTop } = el
  const range = scrollHeight - clientHeight
  hasRequestsAbove.value = scrollTop > 1
  hasRequestsBelow.value = range - scrollTop > 1
  requestThumbHeight.value = range > 0
    ? Math.min(clientHeight, Math.max(24, clientHeight * clientHeight / scrollHeight))
    : 0
  const position = range > 0 ? Math.min(1, Math.max(0, scrollTop / range)) : 0
  requestThumbOffset.value = (clientHeight - requestThumbHeight.value) * position
}

function onRequestScroll() {
  updateRequestScrollState()
  scrollingRequests.value = true
  clearTimeout(hideRequestThumb)
  hideRequestThumb = setTimeout(() => { scrollingRequests.value = false }, 500)
}

watch([requestViewport, requestList], ([viewport, list], _, onCleanup) => {
  if (!viewport || !list) return
  updateRequestScrollState()
  const observer = new ResizeObserver(updateRequestScrollState)
  observer.observe(viewport)
  observer.observe(list)
  onCleanup(() => {
    observer.disconnect()
    clearTimeout(hideRequestThumb)
    scrollingRequests.value = false
  })
}, { flush: 'post' })

const math = { start: '09:00', end: '10:30', title: 'Математический анализ' }
const english = { start: '10:40', end: '12:10', title: 'Английский язык' }
const programming = { start: '13:00', end: '14:30', title: 'Программирование' }
const demoWeek = [
  [math, english, programming],
  [english, programming],
  [],
  [math, english, programming],
  [math, programming],
  [],
  [],
]
const lessonDateFormat = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
})
const lessonSchedule = computed(() => {
  const { year, month, day } = parts(props.now)
  const date = new Date(Date.UTC(year, month - 1, day))
  const weekday = (date.getUTCDay() + 6) % 7
  const offset = demoWeek.findIndex((_, index) => demoWeek[(weekday + index) % 7].length > 0)
  date.setUTCDate(date.getUTCDate() + offset)
  return { date, lessons: demoWeek[(weekday + offset) % 7] }
})
const usefulServices = [
  { label: 'Карта', icon: mapIcon, darkIcon: mapDark, service: 'Карта' },
  { label: 'Шаттлы', icon: busIcon, darkIcon: busDark, service: 'Шаттлы' },
  { label: 'Расписание', icon: educationIcon, darkIcon: educationDark, service: 'Расписание' },
  { label: 'Мероприятия', icon: eventIcon, darkIcon: eventDark, service: 'Мероприятия' },
  { label: 'Бронирование', icon: bookingIcon, darkIcon: bookingDark, service: 'Бронирование' },
  { label: 'Аренда', icon: rentalIcon, darkIcon: rentalDark, service: 'Аренда' },
]

// --- Преподаватель ---
const teacherTiles = [
  { label: 'Журналы', glyph: BookOutlined, cabinet: 'Журналы' },
  { label: 'Кабинет преподавателя', glyph: SolutionOutlined, cabinet: 'Главная' },
  { label: 'QR-сканер', glyph: ScanOutlined, action: 'open-scanner' },
  { label: 'Бронирование', icon: bookingIcon, darkIcon: bookingDark, service: 'Бронирование' },
  { label: 'Мои заявки', glyph: FileTextOutlined, nav: 'requests', requiresAuth: true },
  { label: 'Аренда', icon: rentalIcon, darkIcon: rentalDark, service: 'Аренда' },
]
const teacherDialog = ref(null)
const openTeacherDialog = (type, pairId) => { teacherDialog.value = { type, pairId } }
// Кабинета преподавателя в прототипе нет (в сервисе он только на ПК, docs/useful-services-by-role.md §4).
const openCabinet = (section) => message.info(`Кабинет преподавателя → ${section}: демо-раздел пока в разработке.`)
const openTeacherTile = (item) => (item.cabinet ? openCabinet(item.cabinet) : openQuickLink(item))

const plural = (n, [one, few, many]) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
// Время на демо-часах кампуса (см. teacherStore): от него зависят статусы пар и плашка.
const teacherMinutes = computed(() => lessonClock(props.now))
// Тег статуса в «Занятиях сегодня» — только когда он что-то сообщает: идёт, начата с опозданием, сорвана.
// Не начатая и проведённая без проблем пара тега не получает.
const pairStatus = (pair) => {
  if (pair.status === 'not_started') return null
  if (pair.status === 'started' && isPairFinished(pair, teacherMinutes.value)) return null
  return pairStatuses[pair.status]
}
// Плашка пары: появляется за 15 минут до начала и держится до конца пары.
// Верхняя строка — место и время пары; во время пары рядом метка «Идёт».
const banner = computed(() => (teacherView.value ? lessonBanner(teacherPairs.value, teacherMinutes.value) : null))
// Аудитория показана в полосе карточки, здесь — группа и вид занятия.
const pairMeta = (pair) => `${pair.group} · ${pair.kind}`

// Панель «Требует внимания»: строки собраны в группы по типу задачи (docs/useful-services-by-role.md, панель 2).
// Группа показывается, только если в ней есть строки.
const attentionGroups = computed(() => {
  const groups = []
  const late = teacherPairs.value.filter(needsDelayReason)
  groups.push({
    id: 'delay',
    title: 'Укажите причину опоздания',
    rows: late.map((pair) => ({
      id: `delay-${pair.id}`,
      title: pair.title,
      detail: `${pair.start}–${pair.end}`,
      run: () => openTeacherDialog('delay', pair.id),
    })),
  })
  const editable = teacherPairs.value.filter((item) => isPairFinished(item, teacherMinutes.value) && item.editableUntil)
  groups.push({
    id: 'edit',
    title: 'Правка отметок',
    rows: editable.map((pair) => {
      const left = pair.students.length - markedCount(pair)
      return {
        id: `edit-${pair.id}`,
        title: pair.title,
        detail: `${pair.start}–${pair.end} · до ${pair.editableUntil} · ${left ? `не отмечено: ${left}` : 'все отмечены'}`,
        run: () => openTeacherDialog('journal', pair.id),
      }
    }),
  })
  const risk = riskStudents.value.length
  const unassigned = unassignedStudents.value.length
  groups.push({
    id: 'students',
    title: 'Студенты',
    rows: [
      risk && { id: 'risk', title: 'Студенты в зоне риска', detail: 'Посещаемость 50 % и ниже', run: () => openTeacherDialog('risk') },
      unassigned && { id: 'subgroups', title: 'Студенты без подгруппы', run: () => openCabinet('Подгруппы') },
    ].filter(Boolean),
  })
  const feedback = lessonFeedback.newCount
  groups.push({
    id: 'feedback',
    title: 'Оценки занятий',
    rows: feedback ? [{
      id: 'feedback',
      title: `${feedback} ${plural(feedback, ['новая оценка', 'новые оценки', 'новых оценок'])}`,
      detail: `Понятность ${String(lessonFeedback.clear).replace('.', ',')} из 2, ниже остальных критериев`,
      run: () => openCabinet('Обратная связь по занятиям'),
    }] : [],
  })
  groups.push({
    id: 'requests',
    title: 'Заявки на модерации',
    rows: myRequests.value.filter((item) => item.status === 'review').map((item) => ({
      id: `request-${item.id}`,
      title: item.title,
      detail: requestDateFormat.format(new Date(item.startsAt)),
      run: () => emit('open-request', item.id),
    })),
  })
  return groups.filter((group) => group.rows.length)
})
const features = computed(() => featureLabels.map((feature) => ({
  ...props.services.find((item) => item.label === feature.label), ...feature,
})))
const locked = (item) => Boolean(item?.requiresAuth && !props.authenticated)
const catalog = computed(() => [...props.services, pass, ...updates, notificationsCatalogItem])
const normalize = (value) => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()
const results = computed(() => {
  const words = normalize(query.value).split(/\s+/)
  return catalog.value.filter((item) => {
    const feature = features.value.find((entry) => entry.label === item.label)
    const text = normalize([item.label, item.description, feature?.title, feature?.detail].join(' '))
    return words.every((word) => text.includes(word))
  })
})
watch(query, () => { highlighted.value = -1 })
function choose(item) {
  if (!item) return
  if (locked(item) && (item.nav || item.action)) { emit('login'); return }
  expanded.value = false
  if (item.nav) emit('navigate', item.nav)
  else if (item.action) emit(item.action)
  else serviceDetails.value = item
}
function openByLabel(label) {
  choose(catalog.value.find((item) => item.label === label))
}
function handleServiceClick(item) {
  openByLabel(item.label)
}

const newTrack = ref(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(true)

function updateScrollState() {
  const el = newTrack.value
  if (!el) return
  canScrollPrev.value = el.scrollLeft > 6
  canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 6
}

function scrollNewTrack(direction) {
  const el = newTrack.value
  if (!el) return
  const card = el.querySelector('.new-portal-card')
  if (!card) return
  const gap = Number.parseFloat(getComputedStyle(el).columnGap)
  const step = 2 * (card.offsetWidth + gap)
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

let trackResizeObserver
onMounted(() => {
  nextTick(() => {
    updateScrollState()
    if (newTrack.value && typeof ResizeObserver !== 'undefined') {
      trackResizeObserver = new ResizeObserver(updateScrollState)
      trackResizeObserver.observe(newTrack.value)
    }
  })
})
onBeforeUnmount(() => trackResizeObserver?.disconnect())

const darkCoverColors = { pass: '#29283d', scanner: '#263449', workplace: '#302e42', shuttles: '#273448', map: '#292d43', tools: '#283b39', requests: '#3b302c', feedback: '#39303e' }
const newPortalItems = [
  {
    id: 'pass',
    illustration: passIllustration,
    darkIllustration: passDarkIllustration,
    title: 'QR-пропуск для быстрой отметки на парах',
    badgeBg: '#f0eefb',
    action: 'open-student-code',
    requiresAuth: true,
  },
  {
    id: 'scanner',
    illustration: scannerIllustration,
    darkIllustration: scannerDarkIllustration,
    title: 'Паспорта кабинетов и техники по QR-коду',
    badgeBg: '#eaf2fd',
    action: 'open-scanner',
  },
  {
    id: 'workplace',
    illustration: workplaceIllustration,
    darkIllustration: workplaceDarkIllustration,
    title: 'Бронирование мест и коворкингов в кампусе',
    badgeBg: '#fef3eb',
    service: 'Бронирование',
  },
  {
    id: 'shuttles',
    illustration: shuttlesIllustration,
    darkIllustration: shuttlesDarkIllustration,
    title: 'Расписание и остановки шаттлов кампуса',
    badgeBg: '#eaf4fd',
    service: 'Шаттлы',
  },
  {
    id: 'map',
    illustration: mapIllustration,
    darkIllustration: mapDarkIllustration,
    title: 'Корпуса, общежития и навигация по ДВФУ',
    badgeBg: '#eff4fe',
    service: 'Карта',
  },
  {
    id: 'tools',
    illustration: toolsIllustration,
    darkIllustration: toolsDarkIllustration,
    title: 'Аренда инвентаря и переносного оборудования',
    badgeBg: '#eef8f2',
    service: 'Аренда',
  },
  {
    id: 'requests',
    illustration: requestsIllustration,
    darkIllustration: requestsDarkIllustration,
    title: 'Статусы ваших заявок и история бронирований',
    badgeBg: '#fef5ea',
    nav: 'requests',
    requiresAuth: true,
  },
  {
    id: 'feedback',
    illustration: feedbackIllustration,
    darkIllustration: feedbackDarkIllustration,
    title: 'Задать вопрос команде и поддержке портала',
    badgeBg: '#fdf1f5',
    action: 'feedback',
  },
]

// QR-пропуск — студенческая карточка, преподавателю она не нужна.
const visiblePortalItems = computed(() => (teacherView.value ? newPortalItems.filter((item) => item.id !== 'pass') : newPortalItems))

function handleNewPortalClick(item) {
  if (locked(item)) {
    emit('login')
    return
  }
  if (item.nav) emit('navigate', item.nav)
  else if (item.action) emit(item.action)
  else if (item.service) openByLabel(item.service)
}
function openQuickLink(target) {
  if (typeof target === 'string') {
    const item = catalog.value.find((entry) => entry.label === target)
    if (locked(item)) emit('login')
    else choose(item)
    return
  }
  if (locked(target)) {
    emit('login')
    return
  }
  if (target.nav) emit('navigate', target.nav)
  else if (target.action) emit(target.action)
  else if (target.service) openByLabel(target.service)
}
const historySuggestions = [
  { text: 'мой универ', service: 'Карта' },
  { text: 'расписание занятий', service: 'Расписание' },
  { text: 'шаттлы кампуса', service: 'Шаттлы' },
  { text: 'карта корпусов и общежитий', service: 'Карта' },
  { text: 'бронирование коворкингов', service: 'Бронирование' },
  { text: 'аренда инвентаря', service: 'Аренда' },
  { text: 'мои заявки', nav: 'requests', requiresAuth: true },
  { text: 'qr-пропуск студента', action: 'open-student-code', requiresAuth: true },
]

function clearQuery() {
  query.value = ''
  highlighted.value = -1
  focusSearch()
}

function selectHistoryItem(item) {
  if (locked(item)) {
    emit('login')
    return
  }
  query.value = item.text
  expanded.value = false
  if (item.nav) emit('navigate', item.nav)
  else if (item.action) emit(item.action)
  else if (item.service) openByLabel(item.service)
}

function focusSearch() {
  field.value?.focus()
  expanded.value = true
}

const activeCount = computed(() => {
  return query.value.trim() ? results.value.length : historySuggestions.length
})

function moveHighlight(step) {
  expanded.value = true
  const count = activeCount.value
  if (!count) return
  highlighted.value = highlighted.value < 0 ? (step > 0 ? 0 : count - 1) : (highlighted.value + step + count) % count
  nextTick(() => document.getElementById('home-result-' + highlighted.value)?.scrollIntoView({ block: 'nearest' }))
}

function submitSearch() {
  if (!query.value.trim()) {
    if (highlighted.value >= 0 && highlighted.value < historySuggestions.length) {
      selectHistoryItem(historySuggestions[highlighted.value])
    } else {
      focusSearch()
    }
    return
  }
  if (results.value.length) choose(results.value[Math.max(highlighted.value, 0)])
  else focusSearch()
}
function exitSearch(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) expanded.value = false
}
</script>

<template>
  <div class="portal">
    <header class="portal-bar">
      <div class="portal-wrap bar-inner">
        <a v-if="!authenticated" class="portal-brand" href="#portal-top" aria-label="FEFU One, на главную"><img :src="logo" alt="" />FEFU One</a>
        <div class="bar-actions">
          <a-select v-if="authenticated" v-model:value="role" class="header-role" :options="roleOptions" show-search option-filter-prop="label" :popup-match-select-width="320" aria-label="Роль" />
          <span v-if="authenticated" class="bar-divider"></span>
          <button class="icon-control" aria-label="Помощь" @click="emit('feedback')"><QuestionCircleOutlined /></button>
          <NotificationsPopover v-if="authenticated" outlined @open-request="(id) => emit('open-request', id)"
            @open-schedule="openByLabel('Расписание')" @open-all="emit('navigate', 'notifications')" />
          <button v-else class="icon-control" disabled aria-label="Уведомления доступны после входа"><BellOutlined /></button>
          <span class="bar-divider"></span>
          <ProfileMenu v-if="authenticated" @profile="emit('navigate', 'profile')" @feedback="emit('feedback')" @logout="emit('logout')" />
          <button v-else class="login-control" @click="emit('login')">Войти</button>
        </div>
      </div>
    </header>

    <div class="portal-content-scroll">
    <div id="portal-top" class="portal-wrap portal-main">
      <div class="portal-weather" aria-label="Погода в кампусе">
        <time class="portal-today"><span>{{ campusDate }}</span></time>
        <img :src="cloudIcon" alt="" /><b>{{ weather.temperature }}°</b>
        <span>Ощущается &nbsp;{{ weather.feelsLike }}°</span><span>Ветер &nbsp;{{ weather.wind }} м/с</span>
      </div>
      <section class="portal-hero-dns" aria-label="Поиск и сервисы кампуса">
        <div class="hero-services-row">
          <button
            v-for="item in heroServices"
            :key="item.label"
            class="hero-service-btn"
            :aria-label="locked(item) ? `Сервис «${item.label}» (доступен после входа)` : `Открыть сервис «${item.label}»`"
            @click="handleServiceClick(item)"
          >
            <div class="hero-service-icon-wrap">
              <img class="hero-service-icon" :class="{ 'is-schedule': heroIcons[item.label] === schedule3d }" :src="heroIcons[item.label]" alt="" aria-hidden="true" />
            </div>
            <span class="hero-service-name">{{ item.label }}</span>
          </button>
        </div>

        <div class="hero-search-area" @focusout="exitSearch" @keydown.esc="expanded = false">
          <div class="hero-search-box" :class="{ 'is-expanded': expanded }">
            <form role="search" class="hero-search-input-row" @submit.prevent="submitSearch">
              <input
                ref="field"
                v-model="query"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="home-results"
                :aria-expanded="expanded"
                :aria-activedescendant="expanded && highlighted >= 0 ? 'home-result-' + highlighted : undefined"
                aria-label="Поиск по сайту"
                placeholder="Поиск по сервису"
                autocomplete="off"
                @focus="expanded = true"
                @click="expanded = true"
                @input="expanded = true"
                @keydown.down.prevent="moveHighlight(1)"
                @keydown.up.prevent="moveHighlight(-1)"
              />

              <div class="hero-search-tools">
                <button
                  v-if="query"
                  type="button"
                  class="search-tool-btn"
                  aria-label="Очистить"
                  title="Очистить"
                  @click.stop="clearQuery"
                >
                  <CloseOutlined />
                </button>

                <a-button type="primary" html-type="submit" class="hero-search-btn" aria-label="Найти">
                  <template #icon><SearchOutlined aria-hidden="true" /></template>
                </a-button>
              </div>
            </form>

            <Transition name="search-dropdown">
              <div v-show="expanded" class="hero-search-dropdown" :inert="!expanded">
                <div class="search-dropdown-divider"></div>

                <div v-if="!query.trim()" id="home-results" role="listbox" aria-label="История и рекомендации" class="search-suggestions-list">
                  <button
                    v-for="(item, index) in historySuggestions"
                    :id="'home-result-' + index"
                    :key="item.text"
                    role="option"
                    :aria-selected="highlighted === index"
                    class="search-suggestion-item is-history"
                    tabindex="-1"
                    @mousedown.prevent
                    @click="selectHistoryItem(item)"
                  >
                    <span class="suggestion-icon"><HistoryOutlined /></span>
                    <span class="suggestion-text">{{ item.text }}</span>
                    <LockOutlined v-if="locked(item)" class="suggestion-lock" aria-label="Доступно после входа" />
                  </button>
                </div>

                <div v-else id="home-results" role="listbox" aria-label="Подходящие сервисы" class="search-suggestions-list">
                  <button
                    v-for="(item, index) in results"
                    :id="'home-result-' + index"
                    :key="item.label"
                    role="option"
                    :aria-selected="highlighted === index"
                    class="search-suggestion-item"
                    tabindex="-1"
                    @mousedown.prevent
                    @click="choose(item)"
                  >
                    <span class="suggestion-icon"><SearchOutlined /></span>
                    <span class="suggestion-copy">
                      <strong>{{ item.label }}</strong>
                      <small>{{ locked(item) ? 'Доступно после входа' : item.description }}</small>
                    </span>
                    <span class="suggestion-status">
                      <LockOutlined v-if="locked(item) && (item.nav || item.action)" />
                      <RightOutlined v-else />
                    </span>
                  </button>

                  <p v-if="!results.length" class="search-no-results" role="status">Ничего не найдено. Попробуйте другое название.</p>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="hero-categories-row" aria-label="Быстрые переходы">
          <a-button
            v-for="link in quickLinks"
            :key="link.label"
            class="hero-category-link"
            type="link"
            @click="openQuickLink(link)"
          >
            {{ link.label }}
          </a-button>
        </div>
      </section>

      <section v-if="banner" class="lesson-banner" :class="`is-${banner.phase}`" aria-labelledby="lesson-banner-title" aria-live="polite">
        <div class="lesson-banner-copy">
          <span class="lesson-banner-status">
            <span class="lesson-banner-dot" aria-hidden="true"></span>
            {{ banner.phase === 'live' ? 'Пара идёт' : 'Скоро начало' }}
          </span>
          <h2 id="lesson-banner-title">{{ banner.pair.title }}</h2>
          <span class="lesson-banner-meta">{{ banner.pair.group }} · {{ banner.pair.kind }}</span>
        </div>
        <div class="lesson-banner-actions">
          <!-- До начала пары — «Начать пару», во время пары — только «Отметить студентов» -->
          <a-button v-if="banner.phase === 'live'" type="primary" size="large" @click="openTeacherDialog('journal', banner.pair.id)">
            Отметить студентов
          </a-button>
          <a-button v-else-if="banner.pair.status === 'not_started'" type="primary" size="large" @click="emit('open-scanner')">
            Начать пару
          </a-button>
        </div>
        <div class="lesson-banner-divider" aria-hidden="true"></div>
        <div class="lesson-banner-bottom">
          <span>{{ banner.pair.building }}, {{ banner.pair.room }}</span>
          <span><time :datetime="banner.pair.start">{{ banner.pair.start }}</time> - <time :datetime="banner.pair.end">{{ banner.pair.end }}</time></span>
        </div>
      </section>

      <slot name="activities" />

      <section class="portal-section" aria-labelledby="new-portal-heading">
        <div class="portal-section-head">
          <h2 id="new-portal-heading">Обновления</h2>
          <div class="new-portal-arrows">
            <button
              class="new-arrow-btn"
              :disabled="!canScrollPrev"
              aria-label="Назад"
              @click="scrollNewTrack(-1)"
            >
              <LeftOutlined />
            </button>
            <button
              class="new-arrow-btn"
              :disabled="!canScrollNext"
              aria-label="Вперёд"
              @click="scrollNewTrack(1)"
            >
              <RightOutlined />
            </button>
          </div>
        </div>

        <div
          ref="newTrack"
          class="new-portal-track portal-carousel-track"
          :class="{ 'fade-start': canScrollPrev, 'fade-end': canScrollNext }"
          @scroll.passive="updateScrollState"
        >
          <button
            v-for="item in visiblePortalItems"
            :key="item.id"
            class="new-portal-card"
            :aria-label="locked(item) ? `${item.title} (доступно после входа)` : item.title"
            @click="handleNewPortalClick(item)"
          >
            <div class="new-card-media" :style="{ backgroundColor: isDark ? darkCoverColors[item.id] : item.badgeBg }">
              <img :src="isDark ? item.darkIllustration : item.illustration" class="new-card-illustration" alt="" />
            </div>
            <span class="new-card-title">{{ item.title }}</span>
          </button>
        </div>
      </section>
      <section class="portal-section useful-section" aria-labelledby="useful-heading">
        <div class="portal-section-head"><h2 id="useful-heading">Полезные сервисы</h2></div>
        <div v-if="teacherView" class="useful-grid teacher-grid">
          <a-card class="useful-agenda" role="region" aria-labelledby="home-pairs-heading">
            <template #title><h3 id="home-pairs-heading">Занятия сегодня</h3></template>
            <template #extra>
              <button type="button" class="useful-panel-more" aria-label="Открыть расписание в кабинете преподавателя" @click="openCabinet('Расписание')">
                <RightOutlined />
              </button>
            </template>
            <!-- Карточка пары повторяет расписание университета: полоса со временем и аудиторией, ниже пара -->
            <ul class="pair-cards">
              <li v-for="pair in teacherPairs" :key="pair.id" class="pair-card" :class="{ 'is-past': isPairFinished(pair, teacherMinutes) }">
                <div class="pair-card-head">
                  <span><ClockCircleOutlined aria-hidden="true" /> <time :datetime="pair.start">{{ pair.start }}</time>–<time :datetime="pair.end">{{ pair.end }}</time></span>
                  <span><EnvironmentOutlined aria-hidden="true" /> {{ pair.room }}</span>
                </div>
                <!-- Статус пары — полоса-алерт под шапкой, действие по нему справа -->
                <div v-if="pairStatus(pair)" class="pair-alert" :class="`tone-${pairStatus(pair).color}`">
                  <span>{{ pairStatus(pair).label }}</span>
                  <a-button v-if="needsDelayReason(pair)" type="link" size="small" class="pair-alert-action" @click="openTeacherDialog('delay', pair.id)">Указать причину</a-button>
                </div>
                <div class="pair-card-body">
                  <strong class="pair-card-title">{{ pair.title }}</strong>
                  <span class="agenda-row-meta">{{ pairMeta(pair) }}</span>
                <span class="pair-actions">
                  <a-button v-if="pair.status === 'not_started'" type="primary" size="small" @click="emit('open-scanner')">
                    Начать пару
                  </a-button>
                  <a-button v-else size="small" @click="openTeacherDialog('journal', pair.id)">
                    Отметки
                  </a-button>
                  <a-button type="link" size="small" class="pair-problem" @click="openTeacherDialog('problem', pair.id)">Проблема в аудитории</a-button>
                </span>
                </div>
              </li>
            </ul>
          </a-card>
          <a-card class="useful-agenda" role="region" aria-labelledby="home-attention-heading">
            <template #title><h3 id="home-attention-heading">Требует внимания</h3></template>
            <div v-if="attentionGroups.length" class="attention-groups">
              <section v-for="group in attentionGroups" :key="group.id" class="attention-group" :aria-labelledby="`attention-${group.id}`">
                <h4 :id="`attention-${group.id}`" class="attention-group-title">{{ group.title }}</h4>
                <ul class="agenda-list">
                  <li v-for="item in group.rows" :key="item.id">
                    <button type="button" class="agenda-row" @click="item.run">
                      <strong>{{ item.title }}</strong>
                      <span v-if="item.detail" class="agenda-row-meta">{{ item.detail }}</span>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
            <p v-else class="agenda-message attention-ok"><CheckCircleOutlined /> Всё в порядке</p>
          </a-card>
          <div class="useful-tiles" aria-label="Сервисы преподавателя">
            <button v-for="item in teacherTiles" :key="item.label" class="useful-tile" @click="openTeacherTile(item)">
              <span v-if="item.glyph" class="useful-tile-icon useful-tile-glyph" aria-hidden="true"><component :is="item.glyph" /></span>
              <img v-else class="useful-tile-icon" :src="isDark ? item.darkIcon : item.icon" alt="" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>
        <div v-else class="useful-grid">
          <a-card class="useful-agenda" role="region" aria-labelledby="home-schedule-heading">
            <template #title><h3 id="home-schedule-heading">Расписание занятий</h3></template>
            <template #extra>
              <button type="button" class="useful-panel-more" aria-label="Открыть расписание" @click="openByLabel('Расписание')">
                <RightOutlined />
              </button>
            </template>
            <template v-if="authenticated">
              <p class="agenda-lesson-date">
                <time :datetime="lessonSchedule.date.toISOString().slice(0, 10)">{{ lessonDateFormat.format(lessonSchedule.date) }}</time>
              </p>
              <ul class="agenda-list">
                <li v-for="lesson in lessonSchedule.lessons" :key="lesson.start" class="agenda-row">
                  <strong>{{ lesson.title }}</strong>
                  <span class="agenda-row-meta"><time :datetime="lesson.start">{{ lesson.start }}</time>–<time :datetime="lesson.end">{{ lesson.end }}</time></span>
                </li>
              </ul>
            </template>
            <p v-else class="agenda-message">Войдите, чтобы посмотреть расписание занятий.</p>
          </a-card>
          <a-card class="useful-agenda" role="region" aria-labelledby="home-requests-heading">
            <template #title><h3 id="home-requests-heading">Мои заявки</h3></template>
            <template #extra>
              <button type="button" class="useful-panel-more" aria-label="Открыть мои заявки" @click="choose(updates[1])">
                <RightOutlined />
              </button>
            </template>
            <div v-if="myRequests.length" class="agenda-scroll-frame">
              <div ref="requestViewport" class="agenda-content-scroll"
                :class="{ 'fade-top': hasRequestsAbove, 'fade-bottom': hasRequestsBelow }"
                @scroll.passive="onRequestScroll">
                <ul ref="requestList" class="agenda-list">
                  <li v-for="item in myRequests" :key="item.id">
                    <button type="button" class="agenda-row" @click="emit('open-request', item.id)">
                      <strong>{{ item.title }}</strong>
                      <span class="agenda-row-meta">
                        <time :datetime="item.startsAt">{{ requestDateFormat.format(new Date(item.startsAt)) }}</time>
                        <template v-if="requestStatuses[item.status]"> · {{ requestStatuses[item.status].label }}</template>
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
              <span aria-hidden="true" class="agenda-scroll-thumb"
                :class="{ visible: scrollingRequests }"
                :style="{ height: requestThumbHeight + 'px', transform: 'translateY(' + requestThumbOffset + 'px)' }" />
            </div>
            <p v-else class="agenda-message">{{ authenticated ? 'У вас пока нет заявок.' : 'Войдите, чтобы увидеть свои заявки.' }}</p>
          </a-card>
          <div class="useful-tiles" aria-label="Другие сервисы">
            <button v-for="item in usefulServices" :key="item.label" class="useful-tile" @click="openQuickLink(item)">
              <img class="useful-tile-icon" :src="isDark ? item.darkIcon : item.icon" alt="" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>
      </section>
      <footer class="portal-footer" aria-label="О приложении и обратная связь">
        <section class="footer-feedback" aria-labelledby="footer-feedback-heading">
          <p>Задайте вопрос или поделитесь предложениями по улучшению.</p>
          <div class="footer-feedback-heading">
            <h2 id="footer-feedback-heading"><a href="mailto:support_one@dvfu.ru">support_one@dvfu.ru</a></h2>
            <a-button type="link" class="footer-feedback-link" @click="emit('feedback')">Открыть обратную связь</a-button>
          </div>
        </section>
        <section class="footer-download" aria-label="Скачать приложение">
          <div class="store-grid">
            <div class="store-badge" aria-label="Загрузите в App Store">
              <svg class="store-logo apple-logo" viewBox="0 0 24 28" aria-hidden="true"><path fill="currentColor" d="M19.9 14.8c0-3.5 2.9-5.2 3-5.3-1.6-2.4-4.2-2.7-5.1-2.7-2.2-.2-4.3 1.3-5.4 1.3s-2.8-1.3-4.6-1.3c-2.4 0-4.7 1.4-5.9 3.6-2.5 4.3-.6 10.7 1.8 14.2 1.2 1.7 2.6 3.5 4.4 3.4 1.8-.1 2.5-1.1 4.7-1.1s2.8 1.1 4.7 1.1c2 0 3.2-1.7 4.3-3.4 1.4-1.9 2-3.8 2-3.9-.1 0-3.9-1.5-3.9-5.9zM16.4 4.5c1-1.2 1.7-2.9 1.5-4.5-1.5.1-3.3 1-4.3 2.2-.9 1-1.8 2.7-1.6 4.4 1.6.1 3.3-.8 4.4-2.1z"/></svg>
              <span><small>Загрузите в</small><strong>App Store</strong></span>
            </div>
            <div class="store-badge" aria-label="Доступно в Google Play">
              <svg class="store-logo" viewBox="0 0 28 32" aria-hidden="true"><path fill="#36c5f0" d="M1 1 16 16 1 31z"/><path fill="#50d087" d="M1 1 20 12 16 16z"/><path fill="#ffcf42" d="m20 12 7 4-7 4-4-4z"/><path fill="#f46a5d" d="M1 31 16 16l4 4z"/></svg>
              <span><small>ДОСТУПНО В</small><strong>Google Play</strong></span>
            </div>
            <div class="store-badge" aria-label="Доступно в RuStore">
              <span class="store-logo rustore-logo"><span>▥</span></span>
              <span><small>Доступно в</small><strong>RuStore</strong></span>
            </div>
          </div>
        </section>
      </footer>
    </div>
    </div>
    <DesktopServiceDialog :service="serviceDetails" :now="now" :authenticated="authenticated" @close="serviceDetails = null"
      @login="serviceDetails = null; emit('login')" @open-request="(id) => emit('open-request', id)" />
    <TeacherDialogs :dialog="teacherDialog" @close="teacherDialog = null" />
  </div>
</template>

<style scoped src="./desktop-portal.css"></style>
