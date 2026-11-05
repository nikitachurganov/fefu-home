import { ref } from 'vue'
import { mockRequests } from './requests'
import { cancelRequest } from './requestModel'

// Общее состояние заявок для раздела «Заявки» и виджетов главной на ПК.
export const requests = ref(mockRequests.map((request) => ({ ...request })))

// Заменяет заявку результатом перехода: update — функция вида (request) => новая заявка
// (checkIn, startAfterPhoto, …) или объект с изменяемыми полями.
export function updateRequest(id, update) {
  const index = requests.value.findIndex((request) => request.id === id)
  if (index === -1) return null
  const current = requests.value[index]
  requests.value[index] = typeof update === 'function' ? update(current) : { ...current, ...update }
  return requests.value[index]
}

export function cancelById(id) {
  const index = requests.value.findIndex((request) => request.id === id)
  if (index === -1) return null
  requests.value[index] = cancelRequest(requests.value[index])
  return requests.value[index]
}
