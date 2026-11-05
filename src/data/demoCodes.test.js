import { describe, expect, it } from 'vitest'
import { isActionCodeActive } from './actionCodes'
import { demoCodes } from './demoCodes'
import { parseCode, staffKinds } from './scanCodes'
import { resolveScan } from './scanModel'

const scan = (text, role) => resolveScan(text, { role, checkActive: (parsed) => isActionCodeActive(parsed) })

// Коды из групп без errors должны приниматься в своей роли, а из групп с errors — отклоняться.
describe.each(Object.keys(demoCodes))('демо-коды роли «%s»', (role) => {
  const groups = demoCodes[role]

  it.each(groups.filter((group) => !group.errors).flatMap((group) => group.codes))('принимает «$label»', ({ text, label }) => {
    // Исключение — сценарии, где код заведомо истёк: они помечены в подписи.
    if (/код истёк/.test(label)) expect(scan(text, role).ok).toBe(false)
    else expect(scan(text, role)).toMatchObject({ ok: true })
  })

  it.each(groups.filter((group) => group.errors).flatMap((group) => group.codes))('отклоняет «$label»', ({ text }) => {
    expect(scan(text, role).ok).toBe(false)
  })
})

describe('разделение кодов по ролям', () => {
  const kindsOf = (role, errors) => demoCodes[role]
    .filter((group) => Boolean(group.errors) === errors)
    .flatMap((group) => group.codes.map((code) => parseCode(code.text)?.kind))

  it('в рабочих кодах пользователя нет кодов сотрудника', () => {
    expect(kindsOf('user', false).some((kind) => staffKinds.includes(kind))).toBe(false)
  })

  it('коды сотрудника в демо-списке пользователя есть только среди ошибок', () => {
    expect(kindsOf('user', true).some((kind) => staffKinds.includes(kind))).toBe(true)
  })

  it('все коды сотрудника из его списка пользователь отсканировать не может', () => {
    const staffCodes = demoCodes.staff.filter((group) => !group.errors).flatMap((group) => group.codes)
    for (const { text } of staffCodes.filter(({ text: code }) => staffKinds.includes(parseCode(code)?.kind))) {
      expect(scan(text, 'user').ok).toBe(false)
    }
  })
})
