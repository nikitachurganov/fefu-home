<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { CheckCircleFilled, ScanOutlined } from '@ant-design/icons-vue'
import QrScanner from '../QrScanner.vue'
import FeedbackSheet from '../FeedbackSheet.vue'
import ProblemReportSheet from '../ProblemReportSheet.vue'
import LessonCard from './LessonCard.vue'
import ScannerPanel from './ScannerPanel.vue'
import ManualCodeEntry from './ManualCodeEntry.vue'
import ScanResult from './ScanResult.vue'
import RequestByCode from './RequestByCode.vue'
import SessionView from './SessionView.vue'
import SessionDone from './SessionDone.vue'
import ItemProblemSheet from './ItemProblemSheet.vue'
import InventoryView from './InventoryView.vue'
import ScanModeSwitch from './ScanModeSwitch.vue'
import DemoCodes from './DemoCodes.vue'
import { demoCodeGroupsFor, studentDemoCodes } from '../../data/demoCodes'
import ClassInfoView from './ClassInfoView.vue'
import ClassSessionView from './ClassSessionView.vue'
import ClassQrDisplay from './ClassQrDisplay.vue'
import ClassStartCard from './ClassStartCard.vue'
import RoomCardOverlay from './RoomCardOverlay.vue'
import {
  activeLessons,
  endClass,
  findScheduledLesson,
  isActionCodeActive,
  markStudentPresent,
  performCheckIn,
  performClassMark,
  startClass,
} from '../../data/actionCodes'
import { assetStatuses, assets, parentOf } from '../../data/assets'
import { addProblem } from '../../data/requestModel'
import { requests, updateRequest } from '../../data/requestStore'
import { buildCode, normalizeManual, parseCode } from '../../data/scanCodes'
import { resolveInventoryStart, resolveScan, scanErrors } from '../../data/scanModel'
import {
  applyInventoryScan,
  applyScan,
  canFinish,
  canInventory,
  createAcceptSession,
  createInventorySession,
  createIssueSession,
  demoUnits,
  inventorySummary,
  itemLabel,
  progress,
  reportProblem as markItemProblem,
} from '../../data/sessionModel'
import { confirmWorkplaceStart, finishAccept, finishIssue, finishWorkplace } from '../../data/staffActions'
import { isStaff, isTeacher, role } from '../../data/userStore'

// Единый сканер: сам решает, что показать после кода. Шаги:
//   camera → (manual) → result      — паспорта, чекин, отметка на паре и ошибки;
//   camera → class-session          — преподаватель: пара начата, видна ведомость и QR для студентов;
//   camera → session                — сотрудник: код заявки на оборудование или ТМЦ (выдача) или код возврата (приёмка);
//   camera → request                — сотрудник: код заявки на рабочее место или чекаута;
//   camera → session (инвентаризация) — сотрудник в режиме «Инвентаризация»: код здания или помещения задаёт область.
// У сотрудника сверху переключатель режимов: «Сканер» (всё, что выше) и «Инвентаризация».
// Сканер запускает камеру на ПК и телефоне; при ошибке доступен ручной ввод.
const emit = defineEmits(['close', 'open-requests'])

const showDemo = import.meta.env.DEV
// Поверх сообщений сканера (z-index 1100) шторка «Отметить проблему» должна быть выше.
const SHEET_Z = 1200

const cameraError = ref('')
const canUseCamera = computed(() => !cameraError.value)

const step = ref(canUseCamera.value ? 'camera' : 'manual')
// Режим сканера сотрудника: 'scan' — обычный, 'inventory' — инвентаризация. Пользователю доступен только обычный.
const mode = ref('scan')
const inventoryMode = computed(() => isStaff.value && mode.value === 'inventory')
const result = ref(null)
// Предыдущие результаты при переходах по связям паспорта: «Назад» возвращает по ним.
const trail = ref([])

// Сотрудник: открытая по коду заявка, сессия (выдача, приёмка, инвентаризация) и подсказка по последнему скану.
const staffRequest = ref(null)
const session = ref(null)
const feedback = ref(null)
// Камера поверх списка сессии включается кнопкой сканирования у позиции.
const scanning = ref(false)
const problemOpen = ref(false)
// Форма «Проблема с ТМЦ» при приёмке: фиксирует проблему по позиции, а не по всей заявке.
const itemProblemOpen = ref(false)

// Отметка на паре: на телефоне камера остаётся фоном, поверх неё карточка занятия (lesson).
// scanKey пересоздаёт камеру, когда пользователь нажимает «Сканировать ещё».
const lesson = ref(null)
// Результат скана помещения (Экраны 2, 3, 4): { room, lesson, scenario }
const roomCard = ref(null)
const scanKey = ref(0)
const feedbackOpen = ref(false)

// ─── Пара: преподаватель ───────────────────────────────────────────────────────
// activeLessonId — id пары, открытой в текущей сессии преподавателя.
// Экран class-session показывает ведомость + QR, class-qr — QR на весь экран (проектор).
// scheduledLesson — данные пары из расписания (показываются до старта).
const activeLessonId = ref(null)
const scheduledLesson = ref(null) // { lesson, roomId } — из расписания, ещё не начата
const classFeedback = ref(null)   // отклик после скана студента
const showClassQr = ref(false)    // показывать ли QR на весь экран (ClassQrDisplay)
// Режим сканирования студентов (камера в сессии пары).
const scanningStudents = ref(false)

const currentActiveLesson = computed(() =>
  activeLessonId.value ? activeLessons[activeLessonId.value] ?? null : null
)

// Преподаватель: паспорт аудитории → занятие по расписанию → старт пары
function openScheduledLesson(roomId) {
  const found = findScheduledLesson(roomId)
  if (!found) return false
  // Уже есть активная сессия этой пары — сразу открываем.
  if (activeLessons[found.id]) {
    activeLessonId.value = found.id
    step.value = 'class-session'
    return true
  }
  // Пара по расписанию — показываем карточку со старт-кнопкой.
  scheduledLesson.value = { lesson: found, roomId }
  step.value = 'class-start'
  return true
}

function doStartClass() {
  if (!scheduledLesson.value) return
  const { lesson: lessonData } = scheduledLesson.value
  const result = startClass(lessonData)
  if (!result.ok) return
  activeLessonId.value = result.lessonId
  scheduledLesson.value = null
  roomCard.value = null
  classFeedback.value = null
  step.value = 'class-session'
}

function doStartClassFromCard() {
  if (!roomCard.value?.lesson) return
  const lessonData = roomCard.value.lesson
  const result = startClass(lessonData)
  if (!result.ok) return
  activeLessonId.value = result.lessonId
  scheduledLesson.value = null
  roomCard.value = null
  classFeedback.value = null
  step.value = 'class-session'
}

function closeRoomCard() {
  roomCard.value = null
  scanKey.value += 1
}

function doEndClass() {
  if (!activeLessonId.value) return
  endClass(activeLessonId.value)
  activeLessonId.value = null
  classFeedback.value = null
  showClassQr.value = false
  scanningStudents.value = false
  showResult({ ok: true, kind: 'done', title: 'Пара завершена', text: 'Ведомость сохранена. Вы можете начать следующую пару, отсканировав аудиторию.' })
}

// Преподаватель сканирует студенческий код в ходе активной пары.
function handleStudentScan(codeId) {
  if (!activeLessonId.value) {
    classFeedback.value = { type: 'error', text: 'Нет активной пары. Начните пару, чтобы сканировать студентов.' }
    return
  }
  const result = markStudentPresent(codeId, activeLessonId.value)
  if (!result.ok) {
    const err = scanErrors[result.error] ?? scanErrors.unrecognized
    classFeedback.value = { type: 'error', text: result.detail ?? err.text }
    return
  }
  classFeedback.value = { type: 'success', text: `${result.student.name} — отмечен` }
  // Звуковой отклик тут не реализован, но место для него есть.
}

const currentRequest = computed(() => requests.value.find((request) => request.id === staffRequest.value?.id) ?? null)
const isInventory = computed(() => session.value?.kind === 'inventory')
const counter = computed(() => (session.value && !isInventory.value ? progress(session.value) : { done: 0, total: 0 }))

const isAccept = computed(() => session.value?.kind === 'accept')
const isTmc = computed(() => currentRequest.value?.source === 'tmc')

const sessionTitle = computed(() => {
  if (!session.value) return ''
  if (isInventory.value) return 'Инвентаризация'
  const noun = isTmc.value ? 'ТМЦ' : 'оборудования'
  return isAccept.value ? `Приём ${noun}` : `Выдача ${noun}`
})
const sessionSubtitle = computed(() => {
  if (!session.value || isInventory.value) return ''
  return isAccept.value ? `Бронь № ${currentRequest.value?.id ?? ''}` : 'Укажите все коды для выдачи'
})
// Позиции для списка в форме «Проблема с ТМЦ».
const problemItems = computed(() => (session.value?.items ?? []).map((item) => ({ value: item.key, label: itemLabel(item) })))

const titles = computed(() => ({
  manual: inventoryMode.value ? 'Инвентаризация' : 'Ввод кода',
  result: result.value?.ok && result.value.kind === 'passport' ? 'Паспорт' : 'Результат',
  request: currentRequest.value ? `Заявка №${currentRequest.value.id}` : 'Заявка',
  session: sessionTitle.value,
  'class-start': 'Занятие',
  'class-session': currentActiveLesson.value?.lesson.title ?? 'Пара',
}))
const inventoryHint = 'Отсканируйте код здания или помещения'
const subtitles = computed(() => ({
  manual: inventoryMode.value ? inventoryHint : '',
  session: sessionSubtitle.value,
  'class-start': 'Расписание аудитории',
  'class-session': currentActiveLesson.value ? `${currentActiveLesson.value.lesson.place} · ${currentActiveLesson.value.lesson.group}` : '',
}))

// Демо-коды режима «Инвентаризация»: здания и помещения, плюс коды, которые этому режиму не подходят.
const inventoryStartGroups = computed(() => {
  const label = (asset) => ({ label: `${asset.title} · ${asset.id}`, text: buildCode('passport', asset.id) })
  return [
    { title: 'Здания и помещения', codes: assets.filter((asset) => canInventory(asset) && asset.status !== 'written-off').map(label) },
    {
      title: 'Не для этого режима',
      codes: [
        { label: 'Проектор EQ-0142 (отдельная единица)', text: buildCode('passport', 'EQ-0142') },
        { label: 'Код заявки №3001', text: buildCode('request', '3001') },
      ],
    },
  ]
})

// Демо-коды для сессии: единицы заявки или всё, что можно найти при инвентаризации, плюс «чужие» коды.
const unitGroups = computed(() => {
  const label = (asset) => ({ label: `${asset.title} · ${asset.id} — ${assetStatuses[asset.status].label}`, text: buildCode('passport', asset.id) })
  if (isInventory.value) {
    const physical = assets.filter((asset) => ['equipment', 'workplace'].includes(asset.type))
    return [
      { title: 'Единицы', codes: physical.map(label) },
      { title: 'Неизвестный код', codes: [{ label: 'Паспорт EQ-7777 (нет в системе)', text: buildCode('passport', 'EQ-7777') }] },
    ]
  }
  return [
    { title: 'Единицы', codes: demoUnits().map(label) },
    { title: 'Не для этого режима', codes: [{ label: 'Код заявки №3001', text: buildCode('request', '3001') }] },
  ]
})

function showResult(next) {
  trail.value = []
  result.value = next
  step.value = 'result'
}

function beginSession(next) {
  session.value = next
  feedback.value = null
  // Инвентаризация сразу открывает камеру, а выдача и приёмка начинаются со списка позиций.
  scanning.value = next.kind === 'inventory' && canUseCamera.value
  step.value = 'session'
}

function openStaffRequest({ kind, id }) {
  staffRequest.value = { id, kind }
  trail.value = []
  const request = requests.value.find((item) => item.id === id)
  // Оборудование и ТМЦ сразу идут к выдаче или приёмке, рабочее место — к подтверждению заявки.
  if (kind === 'request' && request.source !== 'workplace') beginSession(createIssueSession(request))
  else if (kind === 'return') beginSession(createAcceptSession(request))
  else step.value = 'request'
}

// Режим «Инвентаризация»: код здания или помещения сразу открывает сессию, без экрана паспорта.
function startInventoryByCode(text, source) {
  const next = resolveInventoryStart(text, { role: role.value, source })
  if (!next.ok) {
    showResult(next)
    return
  }
  trail.value = []
  beginSession(createInventorySession(next.asset))
}

function handle(text, source) {
  if (inventoryMode.value) {
    startInventoryByCode(text, source)
    return
  }

  // ─── Преподаватель сканирует студенческий код в режиме сессии пары ───────────
  if (isTeacher.value && step.value === 'class-session') {
    const parsed = parseCode(text)
    if (parsed?.kind === 'student') {
      handleStudentScan(parsed.id)
      return
    }
    // Любой другой код в сессии пары показываем как ошибку режима.
    classFeedback.value = { type: 'error', text: 'В режиме пары сканируйте только студенческие коды.' }
    return
  }

  let next = resolveScan(text, { role: role.value, source, checkActive: (parsed) => isActionCodeActive(parsed) })

  // ─── Паспорт помещения: экраны 2, 3, 4 (камера фоном, карточка поверх) ─────────
  if (next.ok && next.kind === 'passport' && next.asset?.type === 'room') {
    const scheduled = isTeacher.value ? findScheduledLesson(next.asset.id) : null
    if (isTeacher.value && scheduled) {
      // Сценарий 2: Преподаватель и есть пара по расписанию в этой аудитории
      scheduledLesson.value = { lesson: scheduled, roomId: next.asset.id }
      roomCard.value = {
        room: next.asset,
        lesson: scheduled,
        scenario: 'teacher-class',
      }
      return
    }

    if (next.asset.hasRelay) {
      // Сценарий 4: Помещение с реле для открытия двери
      roomCard.value = {
        room: next.asset,
        lesson: null,
        scenario: 'relay',
      }
      return
    }

    // Сценарий 3: Помещение без пары и без реле (дефолтный результат)
    roomCard.value = {
      room: next.asset,
      lesson: null,
      scenario: 'default',
    }
    return
  }

  // Чекин и пара — действия пользователя: тут же отмечаем и показываем итог.
  if (next.ok && next.kind === 'checkin') next = performCheckIn(next.id)
  else if (next.ok && next.kind === 'class') {
    next = performClassMark(next.id)
    // С камеры карточка занятия показывается прямо поверх неё, без перехода на отдельную страницу.
    if (next.ok && step.value === 'camera') {
      lesson.value = next.lesson
      return
    }
  } else if (next.ok && ['request', 'return', 'checkout'].includes(next.kind)) {
    openStaffRequest(next)
    return
  }
  showResult(next)
}

// Переход по связям паспорта: проходит те же проверки, что и скан, поэтому закрытое покажет «Нет доступа».
function openLinked(id) {
  trail.value.push(result.value)
  result.value = resolveScan(buildCode('passport', id), { role: role.value })
}

// Подсказки по последнему скану в сессии (тексты из макета «Сканер»).
function feedbackFor(outcome, asset) {
  const unit = `${asset.title} · ${asset.id}`
  switch (outcome) {
    case 'matched': return { type: 'success', text: `${asset.title}: код верный. Можно сканировать следующий.` }
    case 'replaced': return { type: 'success', text: `Выдан аналог: ${unit}` }
    case 'unavailable': return { type: 'warning', text: `${unit}: ${assetStatuses[asset.status].label.toLowerCase()}. Отсканируйте аналог той же модели.` }
    case 'duplicate': return { type: 'info', text: `${asset.title} уже отсканирован, отсканируйте другой код.` }
    default: return { type: 'error', text: 'Отсканирован неверный код' }
  }
}

function inventoryFeedback(outcome, asset, id) {
  const unit = asset ? `${asset.title} · ${asset.id}` : id
  switch (outcome) {
    case 'found': return { type: 'success', text: `Найдено: ${unit}` }
    case 'elsewhere': return { type: 'warning', text: `${unit} числится в другом месте: ${parentOf(asset)?.title ?? '—'}.` }
    case 'unknown': return { type: 'error', text: `Неизвестный код ${id}: его нет в системе.` }
    default: return { type: 'info', text: `${unit} уже отсканировано.` }
  }
}

function showScanError(error) {
  const { title, text } = scanErrors[error]
  feedback.value = { type: 'error', text: `${title}. ${text}` }
}

function handleSessionScan(text, source) {
  if (isInventory.value) {
    // При инвентаризации неизвестный паспорт — не ошибка скана, а расхождение, поэтому проверку кода пропускаем.
    const parsed = parseCode(text)
    if (parsed?.kind !== 'passport') {
      const scan = resolveScan(text, { role: role.value, mode: 'session', source })
      showScanError(scan.ok ? 'wrong-mode' : scan.error)
      return
    }
    const { session: next, outcome, asset } = applyInventoryScan(session.value, parsed.id)
    session.value = next
    feedback.value = inventoryFeedback(outcome, asset, parsed.id.toUpperCase())
    return
  }

  const scan = resolveScan(text, { role: role.value, mode: 'session', source })
  if (!scan.ok) {
    showScanError(scan.error)
    return
  }
  const { session: next, outcome, asset } = applyScan(session.value, scan.id)
  session.value = next
  feedback.value = feedbackFor(outcome, asset)
  // Всё отсканировано — сканер закрывается и возвращает к списку, где ждёт итоговая кнопка.
  if (canFinish(next)) {
    scanning.value = false
    feedback.value = { type: 'success', text: 'Все коды отсканированы' }
  }
}

function finishSession() {
  if (isInventory.value) {
    const summary = inventorySummary(session.value)
    session.value = null
    showResult({ ok: true, kind: 'inventory', summary })
    return
  }
  const issue = session.value.kind === 'issue'
  const request = currentRequest.value
  if (issue) finishIssue(session.value)
  else finishAccept(session.value)
  session.value = null
  // После приёмки показываем сводку закрытой заявки (макет «Сессия завершена»).
  if (!issue && request) {
    showResult({ ok: true, kind: 'session-done', request: { ...request } })
    return
  }
  showResult({
    ok: true,
    kind: 'done',
    title: issue ? 'Выдача подтверждена' : 'Приёмка завершена',
    text: issue
      ? 'Пользователь получил уведомление: пусть сфотографирует предмет в заявке, после этого начнётся аренда.'
      : 'Заявка закрыта и перенесена в архив.',
  })
}

// Отмена сессии возвращает к сканеру в том же режиме: выдача и приёмка — в обычный, инвентаризация — в свой.
const cancelSession = () => restart()

function reportProblem(text) {
  const request = currentRequest.value
  if (!request) return
  updateRequest(request.id, (item) => addProblem(item, text))
  problemOpen.value = false
  message.success('Проблема записана в заявку')
}

function reportItemProblem(payload) {
  session.value = markItemProblem(session.value, payload.key, payload)
  itemProblemOpen.value = false
  message.success('Проблема записана: единица уйдёт на обслуживание')
}

function confirmStart() {
  confirmWorkplaceStart(staffRequest.value.id)
  showResult({ ok: true, kind: 'done', title: 'Начало подтверждено', text: 'Пользователь сфотографирует место в заявке — после этого начнётся сессия.' })
}

function finishPlace(payload) {
  finishWorkplace(staffRequest.value.id, payload)
  showResult({
    ok: true,
    kind: 'done',
    title: 'Сессия завершена',
    text: payload.condition === 'ok' ? 'Место принято, заявка закрыта.' : 'Замечания сохранены, место отправлено на обслуживание.',
  })
}

function onCameraError(text) {
  cameraError.value = text
  if (step.value === 'session') scanning.value = false
  else if (step.value === 'class-session') scanningStudents.value = false
  else step.value = 'manual'
}

// «Сканировать ещё»: на телефоне возвращаемся к камере, иначе остаёмся на вводе.
function rescan() {
  roomCard.value = null
  lesson.value = null
  scanKey.value += 1
}

function retryCamera() {
  cameraError.value = ''
  restart()
}

function restart() {
  roomCard.value = null
  lesson.value = null
  trail.value = []
  session.value = null
  scanning.value = false
  scanningStudents.value = false
  step.value = canUseCamera.value ? 'camera' : 'manual'
}

function back() {
  if (roomCard.value) {
    roomCard.value = null
    return
  }
  if (step.value === 'session') cancelSession()
  else if (step.value === 'class-session') {
    // Преподаватель: «Назад» из сессии пары возвращает к сканеру, но пара остаётся активной.
    scanningStudents.value = false
    restart()
  } else if (step.value === 'class-start') {
    scheduledLesson.value = null
    restart()
  } else if (step.value === 'result' && trail.value.length) result.value = trail.value.pop()
  else restart()
}

// Закрытие шторки при смене шага не должно оставлять её открытой.
watch(step, () => { problemOpen.value = false; itemProblemOpen.value = false })
// Роль сменили прямо в сканере (демо): у пользователя режима инвентаризации нет.
watch(isStaff, (staff) => { if (!staff) mode.value = 'scan' })
</script>

<template>
  <QrScanner
    v-if="step === 'camera'"
    :key="scanKey"
    :cover="!!lesson"
    :has-overlay="!!roomCard"
    :title="inventoryMode ? 'Инвентаризация' : undefined"
    :subtitle="inventoryMode ? inventoryHint : ''"
    @close="emit('close')"
    @detect="(text) => handle(text, 'camera')"
    @manual="step = 'manual'"
    @camera-error="onCameraError"
  >
    <ScanModeSwitch v-if="isStaff && !lesson && !roomCard" v-model="mode" />
    <template v-if="lesson" #toast>
      <p class="lesson-toast" role="status"><CheckCircleFilled aria-hidden="true" /> Вы отмечены</p>
    </template>
    <div v-if="lesson" class="lesson-sheet">
      <LessonCard :lesson="lesson" @feedback="feedbackOpen = true" />
      <button type="button" class="rescan" aria-label="Сканировать ещё" @click="rescan"><ScanOutlined aria-hidden="true" /></button>
    </div>

    <!-- Результат сканирования помещения: Экраны 2, 3, 4 -->
    <RoomCardOverlay
      v-if="roomCard"
      :room="roomCard.room"
      :lesson="roomCard.lesson"
      :is-teacher="isTeacher"
      @close="closeRoomCard"
      @start-class="doStartClassFromCard"
      @feedback="feedbackOpen = true"
    />
  </QrScanner>

  <!-- Сессия на телефоне: камера не закрывается между сканами, список позиций лежит поверх неё. -->
  <QrScanner
    v-else-if="step === 'session' && scanning && canUseCamera"
    continuous
    :wide="!isInventory"
    :title="isInventory ? sessionTitle : `Сканирование ${currentRequest?.source === 'tmc' ? 'ТМЦ' : 'оборудования'}`"
    :subtitle="isInventory ? '' : `Наведите камеру на код · отсканировано ${counter.done} из ${counter.total}`"
    @close="scanning = false"
    @detect="(text) => handleSessionScan(text, 'camera')"
    @manual="scanning = false"
    @camera-error="onCameraError"
  >
    <InventoryView v-if="isInventory" compact :session="session" :feedback="feedback" @finish="finishSession" @cancel="cancelSession" />
    <SessionView v-else compact :session="session" :request="currentRequest" :feedback="feedback" />
  </QrScanner>

  <!-- Сессия пары: преподаватель сканирует студентов (камера поверх ведомости). -->
  <QrScanner
    v-else-if="step === 'class-session' && scanningStudents && canUseCamera"
    continuous
    wide
    title="Сканирование студентов"
    subtitle="Наводите камеру на QR-код студента"
    @close="scanningStudents = false"
    @detect="(text) => handle(text, 'camera')"
    @manual="scanningStudents = false"
    @camera-error="onCameraError"
  >
    <div v-if="classFeedback" class="student-scan-feedback" :class="`sfb--${classFeedback.type}`" role="status" aria-live="polite">
      {{ classFeedback.text }}
    </div>
    <DemoCodes
      v-if="showDemo && currentActiveLesson"
      :groups="[{ title: 'Студенты (показывают свой QR)', codes: studentDemoCodes }]"
      @pick="(text) => handle(text, 'camera')"
    />
  </QrScanner>

  <ScannerPanel
    v-else
    :title="titles[step]"
    :subtitle="subtitles[step] ?? ''"
    :can-go-back="step !== 'manual' || canUseCamera"
    @close="emit('close')"
    @back="back"
  >
    <div v-if="step === 'manual'" class="manual-step">
      <div v-if="roomCard" class="manual-room-card">
        <RoomCardOverlay
          :room="roomCard.room"
          :lesson="roomCard.lesson"
          :is-teacher="isTeacher"
          @close="closeRoomCard"
          @start-class="doStartClassFromCard"
          @feedback="feedbackOpen = true"
        />
      </div>
      <template v-else>
        <ScanModeSwitch v-if="isStaff" v-model="mode" />
        <ManualCodeEntry
          :camera-error="cameraError"
          :can-use-camera="canUseCamera"
          :inventory="inventoryMode"
          @submit="(input) => handle(normalizeManual(input), 'manual')"
          @camera="retryCamera"
        />
        <DemoCodes v-if="showDemo" @pick="(text) => handle(text, 'camera')" />
      </template>
    </div>

    <RequestByCode
      v-else-if="step === 'request'"
      :request="currentRequest"
      :kind="staffRequest.kind"
      @confirm-start="confirmStart"
      @finish-workplace="finishPlace"
    />

    <!-- Преподаватель: карточка занятия по расписанию (ещё не начатого) -->
    <ClassStartCard
      v-else-if="step === 'class-start' && scheduledLesson"
      :lesson="scheduledLesson.lesson"
      :is-active="!!activeLessons[scheduledLesson.lesson.id]"
      @start="doStartClass"
      @open-session="() => { activeLessonId = scheduledLesson.lesson.id; step = 'class-session' }"
    />

    <!-- Преподаватель: активная пара (Figma 977:7128) -->
    <ClassInfoView
      v-else-if="step === 'class-session' && currentActiveLesson"
      :lesson="currentActiveLesson.lesson"
      :session="currentActiveLesson"
      :can-use-camera="canUseCamera"
      :feedback="classFeedback"
      @back="back"
      @scan-student="scanningStudents = true"
      @show-qr="showClassQr = true"
      @end-class="doEndClass"
      @demo-mark="(text) => handle(text, 'camera')"
    />

    <InventoryView
      v-else-if="step === 'session' && isInventory"
      :session="session"
      :feedback="feedback"
      @finish="finishSession"
      @cancel="cancelSession"
    >
      <ManualCodeEntry
        :camera-error="cameraError"
        :can-use-camera="canUseCamera"
        @submit="(input) => handleSessionScan(normalizeManual(input), 'manual')"
        @camera="cameraError = ''; scanning = true"
      />
      <DemoCodes v-if="showDemo" :groups="unitGroups" @pick="(text) => handleSessionScan(text, 'camera')" />
    </InventoryView>

    <SessionView
      v-else-if="step === 'session'"
      :session="session"
      :request="currentRequest"
      :feedback="feedback"
      :can-use-camera="canUseCamera"
      :sheet-z="SHEET_Z"
      @scan="scanning = true"
      @code="(text) => handleSessionScan(normalizeManual(text), 'manual')"
    >
      <DemoCodes v-if="showDemo" :groups="unitGroups" @pick="(text) => handleSessionScan(text, 'camera')" />
    </SessionView>

    <ScanResult
      v-else
      :result="result"
      :can-use-camera="canUseCamera"
      :staff="isStaff"
      @again="restart"
      @manual="step = 'manual'"
      @open="openLinked"
      @feedback="feedbackOpen = true"
      @close="emit('close')"
      @sessions="emit('open-requests')"
    />

    <template v-if="step === 'session' && !isInventory" #footer>
      <a-button size="large" @click="isAccept ? (itemProblemOpen = true) : (problemOpen = true)">
        {{ isAccept ? `Проблема с ${isTmc ? 'ТМЦ' : 'оборудованием'}` : 'Отметить проблему' }}
      </a-button>
      <a-button type="primary" size="large" :disabled="!canFinish(session)" @click="finishSession">
        {{ isAccept ? 'Подтвердить сдачу' : 'Выдать' }}
      </a-button>
    </template>
  </ScannerPanel>

  <ProblemReportSheet :open="problemOpen" :z-index="SHEET_Z" @close="problemOpen = false" @submit="reportProblem" />
  <ItemProblemSheet :open="itemProblemOpen" :items="problemItems" :z-index="SHEET_Z" @close="itemProblemOpen = false" @submit="reportItemProblem" />
  <FeedbackSheet :open="feedbackOpen" :z-index="SHEET_Z" @close="feedbackOpen = false" />

  <!-- Полноэкранный режим QR для проектора/мультимедиа (поверх всего). -->
  <ClassQrDisplay
    v-if="showClassQr && currentActiveLesson"
    :lesson="currentActiveLesson.lesson"
    :session="currentActiveLesson"
    @back="showClassQr = false"
  />
</template>

<style scoped>
.manual-step { display: grid; min-width: 0; gap: 16px; }
/* Слот камеры: подтверждение сверху и карточка занятия снизу (макет «Вы отмечены»). */
.lesson-toast { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; padding: 12px 16px; border-radius: 12px; background: #fff; color: #101828; font-size: 17px; line-height: 24px; box-shadow: 0 4px 16px rgba(0, 0, 0, .2); }
.lesson-toast :deep(.anticon) { color: #52c41a; font-size: 20px; }
.lesson-sheet { display: grid; justify-items: center; gap: 16px; }
.lesson-sheet > :first-child { width: 100%; }
.rescan { display: grid; width: 64px; height: 64px; place-items: center; border: 0; border-radius: 50%; background: #fff; color: #4a7fd1; font-size: 28px; box-shadow: 0 4px 16px rgba(0, 0, 0, .25); cursor: pointer; }
.rescan:active { opacity: .8; }
.rescan:focus-visible { outline: 3px solid rgba(22, 119, 255, .6); outline-offset: 3px; }
.student-scan-feedback { margin: 8px 16px; padding: 12px 16px; border-radius: 12px; font-size: 15px; font-weight: 600; text-align: center; box-shadow: 0 4px 16px rgba(0, 0, 0, .2); }
.sfb--success { background: #f6ffed; color: #389e0d; }
.sfb--error { background: #fff1f0; color: #cf1322; }
.sfb--info { background: #e6f4ff; color: #0958d9; }
</style>
