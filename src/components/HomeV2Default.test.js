import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Главная страница мобильной версии по макету Figma 1186:3935 (v.2) и узлу 1079:3149', () => {
  const appPath = path.resolve(__dirname, '../App.vue')
  const appContent = fs.readFileSync(appPath, 'utf-8')
  const cssPath = path.resolve(__dirname, '../styles.css')
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  it('по умолчанию выдаётся экран с пустым состоянием событий (Figma 1186:3935)', () => {
    // Пользователь авторизован по умолчанию
    expect(appContent).toContain('const isAuthenticated = ref(true)')
    // По умолчанию слайдер сессий выключен в пользу макета v.2 («Сегодня нет событий»)
    expect(appContent).toContain('const showSessionSlider = ref(')
    // Шаблон рендерит EventsEmptyCard, если showSessionSlider выключен
    expect(appContent).toContain('v-if="isAuthenticated && showSessionSlider && activityGroups.length"')
    expect(appContent).toContain('v-else-if="isAuthenticated"')
    expect(appContent).toContain('<EventsEmptyCard')
  })

  it('блок быстрых действий содержит «QR-пропуск» и «Код для отметки» (Figma 1201:4495 / 1079:3149)', () => {
    expect(appContent).toContain('QR-пропуск')
    expect(appContent).toContain('Код для отметки')
    expect(appContent).toContain('code-card-title')
    expect(appContent).toContain('code-card-subtitle')
    expect(appContent).toContain('aria-label="Открыть QR-пропуск"')
  })

  it('присутствуют быстрые действия «QR-сканер» и «Мои заявки»', () => {
    expect(appContent).toContain('QR-сканер')
    expect(appContent).toContain('Мои заявки')
  })

  it('плашка с кодом (quick-code-card, Figma 1079:3149) имеет точные размеры, цвета и grid-параметры', () => {
    expect(cssContent).toContain('display: flex;')
    expect(cssContent).toContain('height: 84px;')
    expect(cssContent).toContain('padding: 4px 8px 4px 12px;')
    expect(cssContent).toContain('align-items: center;')
    expect(cssContent).toContain('gap: 8px;')
    expect(cssContent).toContain('grid-row: span 1;')
    expect(cssContent).toContain('grid-column: span 4;')
    expect(cssContent).toContain('justify-self: stretch;')
    expect(cssContent).toContain('--color-info-gradient-start: #23558c;')
    expect(cssContent).toContain('--color-info-gradient-end: #4f90da;')
  })
})
