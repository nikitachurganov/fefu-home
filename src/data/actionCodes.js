import { reactive, ref } from 'vue'
import { buildCode } from './scanCodes'
import { classroomPlaceholder } from './placeholders'
import { MONTHS, checkIn, parts } from './requestModel'
import { requests, updateRequest } from './requestStore'
import { pushNotification } from './notificationStore'

// Коды действий (docs/scanner.md, §3): чекин на мероприятии, отметка на паре и коды заявки, возврата и чекаута.
// Их генерирует система, поэтому здесь демонстрационный реестр. Время окон считается от запуска,
// чтобы в любой момент были и открытые, и закрытые окна.
const MINUTE = 60000
const DAY = 24 * 60 * MINUTE
const fromNow = (ms) => Date.now() + ms

// Окно чекина настраивается в админке мероприятия.
export const checkinEvents = {
  'EV-2001': { title: 'Лекция «Город будущего»', opensAt: fromNow(-30 * MINUTE), closesAt: fromNow(60 * MINUTE) },
  'EV-2002': { title: 'Мастер-класс по фотографии', opensAt: fromNow(DAY), closesAt: fromNow(DAY + 2 * 60 * MINUTE) },
  'EV-2003': { title: 'Школа лидеров: выездная сессия', opensAt: fromNow(-3 * DAY), closesAt: fromNow(-2 * DAY) },
  'EV-2004': { title: 'День открытых дверей', opensAt: fromNow(-30 * MINUTE), closesAt: fromNow(120 * MINUTE) },
}

// Расписание занятий: привязано к аудиториям (roomId).
// Преподаватель сканирует паспорт аудитории, система определяет текущее занятие по расписанию.
// scheduledStart/scheduledEnd — время по расписанию (пара ещё не начата преподавателем),
// opensAt/closesAt — окно чекина студентов (устанавливается при старте пары преподавателем).
export const schedule = {
  'RM-0703': [
    {
      id: 'LC-4107',
      title: 'Проектирование в дизайне (практика)',
      discipline: 'Проектирование в дизайне и визуальные коммуникации',
      place: 'F703',
      level: '7 уровень',
      floor: '7 этаж',
      teacher: 'Иванов Иван Иванович',
      teacherId: 'teacher-001',
      group: 'М1125-38.04.02сбер',
      studentCount: 16,
      capacity: 20,
      totalStudents: 24,
      photos: [classroomPlaceholder('#7aa7d9', '#2f5d9b')],
      scheduledStart: fromNow(-15 * MINUTE),
      scheduledEnd: fromNow(75 * MINUTE),
      scheduledDate: '18-06-2026, 10:10-11:40',
    },
  ],
  'RM-0305': [
    {
      id: 'LC-4107',
      title: 'Проектирование в дизайне (практика)',
      discipline: 'Проектирование в дизайне и визуальные коммуникации',
      place: 'Корпус А. Аудитория 305',
      level: '3 уровень',
      floor: '3 этаж',
      teacher: 'Иванов Иван Иванович',
      teacherId: 'teacher-001',
      group: 'ИВТ-21',
      studentCount: 16,
      capacity: 20,
      totalStudents: 24,
      photos: [classroomPlaceholder('#7aa7d9', '#2f5d9b'), classroomPlaceholder('#9bbf9c', '#3f7a52'), classroomPlaceholder('#d9b27a', '#9b6a2f')],
      scheduledStart: fromNow(-15 * MINUTE),
      scheduledEnd: fromNow(75 * MINUTE),
      scheduledDate: '18-06-2026, 10:10-11:40',
    },
  ],
  'RM-0210': [
    {
      id: 'LC-5201',
      title: 'Анализ данных (лекция)',
      place: 'Коворкинг, 2 этаж',
      floor: '2 этаж',
      teacher: 'Смирнова Анна Владимировна',
      teacherId: 'teacher-002',
      group: 'ПМИ-22',
      capacity: 30,
      photos: [classroomPlaceholder('#b3cde0', '#6497b1')],
      scheduledStart: fromNow(2 * MINUTE),
      scheduledEnd: fromNow(92 * MINUTE),
    },
  ],
}

// Код пары живёт, пока идёт занятие. Данные аудитории показываются в карточке после отметки.
// Генерируется из schedule при старте пары преподавателем; статически задан LC-4107 (активная) и LC-4101 (истёкшая).
export const lessons = {
  'LC-4107': {
    id: 'LC-4107',
    title: 'Проектирование в дизайне (практика)',
    discipline: 'Проектирование в дизайне и визуальные коммуникации',
    place: 'F703',
    level: '7 уровень',
    floor: '7 этаж',
    teacher: 'Иванов Иван Иванович',
    teacherId: 'teacher-001',
    group: 'М1125-38.04.02сбер',
    studentCount: 16,
    capacity: 20,
    totalStudents: 24,
    scheduledDate: '18-06-2026, 10:10-11:40',
    photos: [classroomPlaceholder('#7aa7d9', '#2f5d9b'), classroomPlaceholder('#9bbf9c', '#3f7a52'), classroomPlaceholder('#d9b27a', '#9b6a2f')],
    opensAt: fromNow(-15 * MINUTE),
    closesAt: fromNow(75 * MINUTE),
    scheduledStart: fromNow(-15 * MINUTE),
    scheduledEnd: fromNow(75 * MINUTE),
  },
  'LC-4101': {
    id: 'LC-4101',
    title: 'Физика',
    place: 'Корпус A. Кабинет A101',
    floor: '1 этаж',
    teacher: 'Петров Пётр Петрович',
    teacherId: 'teacher-003',
    group: 'МАТ-20',
    capacity: 40,
    photos: [],
    opensAt: fromNow(-DAY),
    closesAt: fromNow(-DAY + 90 * MINUTE),
    scheduledStart: fromNow(-DAY),
    scheduledEnd: fromNow(-DAY + 90 * MINUTE),
  },
}

// Активные сессии пар: { lessonId → { lesson, startedAt, opensAt, closesAt, attendees[] } }.
// Преподаватель начинает пару — создаётся сессия, студенты отмечаются в attendees.
export const activeLessons = reactive({})

// id пары → время отметки студента. Хранится только в памяти.
export const classMarks = ref({})

const stamp = (ms) => {
  const { day, month, time } = parts(new Date(ms).toISOString())
  return `${day} ${MONTHS[month - 1]}, ${time}`
}
const clock = (ms) => parts(new Date(ms).toISOString()).time

// Заявка допускает отметку, если она одобрена (или отметка уже стоит).
const APPROVED = ['confirmed', 'upcoming', 'checked-in']

// Чистая проверка чекина: ничего не меняет, только отвечает, можно ли отметиться.
export function evaluateCheckin(eventId, list, now = Date.now()) {
  const event = checkinEvents[eventId]
  if (!event) return { ok: false, error: 'inactive' }

  const own = list.filter((request) => request.eventId === eventId)
  const request = own.find((item) => APPROVED.includes(item.status))
  if (!request) {
    const pending = own.some((item) => item.status === 'review')
    return { ok: false, error: 'no-request', detail: pending ? 'Ваша заявка на участие ещё на модерации. Отметиться можно после одобрения.' : undefined }
  }
  if (request.status === 'checked-in') {
    return { ok: false, error: 'already-checked', detail: `Вы уже отметились на мероприятии: ${stamp(Date.parse(request.checkedInAt))}.` }
  }
  if (now < event.opensAt) return { ok: false, error: 'outside-window', detail: `Чекин откроется: ${stamp(event.opensAt)}.` }
  if (now > event.closesAt) return { ok: false, error: 'outside-window', detail: `Чекин закрылся: ${stamp(event.closesAt)}.` }
  return { ok: true, kind: 'checkin', event, request }
}

export function performCheckIn(eventId, now = new Date()) {
  const verdict = evaluateCheckin(eventId, requests.value, now.getTime())
  if (!verdict.ok) return verdict
  updateRequest(verdict.request.id, (request) => checkIn(request, now))
  pushNotification({
    severity: 'success',
    title: 'Вы отметились на мероприятии',
    body: `${verdict.event.title}, ${clock(now.getTime())}.`,
    target: { kind: 'request', id: verdict.request.id },
  })
  return { ...verdict, at: now.toISOString() }
}

// ─── Пары: студент сканирует код пары ─────────────────────────────────────────

export function evaluateClassMark(lessonId, marks, now = Date.now()) {
  // Сначала проверяем активную сессию (пара стартована преподавателем).
  const active = activeLessons[lessonId]
  if (active) {
    if (now < active.opensAt || now > active.closesAt) return { ok: false, error: 'inactive' }
    if (marks[lessonId]) return { ok: false, error: 'already-checked', detail: `Вы уже отметились на этой паре в ${clock(Date.parse(marks[lessonId]))}.` }
    return { ok: true, kind: 'class', lesson: active.lesson }
  }
  // Демо-режим: пара без активной сессии (LC-4107 или LC-4101).
  const lesson = lessons[lessonId]
  const opens = lesson?.opensAt ?? lesson?.scheduledStart
  const closes = lesson?.closesAt ?? lesson?.scheduledEnd
  if (!lesson || now < opens || now > closes) return { ok: false, error: 'inactive' }
  if (marks[lessonId]) return { ok: false, error: 'already-checked', detail: `Вы уже отметились на этой паре в ${clock(Date.parse(marks[lessonId]))}.` }
  return { ok: true, kind: 'class', lesson }
}

export function performClassMark(lessonId, now = new Date()) {
  const verdict = evaluateClassMark(lessonId, classMarks.value, now.getTime())
  if (!verdict.ok) return verdict
  classMarks.value[lessonId] = now.toISOString()

  // Добавить студента в ведомость активной пары.
  if (activeLessons[lessonId]) {
    activeLessons[lessonId].attendees.push({ studentId: 'self', name: 'Никита Чурганов', checkedAt: now.toISOString(), method: 'class-qr' })
  }

  return { ...verdict, at: now.toISOString() }
}

// ─── Пары: преподаватель ───────────────────────────────────────────────────────

// Найти занятие в расписании аудитории на текущее время.
export function findScheduledLesson(roomId, now = Date.now()) {
  const slots = schedule[roomId]
  if (!slots) return null
  return slots.find((s) => now >= s.scheduledStart && now <= s.scheduledEnd) ?? null
}

// Начать пару: создаёт активную сессию, возвращает { ok, lessonId, lesson }.
export function startClass(lessonData, now = new Date()) {
  const lesson = { ...lessonData }
  const opensAt = now.getTime()
  const closesAt = lesson.scheduledEnd
  activeLessons[lesson.id] = { lesson, startedAt: now.toISOString(), opensAt, closesAt, attendees: [] }
  // Вносим занятие в реестр, чтобы студент мог сканировать код.
  lessons[lesson.id] = lesson
  return { ok: true, kind: 'class-started', lesson, lessonId: lesson.id }
}

// Завершить пару преподавателем.
export function endClass(lessonId, now = new Date()) {
  const session = activeLessons[lessonId]
  if (!session) return { ok: false, error: 'inactive' }
  const result = { ...session, finishedAt: now.toISOString() }
  delete activeLessons[lessonId]
  return { ok: true, kind: 'class-ended', ...result }
}

// ─── Преподаватель сканирует студенческий код ──────────────────────────────────

// Демонстрационные данные студентов в группах (ключ — studentId).
export const students = {
  '24-08192': { name: 'Никита Чурганов', group: 'ИВТ-21', email: 'nikita@students.dvfu.ru' },
  '24-08201': { name: 'Анна Соколова', group: 'ИВТ-21', email: 'anna@students.dvfu.ru' },
  '24-08215': { name: 'Дмитрий Ли', group: 'ИВТ-21', email: 'dmitry@students.dvfu.ru' },
  '24-08230': { name: 'Мария Волкова', group: 'ИВТ-21', email: 'maria@students.dvfu.ru' },
}

// Преподаватель сканирует студенческий QR в рамках активной пары.
// studentCode format: studentId[:subjectId] — subjectId в текущей реализации игнорируется.
export function markStudentPresent(studentCodeId, activeLessonId, now = new Date()) {
  const session = activeLessons[activeLessonId]
  if (!session) return { ok: false, error: 'no-active-class' }

  const [studentId] = studentCodeId.split(':')
  const student = students[studentId]
  if (!student) return { ok: false, error: 'unrecognized' }

  // Проверяем дубликат.
  const already = session.attendees.find((a) => a.studentId === studentId)
  if (already) {
    return { ok: false, error: 'already-checked', detail: `${student.name} уже отмечен в ${clock(Date.parse(already.checkedAt))}.` }
  }

  session.attendees.push({ studentId, name: student.name, checkedAt: now.toISOString(), method: 'teacher-scan' })
  return { ok: true, kind: 'student-marked', student, lesson: session.lesson, at: now.toISOString() }
}

// ─── Общее ────────────────────────────────────────────────────────────────────

// Код заявки, возврата и чекаута работает только на своём этапе заявки.
const requestStage = {
  request: (request) => request.source !== 'events' && ['upcoming', 'confirmed'].includes(request.status),
  return: (request) => ['equipment', 'tmc'].includes(request.source) && request.status === 'active',
  checkout: (request) => request.source === 'workplace' && request.status === 'active',
}

// Активен ли код действия прямо сейчас; для resolveScan это проверка «код не активен».
export function isActionCodeActive({ kind, id }, list = requests.value, now = Date.now()) {
  if (kind === 'checkin') return id in checkinEvents
  if (kind === 'class') {
    // Активна либо запущенная сессия, либо время по расписанию (демо).
    if (activeLessons[id]) {
      const { opensAt, closesAt } = activeLessons[id]
      return now >= opensAt && now <= closesAt
    }
    const lesson = lessons[id]
    const opens = lesson?.opensAt ?? lesson?.scheduledStart
    const closes = lesson?.closesAt ?? lesson?.scheduledEnd
    return !!lesson && now >= opens && now <= closes
  }
  if (kind === 'student') {
    const [studentId] = id.split(':')
    return studentId in students
  }
  const request = list.find((item) => item.id === id)
  return !!request && requestStage[kind]?.(request) === true
}

const codeTexts = {
  request: { label: 'Показать код заявки', title: 'Код заявки', hint: 'Покажите код сотруднику: он откроет заявку и выдаст предмет или подтвердит начало.' },
  return: { label: 'Показать код возврата', title: 'Код возврата', hint: 'Покажите код сотруднику при возврате: он примет предмет и закроет заявку.' },
  checkout: { label: 'Показать код чекаута', title: 'Код чекаута', hint: 'Покажите код сотруднику после работы: он проверит место и завершит заявку.' },
}

// Какие коды пользователь может показать для заявки на текущем этапе.
export function codeActionsFor(request, list = requests.value) {
  return Object.keys(codeTexts)
    .filter((kind) => isActionCodeActive({ kind, id: request.id }, list))
    .map((kind) => ({ kind, ...codeTexts[kind], text: buildCode(kind, request.id) }))
}
