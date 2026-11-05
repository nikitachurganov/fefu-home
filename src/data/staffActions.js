import { setAssetStatus } from './assets'
import { pushNotification } from './notificationStore'
import { completeRequest, confirmIssue } from './requestModel'
import { requests, updateRequest } from './requestStore'
import { acceptNote, problemItems, resolvedItems } from './sessionModel'

// Итоговые действия сотрудника по результатам сканера. Меняют заявку, статусы единиц в паспортах
// и отправляют пользователю уведомление; на сервере это будут запросы к бэкенду.
const findRequest = (id) => requests.value.find((request) => request.id === id)
const target = (request) => ({ kind: 'request', id: request.id })

// Выдача оборудования или ТМЦ: заявка ждёт фото пользователя, единицы становятся занятыми.
export function finishIssue(session) {
  const request = findRequest(session.requestId)
  if (!request) return
  const items = resolvedItems(session)
  updateRequest(request.id, (item) => confirmIssue(item, items))
  for (const item of items) setAssetStatus(item.unitId, 'in-use')
  pushNotification({
    title: 'Предмет выдан',
    body: `${request.title}: сфотографируйте его в заявке, чтобы начать пользование.`,
    target: target(request),
  })
}

// Рабочее место: сотрудник подтвердил начало по коду заявки, дальше пользователь делает фото.
export function confirmWorkplaceStart(requestId) {
  const request = findRequest(requestId)
  if (!request) return
  updateRequest(request.id, (item) => confirmIssue(item))
  for (const item of request.items ?? []) setAssetStatus(item.unitId, 'in-use')
  pushNotification({
    title: 'Начало подтверждено',
    body: `${request.title}: сфотографируйте место в заявке, чтобы начать работу.`,
    target: target(request),
  })
}

// Приёмка: заявка закрывается, единицы освобождаются, а с замечанием — уходят на обслуживание.
export function finishAccept(session) {
  const request = findRequest(session.requestId)
  if (!request) return
  const note = acceptNote(session)
  const broken = new Set(problemItems(session).map((item) => item.unitId))
  updateRequest(request.id, (item) => completeRequest(item, note))
  for (const item of session.items) setAssetStatus(item.unitId, broken.has(item.unitId) ? 'maintenance' : 'available')
  pushNotification({
    severity: note ? 'warning' : 'success',
    title: 'Возврат принят',
    body: note ? `${request.title}: есть замечания — ${note}.` : `${request.title}: заявка закрыта, спасибо.`,
    target: target(request),
  })
}

// Чекаут рабочего места: проверка целостности и завершение заявки.
export function finishWorkplace(requestId, { condition = 'ok', note = '' } = {}) {
  const request = findRequest(requestId)
  if (!request) return
  const problem = condition === 'problem'
  updateRequest(request.id, (item) => completeRequest(item, problem ? note || 'Есть замечания к месту' : ''))
  for (const item of request.items ?? []) setAssetStatus(item.unitId, problem ? 'maintenance' : 'available')
  pushNotification({
    severity: problem ? 'warning' : 'success',
    title: 'Сессия завершена',
    body: problem ? `${request.title}: сотрудник отметил замечания.` : `${request.title}: место принято, заявка закрыта.`,
    target: target(request),
  })
}
