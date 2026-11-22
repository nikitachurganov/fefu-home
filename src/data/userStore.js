import { computed, ref } from 'vue'

// Роли в прототипе переключаются вручную на странице «Профиль». Настоящая роль придёт с сервера.
export const roleOptions = [
  { value: 'user', label: 'Пользователь' },
  { value: 'teacher', label: 'Преподаватель' },
  { value: 'staff', label: 'Сотрудник' },
  { value: 'system_admin', label: 'Администратор системы' },
]

export const role = ref('user')
export const isStaff = computed(() => role.value === 'staff')
export const isTeacher = computed(() => role.value === 'teacher')
