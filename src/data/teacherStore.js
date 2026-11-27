import { computed, ref } from 'vue'

// Демо-данные главной преподавателя (ROLES_SPEC.md §3.5, docs/useful-services-by-role.md).
// Настоящие данные: GET /education/pairs, /pairs/days, /education/students, причины опоздания и оценки пар.

// Статусы пары у преподавателя.
export const pairStatuses = {
  not_started: { label: 'Не начата', color: 'default' },
  started: { label: 'Идёт', color: 'processing' },
  started_late: { label: 'Начата с опозданием', color: 'warning' },
  disrupted: { label: 'Сорвана', color: 'error' },
}

// Статусы отметки студента. null — ещё не отмечен.
export const attendanceStatuses = {
  done: 'Присутствовал',
  late: 'Опоздал',
  sick: 'Болеет',
  good_reason: 'Уважительная причина',
  not_planned: 'Не ожидается',
}
export const attendanceOptions = Object.entries(attendanceStatuses).map(([value, label]) => ({ value, label }))

// Причины опоздания или срыва пары; для «Другое» нужен комментарий.
export const delayReasons = [
  { value: 'traffic', label: 'Пробки' },
  { value: 'technical', label: 'Технический сбой' },
  { value: 'previous_pair', label: 'Прошлая пара затянулась' },
  { value: 'distance', label: 'Расстояние между кабинетами' },
  { value: 'other', label: 'Другое' },
]

// Посещаемость ≤ 50 % — студент «в зоне риска».
export const RISK_THRESHOLD = 50

const students = [
  { id: '24-08192', name: 'Чурганов Никита', group: 'Б9123-09.03.04', subgroup: 1, attendance: 92 },
  { id: '24-08201', name: 'Соколова Анна', group: 'Б9123-09.03.04', subgroup: 1, attendance: 88 },
  { id: '24-08215', name: 'Ли Дмитрий', group: 'Б9123-09.03.04', subgroup: 1, attendance: 46 },
  { id: '24-08230', name: 'Волкова Мария', group: 'Б9123-09.03.04', subgroup: 2, attendance: 75 },
  { id: '24-08244', name: 'Ким Артём', group: 'Б9123-09.03.04', subgroup: 2, attendance: 38 },
  { id: '24-08251', name: 'Орлова Ева', group: 'Б9123-09.03.04', subgroup: null, attendance: 81 },
  { id: '24-08263', name: 'Пак Сергей', group: 'Б9123-09.03.04', subgroup: null, attendance: 64 },
  { id: '23-07118', name: 'Белова Ксения', group: 'Б9122-09.03.03', subgroup: 1, attendance: 97 },
  { id: '23-07124', name: 'Громов Илья', group: 'Б9122-09.03.03', subgroup: 1, attendance: 50 },
  { id: '23-07131', name: 'Тен Алина', group: 'Б9122-09.03.03', subgroup: 2, attendance: 70 },
]

const roster = (group, marks = {}) => students
  .filter((student) => student.group === group)
  .map((student) => ({ ...student, status: marks[student.id] ?? null }))

export const teacherPairs = ref([
  {
    id: 'pair-1',
    start: '08:30', end: '10:00',
    title: 'Базы данных',
    kind: 'Лекция',
    group: 'Б9123-09.03.04',
    room: 'D734', building: 'Корпус D',
    status: 'started_late',
    delayReason: null,
    editableUntil: '18:00',
    students: roster('Б9123-09.03.04', {
      '24-08192': 'done', '24-08201': 'done', '24-08215': 'late', '24-08230': 'done',
      '24-08251': 'sick', '24-08263': 'done',
    }),
  },
  {
    id: 'pair-2',
    start: '10:10', end: '11:40',
    title: 'Базы данных',
    kind: 'Практика, подгруппа 1',
    group: 'Б9123-09.03.04',
    room: 'D547', building: 'Корпус D',
    status: 'started',
    delayReason: null,
    editableUntil: '20:00',
    students: roster('Б9123-09.03.04', { '24-08192': 'done', '24-08201': 'done' })
      .filter((student) => student.subgroup === 1),
  },
  {
    id: 'pair-3',
    start: '13:00', end: '14:30',
    title: 'Проектирование информационных систем',
    kind: 'Лекция',
    group: 'Б9122-09.03.03',
    room: 'A914', building: 'Корпус A',
    status: 'not_started',
    delayReason: null,
    editableUntil: null,
    students: roster('Б9122-09.03.03'),
  },
  {
    id: 'pair-4',
    start: '14:40', end: '16:10',
    title: 'Проектирование информационных систем',
    kind: 'Практика',
    group: 'Б9122-09.03.03',
    room: 'A1012', building: 'Корпус A',
    status: 'not_started',
    delayReason: null,
    editableUntil: null,
    students: roster('Б9122-09.03.03'),
  },
])

// Оценки занятий студентами (анонимно): интересно / полезно / понятно, шкала −2…2.
export const lessonFeedback = { newCount: 6, interesting: 1.4, useful: 1.1, clear: 0.6 }

export const needsDelayReason = (pair) => ['started_late', 'disrupted'].includes(pair.status) && !pair.delayReason
export const markedCount = (pair) => pair.students.filter((student) => student.status).length

export const riskStudents = computed(() => students.filter((student) => student.attendance <= RISK_THRESHOLD))
export const unassignedStudents = computed(() => students.filter((student) => student.subgroup === null))

export function setDelayReason(pairId, reason) {
  const pair = teacherPairs.value.find((item) => item.id === pairId)
  if (pair) pair.delayReason = reason
}

export function setMark(pairId, studentId, status) {
  const pair = teacherPairs.value.find((item) => item.id === pairId)
  const student = pair?.students.find((item) => item.id === studentId)
  if (student) student.status = status
}

// --- Время пары и плашка «Пара скоро начнётся» ---
// Плашка появляется за 15 минут до начала пары; во время пары показывает, что пара идёт.
export const LESSON_REMINDER_MINUTES = 15

export const toMinutes = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

// Минуты от полуночи по времени кампуса (Владивосток), с долями минуты.
const campusTime = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Vladivostok',
})
export function campusMinutes(ms) {
  const [hours, minutes, seconds] = campusTime.format(ms).split(':').map(Number)
  return hours * 60 + minutes + seconds / 60
}

// Демо-часы: расписание выше — на «сегодня», а реальное время редко попадает в окно пары.
// По умолчанию часы стартуют с 12:48 (за 12 минут до третьей пары) и идут дальше.
// ?lessonAt=HH:MM — стартовое время, ?lessonAt=real — реальное время кампуса.
// В консоли: window.__setLessonClock('13:05') или window.__setLessonClock('real').
const DEFAULT_DEMO_CLOCK = '12:48'
const clockOffset = ref(0)
export function setLessonClock(value, nowMs = Date.now()) {
  clockOffset.value = value === 'real' ? 0 : toMinutes(value) - campusMinutes(nowMs)
}
if (typeof window !== 'undefined') {
  setLessonClock(new URLSearchParams(window.location.search).get('lessonAt') ?? DEFAULT_DEMO_CLOCK)
  window.__setLessonClock = (value) => setLessonClock(value)
}
export const lessonClock = (nowMs) => (((campusMinutes(nowMs) + clockOffset.value) % 1440) + 1440) % 1440

export const isPairFinished = (pair, minutes) => minutes >= toMinutes(pair.end)
export const isPairLive = (pair, minutes) => minutes >= toMinutes(pair.start) && minutes < toMinutes(pair.end)

// Что показать на плашке: идущую пару или пару, до которой ≤ 15 минут. null — плашки нет.
export function lessonBanner(pairs, minutes) {
  const live = pairs.find((pair) => isPairLive(pair, minutes))
  if (live) return { pair: live, phase: 'live', minutesLeft: Math.ceil(toMinutes(live.end) - minutes) }
  const soon = pairs.find((pair) => {
    const left = toMinutes(pair.start) - minutes
    return left > 0 && left <= LESSON_REMINDER_MINUTES
  })
  return soon ? { pair: soon, phase: 'soon', minutesLeft: Math.ceil(toMinutes(soon.start) - minutes) } : null
}
