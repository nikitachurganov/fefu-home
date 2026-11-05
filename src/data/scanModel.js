import { findAsset, isActiveAsset } from './assets'
import { isActionKind, isStaffKind, isTeacherKind, parseCode } from './scanCodes'
import { canInventory } from './sessionModel'

// Тексты экранов-ошибок (docs/scanner.md, §7). status — тип a-result.
export const scanErrors = {
  unrecognized: { status: 'warning', title: 'Код не распознан', text: 'Это не код FEFU One или его не удалось прочитать. Попробуйте ещё раз или введите код вручную.' },
  inactive: { status: 'warning', title: 'Код не активен', text: 'Срок действия кода истёк, заявка закрыта или объект больше не используется.' },
  forbidden: { status: 'error', title: 'Нет доступа', text: 'У вас нет прав на этот объект или действие. Обратитесь к администратору.' },
  'wrong-mode': { status: 'warning', title: 'Код не для этого режима', text: 'Сейчас подходят только коды объектов. Вернитесь к списку.' },
  'no-request': { status: 'warning', title: 'Нет одобренной заявки', text: 'Чтобы отметиться, нужна одобренная заявка на участие. Подайте её в разделе «Мероприятия».' },
  'outside-window': { status: 'warning', title: 'Вне окна чекина', text: 'Чекин сейчас недоступен.' },
  'already-checked': { status: 'info', title: 'Вы уже отметились', text: 'Повторная отметка не нужна.' },
  'manual-action-code': { status: 'info', title: 'Код нельзя ввести вручную', text: 'Коды заявок, возврата, чекина и пар работают только при сканировании камерой.' },
  'no-active-class': { status: 'warning', title: 'Нет активной пары', text: 'Начните пару, чтобы сканировать студентов.' },
}

// Кто какие коды действий сканирует: коды заявки, возврата и чекаута — только сотрудник;
// коды студентов — только преподаватель.
export const canScanKind = (role, kind) => {
  if (isStaffKind(kind)) return role === 'staff'
  if (isTeacherKind(kind)) return role === 'teacher' || role === 'staff'
  return true
}

// Пользователь отсканировал код сотрудника: объясняем, что этот код он должен показать, а не сканировать.
const staffCodeDetail = 'Это код для сотрудника: его показывают на выдаче или возврате, а сканирует сотрудник. Сами сканировать его не нужно.'
// Пользователь или сотрудник отсканировал студенческий QR: только преподаватель сканирует его в сессии пары.
const teacherOnlyDetail = 'Этот код студент показывает преподавателю для отметки на паре. Сами сканировать его не нужно.'

// Конвейер проверок из §5.2: не распознан → не активен → нет доступа → не для этого режима.
// ctx: role — 'user' | 'staff'; mode — 'single' (по умолчанию) или 'session' (нужны только паспорта);
// source — 'camera' или 'manual'; checkActive(parsed) — проверка срока действия кода действия.
// Результат: { ok: true, kind, id, asset? } или { ok: false, error }.
export function resolveScan(text, { role = 'user', mode = 'single', source = 'camera', checkActive } = {}) {
  const parsed = parseCode(text)
  if (!parsed) return { ok: false, error: 'unrecognized' }

  // Руками вводят только короткие коды наклеек; остальное объясняем отдельным экраном.
  if (source === 'manual' && isActionKind(parsed.kind)) return { ok: false, error: 'manual-action-code' }

  const asset = parsed.kind === 'passport' ? findAsset(parsed.id) : null
  if (parsed.kind === 'passport' && !asset) return { ok: false, error: 'unrecognized' }

  const active = asset ? isActiveAsset(asset) : (checkActive?.(parsed) ?? true)
  if (!active) return { ok: false, error: 'inactive' }

  if (!canScanKind(role, parsed.kind)) {
    const detail = isTeacherKind(parsed.kind) ? teacherOnlyDetail : staffCodeDetail
    return { ok: false, error: 'forbidden', detail }
  }
  if (asset?.restricted && role !== 'staff') return { ok: false, error: 'forbidden' }

  if (mode === 'session' && isActionKind(parsed.kind)) return { ok: false, error: 'wrong-mode' }

  return { ok: true, ...parsed, asset }
}

// Режим «Инвентаризация» у сотрудника: подходит только паспорт здания или помещения, он и задаёт область.
// Результат: { ok: true, kind: 'inventory-start', asset } или { ok: false, error, detail? }.
export function resolveInventoryStart(text, { role = 'staff', source = 'camera', checkActive } = {}) {
  if (role !== 'staff') return { ok: false, error: 'forbidden' }
  const scan = resolveScan(text, { role, source, checkActive })
  if (!scan.ok) return scan
  if (scan.kind !== 'passport') {
    return { ok: false, error: 'wrong-mode', detail: 'В режиме инвентаризации подходят только коды зданий и помещений. Чтобы работать с заявками, переключитесь на «Сканер».' }
  }
  if (!canInventory(scan.asset)) {
    return { ok: false, error: 'wrong-mode', detail: 'Инвентаризацию проводят по зданию или помещению. Отсканируйте код помещения, а не отдельной единицы.' }
  }
  return { ok: true, kind: 'inventory-start', id: scan.id, asset: scan.asset }
}
