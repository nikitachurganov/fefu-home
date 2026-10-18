import iron from '../assets/requests/iron.webp'
import printer3d from '../assets/requests/3d-printer.webp'
import vacuum from '../assets/requests/vacuum.webp'
import projector from '../assets/requests/projector.webp'
import tools from '../assets/requests/tools.webp'

// Демонстрационные заявки. Источник, группа и состояние приходят из данных.
// Даты фиксированы; автоматического переноса заявок в архив нет.
export const mockRequests = [
  { id: '2001', source: 'events', statusGroup: 'confirmed', status: 'confirmed', title: 'Лекция «Город будущего»', startsAt: '2026-10-22T18:00:00+10:00', endsAt: '2026-10-22T19:30:00+10:00', place: 'Корпус А · Ауд. 305' },
  { id: '2002', source: 'events', statusGroup: 'confirmed', status: 'confirmed', title: 'День студенческих сообществ', startsAt: '2026-10-20T14:00:00+10:00', endsAt: '2026-10-20T17:00:00+10:00', place: 'Студенческий центр · Большой зал' },
  { id: '2006', source: 'events', statusGroup: 'confirmed', status: 'confirmed', title: 'Школа лидеров: выездная сессия', startsAt: '2026-10-25T10:00:00+10:00', endsAt: '2026-10-26T18:00:00+10:00', place: 'Учебно-тренировочная база «Эгершельд» · Корпус Б' },
  { id: '2003', source: 'events', statusGroup: 'moderation', status: 'review', title: 'Мастер-класс по фотографии', startsAt: '2026-10-24T12:00:00+10:00', endsAt: '2026-10-24T14:00:00+10:00', place: 'Корпус D · Ауд. 210' },
  { id: '2004', source: 'events', statusGroup: 'archive', status: 'completed', title: 'Открытая встреча с выпускниками', startsAt: '2026-10-10T16:00:00+10:00', endsAt: '2026-10-10T18:00:00+10:00', archivedAt: '2026-10-10T18:00:00+10:00', place: 'Студенческий центр · Зал встреч' },
  { id: '2005', source: 'events', statusGroup: 'archive', status: 'cancelled', title: 'Экскурсия по кампусу', startsAt: '2026-10-18T11:00:00+10:00', endsAt: '2026-10-18T12:30:00+10:00', archivedAt: '2026-10-17T15:00:00+10:00', place: 'Главный вход в корпус А' },
  { id: '3001', source: 'equipment', statusGroup: 'confirmed', status: 'upcoming', title: 'Проектор', image: projector, startsAt: '2026-10-21T14:00:00+10:00', endsAt: '2026-10-21T18:00:00+10:00', place: 'Корпус А · Ауд. 305' },
  { id: '3002', source: 'equipment', statusGroup: 'confirmed', status: 'active', title: '3D-принтер', image: printer3d, startsAt: '2026-10-18T10:00:00+10:00', endsAt: '2026-10-18T18:00:00+10:00', place: 'Студенческий центр · Комната 12' },
  { id: '3003', source: 'equipment', statusGroup: 'moderation', status: 'review', title: 'Проектор', image: projector, startsAt: '2026-10-23T10:00:00+10:00', endsAt: '2026-10-23T12:00:00+10:00', place: 'Корпус D · Ауд. 210' },
  { id: '3004', source: 'equipment', statusGroup: 'moderation', status: 'review', title: '3D-принтер', image: printer3d, startsAt: '2026-10-22T09:00:00+10:00', endsAt: '2026-10-22T13:00:00+10:00', place: 'Студенческий центр · Комната 12' },
  { id: '3005', source: 'equipment', statusGroup: 'archive', status: 'rejected', reason: 'Проектор уже забронирован другим пользователем на это время.', title: 'Проектор', image: projector, startsAt: '2026-10-17T14:00:00+10:00', endsAt: '2026-10-17T18:00:00+10:00', archivedAt: '2026-10-16T12:00:00+10:00', place: 'Корпус А · Ауд. 305' },
  { id: '3006', source: 'equipment', statusGroup: 'archive', status: 'completed', title: '3D-принтер', image: printer3d, startsAt: '2026-10-12T10:00:00+10:00', endsAt: '2026-10-12T14:00:00+10:00', archivedAt: '2026-10-12T14:00:00+10:00', place: 'Студенческий центр · Комната 12' },
  { id: '1001', source: 'tmc', statusGroup: 'confirmed', status: 'active', title: 'Утюг', image: iron, startsAt: '2026-10-18T12:00:00+10:00', endsAt: '2026-10-18T14:00:00+10:00', place: 'Общежитие №7 · Комната 101' },
  { id: '1003', source: 'tmc', statusGroup: 'confirmed', status: 'upcoming', title: 'Пылесос', image: vacuum, startsAt: '2026-10-19T14:00:00+10:00', endsAt: '2026-10-19T18:00:00+10:00', place: 'Общежитие №5 · Комната 12' },
  { id: '1005', source: 'tmc', statusGroup: 'archive', status: 'completed', title: 'Набор инструментов', image: tools, startsAt: '2026-10-15T14:00:00+10:00', endsAt: '2026-10-15T18:00:00+10:00', archivedAt: '2026-10-15T18:00:00+10:00', place: 'Общежитие №7 · Комната 101' },
  { id: '1006', source: 'tmc', statusGroup: 'archive', status: 'cancelled', title: 'Утюг', image: iron, startsAt: '2026-10-17T12:00:00+10:00', endsAt: '2026-10-17T14:00:00+10:00', archivedAt: '2026-10-16T09:00:00+10:00', place: 'Общежитие №7 · Комната 101' },
]
