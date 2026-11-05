// Сущности с паспортом: актив, помещение, оборудование, рабочее место, мероприятие.
// id совпадает с коротким кодом на наклейке. Актив может содержать любые сущности, поэтому
// связи «Входит в / Содержит» строятся по parentId. Данные демонстрационные.
import { reactive } from 'vue'

export const assetTypes = {
  asset: { label: 'Актив' },
  room: { label: 'Помещение' },
  equipment: { label: 'Оборудование' },
  workplace: { label: 'Рабочее место' },
  event: { label: 'Мероприятие' },
}

export const assetStatuses = {
  available: { label: 'Свободно', color: 'green' },
  'in-use': { label: 'Используется', color: 'blue' },
  maintenance: { label: 'На обслуживании', color: 'orange' },
  // Списанные паспорта остаются в системе, но код больше не работает.
  'written-off': { label: 'Списано', color: 'default' },
}

// restricted — паспорт доступен только сотрудникам; tmc — единица ТМЦ (в заявке может быть и целой моделью);
// modelId — модель, под которую подходит любая свободная единица.
// Реактивный список: выдача и приёмка меняют статусы единиц, и паспорта сразу показывают актуальное.
export const assets = reactive([
  { id: 'AS-0001', type: 'asset', title: 'Корпус А', parentId: null, status: 'available' },
  { id: 'RM-0703', type: 'room', title: 'Кабинет F703', roomCode: 'F703', level: '7 уровень', capacity: 'до 20 чел.', roomType: 'Учебное помещение', hasRelay: true, parentId: 'AS-0001', status: 'available' },
  { id: 'RM-0705', type: 'room', title: 'Кабинет F705', roomCode: 'F705', level: '7 уровень', capacity: 'до 20 чел.', roomType: 'Учебное помещение', hasRelay: false, parentId: 'AS-0001', status: 'available' },
  { id: 'RM-0305', type: 'room', title: 'Аудитория 305', roomCode: 'A305', level: '3 уровень', capacity: 'до 40 чел.', roomType: 'Учебная аудитория', hasRelay: false, parentId: 'AS-0001', status: 'available' },
  { id: 'EQ-0142', type: 'equipment', title: 'Проектор Epson EB-X49', parentId: 'RM-0305', status: 'available', modelId: 'projector' },
  { id: 'EQ-0999', type: 'equipment', title: 'Проектор (старый)', parentId: 'RM-0305', status: 'written-off', modelId: 'projector' },
  { id: 'EV-2001', type: 'event', title: 'Лекция «Город будущего»', parentId: 'RM-0305', status: 'available' },
  { id: 'RM-0210', type: 'room', title: 'Коворкинг, 2 этаж', roomCode: 'A210', level: '2 уровень', capacity: 'до 30 чел.', roomType: 'Коворкинг', hasRelay: false, parentId: 'AS-0001', status: 'available' },
  { id: 'WP-0101', type: 'workplace', title: 'Рабочее место 1', parentId: 'RM-0210', status: 'available' },
  { id: 'WP-0102', type: 'workplace', title: 'Рабочее место 2', parentId: 'RM-0210', status: 'in-use' },
  { id: 'RM-0901', type: 'room', title: 'Серверная', parentId: 'AS-0001', status: 'available', restricted: true },

  { id: 'AS-0002', type: 'asset', title: 'Студенческий центр', parentId: null, status: 'available' },
  { id: 'RM-0012', type: 'room', title: 'Комната 12', parentId: 'AS-0002', status: 'available' },
  { id: 'EQ-0201', type: 'equipment', title: '3D-принтер Prusa MK4', parentId: 'RM-0012', status: 'in-use', modelId: '3d-printer' },

  { id: 'AS-0007', type: 'asset', title: 'Общежитие №7', parentId: null, status: 'available' },
  { id: 'RM-0101', type: 'room', title: 'Кладовая, комната 101', parentId: 'AS-0007', status: 'available' },
  { id: 'TM-0301', type: 'equipment', title: 'Утюг Philips', parentId: 'RM-0101', status: 'available', modelId: 'iron', tmc: true },
  { id: 'TM-0302', type: 'equipment', title: 'Утюг Philips', parentId: 'RM-0101', status: 'in-use', modelId: 'iron', tmc: true },
  { id: 'TM-0303', type: 'equipment', title: 'Пылесос Samsung', parentId: 'RM-0101', status: 'in-use', modelId: 'vacuum', tmc: true },
  { id: 'TM-0304', type: 'equipment', title: 'Пылесос Samsung', parentId: 'RM-0101', status: 'maintenance', modelId: 'vacuum', tmc: true },
  { id: 'TM-0305', type: 'equipment', title: 'Набор инструментов', parentId: 'RM-0101', status: 'available', modelId: 'tools', tmc: true },
  { id: 'TM-0306', type: 'equipment', title: 'Пылесос Samsung', parentId: 'RM-0101', status: 'available', modelId: 'vacuum', tmc: true },
  { id: 'TM-0307', type: 'equipment', title: 'Пылесос Samsung', parentId: 'RM-0101', status: 'available', modelId: 'vacuum', tmc: true },
])

export function setAssetStatus(id, status) {
  const asset = findAsset(id)
  if (asset) asset.status = status
}

export const tmcModels = {
  iron: 'Утюг',
  vacuum: 'Пылесос',
  tools: 'Набор инструментов',
  projector: 'Проектор',
  '3d-printer': '3D-принтер',
}

// Категория для подписи позиции в списке выдачи.
export const tmcCategories = {
  iron: 'Бытовой инвентарь',
  vacuum: 'Бытовой инвентарь',
  tools: 'Инструменты',
  projector: 'Оборудование',
  '3d-printer': 'Оборудование',
}

const normalizeId =(id) => String(id ?? '').trim().toUpperCase()

export const findAsset = (id) => assets.find((asset) => asset.id === normalizeId(id)) ?? null
export const parentOf = (asset) => (asset?.parentId ? findAsset(asset.parentId) : null)
export const childrenOf = (asset) => assets.filter((item) => item.parentId === asset.id)

// Все вложенные сущности: нужны инвентаризации помещения или актива целиком.
export function descendantsOf(asset) {
  return childrenOf(asset).flatMap((child) => [child, ...descendantsOf(child)])
}

export const isActiveAsset = (asset) => asset.status !== 'written-off'
