import { describe, expect, it } from 'vitest'
import { buildCode, isStaffKind, normalizeManual, parseCode, staffKinds } from './scanCodes'
import { canScanKind, resolveInventoryStart, resolveScan } from './scanModel'

describe('parseCode', () => {
  it('разбирает код FEFU One', () => {
    expect(parseCode('FEFU-ONE:P:EQ-0142')).toEqual({ kind: 'passport', id: 'EQ-0142' })
    expect(parseCode('  FEFU-ONE:REQUEST:3002  ')).toEqual({ kind: 'request', id: '3002' })
  })

  it('сохраняет двоеточия внутри id', () => {
    expect(parseCode('FEFU-ONE:CLASS:2026-10-31:305')).toEqual({ kind: 'class', id: '2026-10-31:305' })
  })

  it.each(['', null, 'hello', 'https://example.com', 'FEFU-ONE:P', 'FEFU-ONE:P:', 'FEFU-ONE:X:1', 'OTHER:P:EQ-0142'])('отклоняет «%s»', (text) => {
    expect(parseCode(text)).toBeNull()
  })

  it('buildCode и parseCode обратимы', () => {
    expect(parseCode(buildCode('checkout', '3002'))).toEqual({ kind: 'checkout', id: '3002' })
  })
})

describe('normalizeManual', () => {
  it('превращает короткий код в паспортный, регистр не важен', () => {
    expect(normalizeManual(' eq-0142 ')).toBe('FEFU-ONE:P:EQ-0142')
  })

  it('остальной ввод оставляет как есть', () => {
    expect(normalizeManual('abc')).toBe('abc')
    expect(normalizeManual('FEFU-ONE:REQUEST:3002')).toBe('FEFU-ONE:REQUEST:3002')
  })
})

describe('resolveScan', () => {
  const passport = (id) => buildCode('passport', id)

  it('не распознан: мусор и неизвестный паспорт', () => {
    expect(resolveScan('hello')).toEqual({ ok: false, error: 'unrecognized' })
    expect(resolveScan(passport('EQ-7777'))).toEqual({ ok: false, error: 'unrecognized' })
  })

  it('не активен: списанный паспорт и просроченный код действия', () => {
    expect(resolveScan(passport('EQ-0999'))).toEqual({ ok: false, error: 'inactive' })
    expect(resolveScan(buildCode('checkin', '1'), { checkActive: () => false })).toEqual({ ok: false, error: 'inactive' })
  })

  it('нет доступа: закрытый паспорт и коды сотрудника для пользователя', () => {
    expect(resolveScan(passport('RM-0901'), { role: 'user' })).toEqual({ ok: false, error: 'forbidden' })
    for (const kind of staffKinds) {
      expect(resolveScan(buildCode(kind, '3002'), { role: 'user' })).toMatchObject({ ok: false, error: 'forbidden' })
    }
  })

  it('пользователю объясняют, что код сотрудника нужно показывать, а не сканировать', () => {
    expect(resolveScan(buildCode('request', '3002'), { role: 'user' }).detail).toMatch(/код для сотрудника/i)
    // Закрытый паспорт — обычный отказ без этого пояснения.
    expect(resolveScan(passport('RM-0901'), { role: 'user' }).detail).toBeUndefined()
  })

  it('сотрудник открывает закрытый паспорт и коды заявок', () => {
    expect(resolveScan(passport('RM-0901'), { role: 'staff' })).toMatchObject({ ok: true, kind: 'passport' })
    expect(resolveScan(buildCode('request', '3002'), { role: 'staff' })).toMatchObject({ ok: true, kind: 'request', id: '3002' })
  })

  it('пользователь сканирует чекин и пару', () => {
    expect(resolveScan(buildCode('checkin', '2001'), { role: 'user' })).toMatchObject({ ok: true, kind: 'checkin' })
    expect(resolveScan(buildCode('class', '77'), { role: 'user' })).toMatchObject({ ok: true, kind: 'class' })
  })

  it('руками действия не вводятся', () => {
    expect(resolveScan(buildCode('request', '3002'), { role: 'staff', source: 'manual' })).toEqual({ ok: false, error: 'manual-action-code' })
    expect(resolveScan(passport('EQ-0142'), { source: 'manual' })).toMatchObject({ ok: true })
  })

  it('в сессии подходят только паспорта', () => {
    expect(resolveScan(buildCode('checkin', '2001'), { mode: 'session' })).toEqual({ ok: false, error: 'wrong-mode' })
    expect(resolveScan(passport('EQ-0142'), { mode: 'session' })).toMatchObject({ ok: true, kind: 'passport' })
  })

  it('порядок проверок: «нет доступа» раньше «не для этого режима»', () => {
    expect(resolveScan(buildCode('request', '1'), { role: 'user', mode: 'session' })).toMatchObject({ ok: false, error: 'forbidden' })
  })

  it('возвращает паспорт сущности', () => {
    expect(resolveScan(passport('EQ-0142')).asset).toMatchObject({ id: 'EQ-0142', type: 'equipment' })
  })
})

describe('canScanKind', () => {
  it('коды заявки, возврата и чекаута — только сотрудник', () => {
    expect(canScanKind('user', 'return')).toBe(false)
    expect(canScanKind('staff', 'return')).toBe(true)
    expect(canScanKind('user', 'passport')).toBe(true)
  })

  it('чекин и пара — пользовательские коды', () => {
    expect(isStaffKind('checkin')).toBe(false)
    expect(isStaffKind('class')).toBe(false)
    expect(canScanKind('user', 'checkin')).toBe(true)
    expect(canScanKind('user', 'class')).toBe(true)
  })
})

describe('resolveInventoryStart', () => {
  // Корпус А (AS-0001) и коворкинг (RM-0210) — контейнеры, EQ-0142 — отдельная единица.
  it('паспорт здания или помещения запускает инвентаризацию этой области', () => {
    for (const id of ['AS-0001', 'RM-0210']) {
      expect(resolveInventoryStart(buildCode('passport', id), { role: 'staff' })).toMatchObject({ ok: true, kind: 'inventory-start', asset: { id } })
    }
  })

  it('паспорт отдельной единицы и коды действий — не для этого режима, с пояснением', () => {
    for (const text of [buildCode('passport', 'EQ-0142'), buildCode('request', '3001'), buildCode('return', '3002')]) {
      expect(resolveInventoryStart(text, { role: 'staff' })).toMatchObject({ ok: false, error: 'wrong-mode', detail: expect.any(String) })
    }
  })

  it('ошибки обычного скана сохраняются: нераспознанный код, списанный объект', () => {
    expect(resolveInventoryStart('мусор', { role: 'staff' })).toMatchObject({ ok: false, error: 'unrecognized' })
    expect(resolveInventoryStart(buildCode('passport', 'EQ-0999'), { role: 'staff' })).toMatchObject({ ok: false, error: 'inactive' })
  })

  it('пользователю режим недоступен', () => {
    expect(resolveInventoryStart(buildCode('passport', 'AS-0001'), { role: 'user' })).toMatchObject({ ok: false, error: 'forbidden' })
  })

  it('короткий код с наклейки (ручной ввод) тоже подходит', () => {
    expect(resolveInventoryStart(normalizeManual('rm-0210'), { role: 'staff', source: 'manual' })).toMatchObject({ ok: true, asset: { id: 'RM-0210' } })
  })
})
