import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('EventsEmptyCard (ТЗ раздел 1)', () => {
  const componentPath = path.resolve(__dirname, 'EventsEmptyCard.vue')
  const content = fs.readFileSync(componentPath, 'utf-8')

  it('рендерит заголовок «Сегодня нет событий» и подзаголовок', () => {
    expect(content).toContain("const TITLE = 'Сегодня нет событий'")
    expect(content).toContain("const SUBTITLE = 'Новые события появятся здесь'")
    expect(content).toContain("const LINK_TEXT = 'Подробнее'")
    expect(content).toContain('{{ TITLE }}')
    expect(content).toContain('{{ SUBTITLE }}')
  })

  it('содержит кнопку «Подробнее», которая эмитит open-info', () => {
    expect(content).toContain("emit('open-info')")
    expect(content).toContain("defineEmits(['open-info'])")
    expect(content).toContain('empty-card-link')
  })

  it('содержит атрибуты доступности role="region" и aria-label="События"', () => {
    expect(content).toContain('role="region"')
    expect(content).toContain('aria-label="События"')
  })

  it('подключает векторную иллюстрацию пустого лотка', () => {
    expect(content).toContain("import emptyTrayIcon from '../assets/figma/empty-tray.svg'")
    expect(content).toContain(':src="emptyTrayIcon"')
  })
})
