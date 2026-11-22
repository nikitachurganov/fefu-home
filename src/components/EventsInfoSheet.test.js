import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('EventsInfoSheet (ТЗ раздел 3)', () => {
  const componentPath = path.resolve(__dirname, 'EventsInfoSheet.vue')
  const content = fs.readFileSync(componentPath, 'utf-8')

  it('содержит корректный заголовок и подзаголовок шторки', () => {
    expect(content).toContain('Какие события здесь появятся')
    expect(content).toContain('В этом блоке мы показываем ближайшие и текущие события из ваших сервисов')
  })

  it('содержит все четыре обязательные категории по ТЗ', () => {
    // 1. Занятия
    expect(content).toContain('Занятия')
    expect(content).toContain('Пары по вашему расписанию')

    // 2. Мероприятия
    expect(content).toContain('Мероприятия')
    expect(content).toContain('События, на которые вы записаны')

    // 3. Аренда ТМЦ (инвентаря)
    expect(content).toContain('Аренда ТМЦ (инвентаря)')
    expect(content).toContain('Выдача и возврат инвентаря')

    // 4. Бронирование оборудования и пространств
    expect(content).toContain('Бронирование оборудования и пространств')
    expect(content).toContain('Аудитории, коворкинги и техника')
  })

  it('использует BottomSheet со слотом и эмитит событие close при закрытии', () => {
    expect(content).toContain("import BottomSheet from './BottomSheet.vue'")
    expect(content).toContain("emit('close')")
    expect(content).toContain("defineEmits(['close'])")
    expect(content).toContain('btn-cancel')
    expect(content).toContain('Закрыть')
  })

  it('использует существующие ассеты иконок сервисов', () => {
    expect(content).toContain("import educationIcon from '../assets/figma/education.svg'")
    expect(content).toContain("import eventsIcon from '../assets/figma/events.svg'")
    expect(content).toContain("import rentIcon from '../assets/figma/rent.svg'")
    expect(content).toContain("import calendarIcon from '../assets/figma/calendar.svg'")
  })
})
