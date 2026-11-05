// Видимость объекта бронирования для пользователей.
//
// Категории, роли и конкретные пользователи объединяются по «ИЛИ».
// Подразделения — отдельный фильтр, он накладывается по «И» поверх этой группы.

export const userCategories = [
  { value: 'students', label: 'Студенты' },
  { value: 'employees', label: 'Сотрудники' },
  { value: 'postgraduates', label: 'Аспиранты' },
  { value: 'applicants', label: 'Абитуриенты' },
  { value: 'guests', label: 'Гости' },
]

export const userRoles = [
  { value: 'building-admin', label: 'Администратор корпуса' },
  { value: 'volunteer', label: 'Волонтёр' },
  { value: 'event-organizer', label: 'Организатор мероприятий' },
  { value: 'security', label: 'Служба безопасности' },
]

// Плоский список с parentId: из него строится и дерево для селекта, и проверка вложенности.
export const departments = [
  { id: 'youth', title: 'Департамент молодёжной политики', parentId: null },
  { id: 'youth-clubs', title: 'Отдел студенческих клубов', parentId: 'youth' },
  { id: 'campus', title: 'Кампусная дирекция', parentId: null },
  { id: 'campus-a', title: 'Корпус А', parentId: 'campus' },
  { id: 'campus-s', title: 'Корпус S', parentId: 'campus' },
  { id: 'school-it', title: 'Школа цифровой экономики', parentId: null },
]

// Демо-пользователи для поиска в селекте и для предпросмотра «кому будет виден».
export const users = [
  { id: 'u1', name: 'Иванова Анна', categoryId: 'students', roleIds: [], departmentId: 'school-it' },
  { id: 'u2', name: 'Петров Сергей', categoryId: 'students', roleIds: ['volunteer'], departmentId: 'youth' },
  { id: 'u3', name: 'Сидорова Мария', categoryId: 'employees', roleIds: ['volunteer'], departmentId: 'youth' },
  { id: 'u4', name: 'Козлов Дмитрий', categoryId: 'employees', roleIds: ['building-admin'], departmentId: 'campus-a' },
  { id: 'u5', name: 'Смирнова Ольга', categoryId: 'employees', roleIds: [], departmentId: 'youth-clubs' },
  { id: 'u6', name: 'Орлов Артём', categoryId: 'postgraduates', roleIds: [], departmentId: 'school-it' },
  { id: 'u7', name: 'Новикова Елена', categoryId: 'employees', roleIds: ['event-organizer', 'volunteer'], departmentId: 'campus-s' },
  { id: 'u8', name: 'Фёдоров Игорь', categoryId: 'guests', roleIds: [], departmentId: null },
]

export const emptyVisibility = () => ({
  categoryIds: [],
  roleIds: [],
  userIds: [],
  departmentIds: [],
  includeChildDepartments: true,
})

const departmentById = new Map(departments.map((d) => [d.id, d]))

// Подразделение пользователя и все его родители вплоть до корня.
function departmentChain(departmentId) {
  const chain = []
  let current = departmentById.get(departmentId)
  while (current) {
    chain.push(current.id)
    current = current.parentId ? departmentById.get(current.parentId) : null
  }
  return chain
}

export function userInDepartments(user, departmentIds, includeChildren) {
  if (!user.departmentId) return false
  if (!includeChildren) return departmentIds.includes(user.departmentId)
  return departmentChain(user.departmentId).some((id) => departmentIds.includes(id))
}

// Пустая аудитория (нет категорий, ролей и пользователей) не ограничивает видимость.
export function isVisible(visibility, user) {
  const hasAudience =
    visibility.categoryIds.length > 0 || visibility.roleIds.length > 0 || visibility.userIds.length > 0

  const audienceOk =
    !hasAudience ||
    visibility.categoryIds.includes(user.categoryId) ||
    user.roleIds.some((roleId) => visibility.roleIds.includes(roleId)) ||
    visibility.userIds.includes(user.id)

  const departmentOk =
    visibility.departmentIds.length === 0 ||
    userInDepartments(user, visibility.departmentIds, visibility.includeChildDepartments)

  return audienceOk && departmentOk
}

const labelOf = (items, value) => items.find((item) => item.value === value)?.label ?? value

// Человекочитаемая сводка правила для блока над кнопками.
export function describeVisibility(visibility) {
  const audience = [
    ...visibility.categoryIds.map((id) => labelOf(userCategories, id)),
    ...visibility.roleIds.map((id) => labelOf(userRoles, id)),
    ...visibility.userIds.map((id) => users.find((u) => u.id === id)?.name ?? id),
  ]
  const places = visibility.departmentIds.map((id) => departmentById.get(id)?.title ?? id)

  const who = audience.length ? audience.join(', ') : 'Всем пользователям'
  if (!places.length) return who
  const nested = visibility.includeChildDepartments ? ' (включая вложенные)' : ''
  return `${who} — только из: ${places.join(', ')}${nested}`
}
