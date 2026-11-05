import { parts } from './requestModel'

// Имя пользователя для приветствия, пока нет реальной авторизации.
export const userName = 'Никита'
export const userFullName = 'Никита Чурганов'
// Демонстрационный адрес: сотрудник видит его в заявке рядом с именем заявителя.
export const userEmail = 'nikita@students.dvfu.ru'
// Телефон и статус заявителя сотрудник видит при приёмке: по ним можно связаться и понять, кто пришёл.
export const userPhone = '+7 908 123-45-67'
export const userRole = 'Студент · ИМКТ'
export const studentId = '24-08192'
export const studentCode = 'FEFU-ONE:STUDENT:24-08192'

// Демонстрационные данные для виджета «Кампус».
export const weather = { temperature: 19, feelsLike: 19, wind: 5 }

// Отправления шаттла от остановки, время кампуса «ЧЧ:ММ».
export const shuttle = {
  route: 'Кампус → Центр',
  stop: 'Остановка у корпуса A',
  departures: ['07:30', '08:15', '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '17:45', '19:00', '20:30', '22:00'],
}

const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

// Ближайшие отправления сегодня с минутами до отправления.
export function nextDepartures(departures, nowMs = Date.now(), count = 3) {
  const now = toMinutes(parts(nowMs).time)
  return departures
    .filter((time) => toMinutes(time) > now)
    .slice(0, count)
    .map((time) => ({ time, inMinutes: toMinutes(time) - now }))
}
