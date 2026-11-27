import { computed, ref } from 'vue'

// Роли в прототипе переключаются вручную (селект в шапке, «Профиль», демо-коды сканера).
// Настоящая роль придёт с сервера. Набор ролей — из ROLES_SPEC.md:
// контекстные роли (§3) и каталог ролей прода (§4.2).
//
// profile — поведенческий профиль прототипа, от него зависят сканер и главная:
// 'user'    — обычный пользователь;
// 'teacher' — кабинет преподавателя: пары, отметки по QR студента (§3.5);
// 'staff'   — кладовщик: коды заявки / возврата / чекаута, инвентаризация, скрытые объекты (§3.8, §4.10);
// 'system_admin' — админ-разделы в боковом меню (§4.1).
export const roleGroups = [
  {
    label: 'Контекстные роли',
    roles: [
      { value: 'user', label: 'Пользователь', profile: 'user' },
      { value: 'student', label: 'Студент', profile: 'user' },
      { value: 'headman', label: 'Староста', profile: 'user' },
      { value: 'teacher', label: 'Преподаватель', profile: 'teacher' },
      { value: 'curator', label: 'Куратор', profile: 'user' },
      { value: 'bookable_moderator', label: 'Модератор объекта бронирования', profile: 'staff' },
      { value: 'staff', label: 'Сотрудник склада ТМЦ', profile: 'staff' },
      { value: 'event_organizer', label: 'Организатор мероприятия', profile: 'user' },
    ],
  },
  {
    label: 'Роли системы',
    roles: [
      { value: 'system_admin', label: 'Администратор системы', profile: 'system_admin' },
      { value: 'booking_team', label: 'Команда бронирования', profile: 'user' },
      { value: 'employee', label: 'Сотрудник', profile: 'user' },
      { value: 'subdivision_head', label: 'Управляющий', profile: 'user' },
      { value: 'moderator', label: 'Модератор', profile: 'staff' },
      { value: 'events_organizer', label: 'Организатор мероприятий', profile: 'staff' },
      { value: 'observer', label: 'Наблюдатель', profile: 'user' },
      { value: 'mol', label: 'МОЛ', profile: 'user' },
      { value: 'viewer', label: 'Смотрящий', profile: 'user' },
      { value: 'equipment_responsible', label: 'Ответственный за оборудование', profile: 'staff' },
      { value: 'archived_employee', label: 'Архивный сотрудник', profile: 'user' },
      { value: 'fixed_assets_head', label: 'Основные средства — управляющий', profile: 'user' },
      { value: 'building_admin', label: 'Администратор корпуса', profile: 'user' },
      { value: 'tmc_head', label: 'Управляющий ТМЦ', profile: 'staff' },
      { value: 'education_head', label: 'Управляющий образовательным процессом', profile: 'user' },
    ],
  },
]

export const roleList = roleGroups.flatMap((group) => group.roles)

// Сгруппированные опции для a-select.
export const roleOptions = roleGroups.map((group) => ({
  label: group.label,
  options: group.roles.map(({ value, label }) => ({ value, label })),
}))

export const role = ref('user')
export const roleLabel = computed(() => roleList.find((item) => item.value === role.value)?.label ?? '')
// Профиль поведения для сканера, демо-кодов и главной.
export const roleProfile = computed(() => roleList.find((item) => item.value === role.value)?.profile ?? 'user')
export const isStaff = computed(() => roleProfile.value === 'staff')
export const isTeacher = computed(() => roleProfile.value === 'teacher')
export const isSystemAdmin = computed(() => roleProfile.value === 'system_admin')
