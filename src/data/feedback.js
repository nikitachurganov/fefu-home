// Категории обращения; hint показывается во второй шторке выбора.
export const feedbackCategories = [
  { value: 'bug', label: 'Ошибка в приложении', hint: 'Что-то не работает или выглядит неправильно' },
  { value: 'idea', label: 'Предложение', hint: 'Идея, как улучшить сервис' },
  { value: 'question', label: 'Вопрос по сервису', hint: 'Заявки, бронирование, аренда' },
  { value: 'other', label: 'Другое' },
]

export const FEEDBACK_MIN = 10
export const FEEDBACK_MAX = 500

// Заглушка отправки: бэкенда пока нет, поэтому просто ждём и подтверждаем успех.
export function submitFeedback(payload) {
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 600))
}
