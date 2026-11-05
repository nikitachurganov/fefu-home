import { buildCode } from './scanCodes'

// Демо-коды для проверки сканера там, где нет камеры (превью, десктоп). В приложении показываются только в dev-режиме,
// а из тех же данных скрипт `npm run codes` собирает страницы с QR для телефона.
// Коды разделены по ролям: сканировать их нужно в той роли, для которой они написаны (роль меняется в «Профиле»).
// Коды заявок связаны с демо-заявками из requests.js; их результат зависит от текущего этапа заявки.
// Группа с errors: true — ожидаемые отказы: сканер должен показать ошибку, а не принять код.
export const demoCodes = {
  teacher: [
    {
      title: 'Аудитории (начать пару)',
      note: 'Преподаватель сканирует паспорт аудитории: видит расписание и кнопку «Начать пару».',
      codes: [
        { label: 'Кабинет F703 (пара по расписанию)', text: buildCode('passport', 'RM-0703') },
        { label: 'Аудитория 305 (пара по расписанию)', text: buildCode('passport', 'RM-0305') },
        { label: 'Кабинет F705 (без пары)', text: buildCode('passport', 'RM-0705') },
        { label: 'Коворкинг, 2 этаж (пара скоро начнётся)', text: buildCode('passport', 'RM-0210') },
      ],
    },
    {
      title: 'Студенческие коды (для сессии пары)',
      note: 'Студент показывает свой QR — преподаватель сканирует в активной сессии пары.',
      codes: [
        { label: 'Студент: Никита Чурганов', text: buildCode('student', '24-08192') },
        { label: 'Студент: Анна Соколова', text: buildCode('student', '24-08201') },
        { label: 'Студент: Дмитрий Ли', text: buildCode('student', '24-08215') },
        { label: 'Студент: Мария Волкова', text: buildCode('student', '24-08230') },
      ],
    },
    {
      title: 'Ошибки',
      note: 'Сканер должен показать отказ.',
      errors: true,
      codes: [
        { label: 'Неизвестный студент', text: buildCode('student', '99-99999') },
        { label: 'Чужой QR', text: 'https://example.com' },
      ],
    },
  ],
  user: [
    {
      title: 'Паспорта',
      note: 'Наклейки на объектах: открывают паспорт или реле двери.',
      codes: [
        { label: 'Кабинет F703 (реле двери)', text: buildCode('passport', 'RM-0703') },
        { label: 'Кабинет F705 (помещение)', text: buildCode('passport', 'RM-0705') },
        { label: 'Проектор в ауд. 305', text: buildCode('passport', 'EQ-0142') },
        { label: 'Коворкинг, 2 этаж', text: buildCode('passport', 'RM-0210') },
        { label: 'Корпус А (актив)', text: buildCode('passport', 'AS-0001') },
        { label: 'Рабочее место 1', text: buildCode('passport', 'WP-0101') },
        { label: 'Лекция «Город будущего»', text: buildCode('passport', 'EV-2001') },
      ],
    },
    {
      title: 'Чекин и пары',
      note: 'Окна чекина и пар отсчитываются от запуска приложения: сначала откройте приложение, затем сканируйте.',
      codes: [
        { label: 'Чекин: лекция «Город будущего» (окно открыто)', text: buildCode('checkin', 'EV-2001') },
        { label: 'Чекин: мастер-класс (заявка на модерации)', text: buildCode('checkin', 'EV-2002') },
        { label: 'Чекин: школа лидеров (окно закрыто)', text: buildCode('checkin', 'EV-2003') },
        { label: 'Чекин: день открытых дверей (нет заявки)', text: buildCode('checkin', 'EV-2004') },
        { label: 'Пара: проектирование в дизайне', text: buildCode('class', 'LC-4107') },
        { label: 'Пара: физика (код истёк)', text: buildCode('class', 'LC-4101') },
      ],
    },
    {
      title: 'Ошибки',
      note: 'Пользователь не должен их принять: сканер покажет отказ.',
      errors: true,
      codes: [
        { label: 'Код заявки №3001 (код сотрудника)', text: buildCode('request', '3001') },
        { label: 'Код возврата №3002 (код сотрудника)', text: buildCode('return', '3002') },
        { label: 'Серверная (только сотрудники)', text: buildCode('passport', 'RM-0901') },
        { label: 'Списанный проектор', text: buildCode('passport', 'EQ-0999') },
        { label: 'Неизвестный паспорт', text: buildCode('passport', 'EQ-7777') },
        { label: 'Чужой QR', text: 'https://example.com' },
      ],
    },
  ],
  staff: [
    {
      title: 'Выдача и начало работы',
      note: 'Пользователь показывает эти коды у сотрудника. Работают, пока заявка не выдана; после выдачи код становится неактивным.',
      codes: [
        { label: 'Код заявки №3001: проектор', text: buildCode('request', '3001') },
        { label: 'Код заявки №1003: пылесос (любая модель)', text: buildCode('request', '1003') },
        { label: 'Код заявки №1008: набор для уборки', text: buildCode('request', '1008') },
        { label: 'Код заявки №4001: рабочее место', text: buildCode('request', '4001') },
      ],
    },
    {
      title: 'Приёмка и чекаут',
      note: 'Работают, пока заявка активна (предмет на руках или сессия идёт).',
      codes: [
        { label: 'Код возврата №3002: 3D-принтер', text: buildCode('return', '3002') },
        { label: 'Код возврата №1007: пылесос', text: buildCode('return', '1007') },
        { label: 'Код чекаута №4003: рабочее место', text: buildCode('checkout', '4003') },
      ],
    },
    {
      title: 'Паспорта для сотрудника',
      note: 'Закрытые от пользователей объекты и области для инвентаризации.',
      codes: [
        { label: 'Серверная (только сотрудники)', text: buildCode('passport', 'RM-0901') },
        { label: 'Коворкинг, 2 этаж (инвентаризация)', text: buildCode('passport', 'RM-0210') },
        { label: 'Корпус А (инвентаризация)', text: buildCode('passport', 'AS-0001') },
      ],
    },
    {
      title: 'Ошибки',
      note: 'Сканер должен показать отказ даже сотруднику.',
      errors: true,
      codes: [
        { label: 'Код возврата №3001 (проектор ещё не выдан)', text: buildCode('return', '3001') },
        { label: 'Код заявки №3002 (принтер уже выдан)', text: buildCode('request', '3002') },
        { label: 'Списанный проектор', text: buildCode('passport', 'EQ-0999') },
        { label: 'Неизвестный паспорт', text: buildCode('passport', 'EQ-7777') },
        { label: 'Чужой QR', text: 'https://example.com' },
      ],
    },
  ],
}

export const demoCodeGroupsFor = (role) => demoCodes[role] ?? demoCodes.user

// Демо-коды студентов для показа преподавателю (сканирует преподаватель).
export const studentDemoCodes = [
  { label: 'Никита Чурганов', text: buildCode('student', '24-08192') },
  { label: 'Анна Соколова', text: buildCode('student', '24-08201') },
  { label: 'Дмитрий Ли', text: buildCode('student', '24-08215') },
  { label: 'Мария Волкова', text: buildCode('student', '24-08230') },
]
