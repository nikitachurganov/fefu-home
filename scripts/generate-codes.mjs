// Генерирует страницы с QR-кодами для проверки прототипа с телефона, по странице на роль:
// docs/demo-codes-user.html (пользователь) и docs/demo-codes-staff.html (сотрудник).
// Открываете нужную страницу на компьютере, в «Профиле» приложения выбираете ту же роль и наводите камеру сканера на экран.
// Запуск: npm run codes
import { writeFileSync } from 'node:fs'
import { BarcodeFormat, EncodeHintType, QRCodeWriter } from '@zxing/library'
import { createServer } from 'vite'

// Модули данных импортируют друг друга без расширений, поэтому грузим их через Vite, а не напрямую в Node.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { assetStatuses, assetTypes, assets, isActiveAsset } = await server.ssrLoadModule('/src/data/assets.js')
const { demoCodes } = await server.ssrLoadModule('/src/data/demoCodes.js')
const { buildCode } = await server.ssrLoadModule('/src/data/scanCodes.js')
await server.close()

const writer = new QRCodeWriter()

// QR как inline-SVG: по одному квадрату на тёмный модуль, запас в 4 модуля по краям.
function qrSvg(text) {
  const hints = new Map([[EncodeHintType.MARGIN, 4]])
  const matrix = writer.encode(text, BarcodeFormat.QR_CODE, 0, 0, hints)
  const size = matrix.getWidth()
  let path = ''
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}"/></svg>`
}

const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const card = ({ label, text }) => `<figure><div class="qr">${qrSvg(text)}</div><figcaption><strong>${escape(label)}</strong><code>${escape(text)}</code></figcaption></figure>`
const section = ({ title, note = '', errors = false, codes }) => `<section${errors ? ' class="errors"' : ''}><h2>${escape(title)}${errors ? ' <span class="tag">ожидаемый отказ</span>' : ''}</h2>${note ? `<p class="note">${escape(note)}</p>` : ''}<div class="grid">${codes.map(card).join('')}</div></section>`

// Наклейки паспортов: все единицы из assets.js, сгруппированные по типу. Закрытые и списанные помечаем в подписи.
const stickerNote = (asset) => {
  if (!isActiveAsset(asset)) return ' — списано, код не активен'
  return asset.restricted ? ' — закрыт, только сотрудник' : ` (${assetStatuses[asset.status].label})`
}
const stickers = Object.entries(assetTypes).map(([type, { label }]) => section({
  title: `Наклейки: ${label}`,
  codes: assets.filter((asset) => asset.type === type).map((asset) => ({
    label: `${asset.title} · ${asset.id}${stickerNote(asset)}`,
    text: buildCode('passport', asset.id),
  })),
}))

const pages = {
  user: {
    file: 'demo-codes-user.html',
    name: 'Пользователь',
    other: { file: 'demo-codes-staff.html', name: 'сотрудника' },
    lead: 'Паспорта, чекин и отметки на парах. Коды сотрудника (заявка, возврат, чекаут) здесь есть только среди ошибок: пользователь их показывает, а не сканирует.',
  },
  teacher: {
    file: 'demo-codes-teacher.html',
    name: 'Преподаватель',
    other: { file: 'demo-codes-user.html', name: 'пользователя' },
    lead: 'Аудитории для старта пары и персональные коды студентов. Преподаватель сначала сканирует аудиторию, чтобы начать пару, а затем сканирует студентов или выводит QR на проектор.',
  },
  staff: {
    file: 'demo-codes-staff.html',
    name: 'Сотрудник',
    other: { file: 'demo-codes-user.html', name: 'пользователя' },
    lead: 'Коды заявок, возврата и чекаута, закрытые паспорта и инвентаризация. Их сканирует только сотрудник. Результат зависит от этапа заявки: после выдачи код заявки перестаёт быть активным, пока не обновите приложение.',
  },
}

const html = (role) => {
  const page = pages[role]
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Демо-коды FEFU One: ${escape(page.name)}</title>
<style>
  body { margin: 0; padding: 24px; background: #f5f5f5; color: #101828; font: 14px/20px system-ui, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 24px; } h2 { margin: 32px 0 4px; font-size: 18px; }
  .lead, .note { margin: 0 0 12px; color: rgba(0,0,0,.65); }
  .role { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin: 12px 0 0; padding: 12px 16px; border-radius: 12px; background: #e6f4ff; color: #0958d9; }
  .role.staff { background: #fff7e6; color: #ad4e00; }
  .role a { color: inherit; }
  .tag { padding: 0 8px; border-radius: 4px; background: #fff1f0; color: #cf1322; font-size: 12px; font-weight: 400; vertical-align: middle; }
  .errors figure { box-shadow: inset 0 0 0 1px #ffccc7; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  figure { margin: 0; padding: 12px; border-radius: 12px; background: #fff; break-inside: avoid; }
  .qr svg { display: block; width: 100%; max-width: 220px; margin: 0 auto; }
  figcaption { display: grid; gap: 2px; margin-top: 8px; }
  code { color: rgba(0,0,0,.45); font-size: 11px; word-break: break-all; }
</style></head><body>
<h1>Демо-коды FEFU One: ${escape(page.name)}</h1>
<p class="lead">${escape(page.lead)}</p>
<p class="role ${role}"><strong>В приложении выберите роль «${escape(page.name)}»</strong> (Профиль → Демо-режим). <a href="${page.other.file}">Коды для ${page.other.name}</a></p>
${demoCodes[role].map(section).join('\n')}
${stickers.join('\n')}
<p class="note">Страница сгенерирована командой <code>npm run codes</code>. Наведите камеру сканера в приложении на телефоне на экран компьютера.</p>
</body></html>`
}

for (const role of Object.keys(pages)) {
  writeFileSync(new URL(`../docs/${pages[role].file}`, import.meta.url), html(role))
  console.log(`Готово: docs/${pages[role].file}`)
}
