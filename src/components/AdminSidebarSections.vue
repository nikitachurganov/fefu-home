<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import icons from '../data/adminIcons.json'

// sections — свой набор разделов (например, «Обучение» преподавателя); по умолчанию разделы админки.
// У раздела может быть svg (готовая разметка иконки) вместо ключа icon и open: true — раскрыт сразу.
const props = defineProps({ collapsed: Boolean, sections: { type: Array, default: null } })
const emit = defineEmits(['expand'])
const adminSections = [
  { label: 'Пульс кампуса', icon: 'pulse-24-filled', children: ['Общая сводка', 'Образовательный контур', 'Посещаемость пар', 'Кадровый контур', 'Помещения', 'Загрузка помещений', 'Основные средства', 'Пользователи и рабочие места', 'Научная деятельность', 'Учебный фонд', 'Энергопотребление'] },
  { label: 'Активы и объекты', icon: 'grid-24-filled', children: ['Активы', 'Точки интереса', 'Здания и сооружения'] },
  { label: 'Имущественный комплекс', icon: 'building-bank-24-filled', children: ['Помещения', 'Основные средства', 'Рабочие места', 'Системы объективного контроля'] },
  { label: 'Пользователи', icon: 'people-community-24-filled', children: ['Список пользователей', 'Штатное расписание', 'Студенты', 'Справочник должностей'] },
  { label: 'Наука', icon: 'beaker-24-filled', children: ['Коллективы', 'Достижения'] },
  { label: 'Транспорт', icon: 'vehicle-car-24-filled', children: ['Городские шаттлы'] },
  { label: 'Подразделения', icon: 'organization-24-filled' },
  { label: 'Бронирование', icon: 'calendar-ltr-24-filled', children: ['Реестр мероприятий', 'Реестр объектов бронирования', 'Склад ТМЦ'] },
  { label: 'Сообщения от пользователей', icon: 'chat-multiple-24-filled', children: ['Обратная связь', 'Ошибки в данных'] },
  { label: 'Настройки системы', icon: 'settings-24-filled', children: ['Роли', 'Типы и классы', 'Категории поиска', 'Постоянные ссылки'] },
]
const sections = props.sections ?? adminSections
const open = ref(sections.filter((item) => item.open).map((item) => item.label))
const iconMarkup = (item) => item.svg ?? icons[item.icon]
function select(item) {
  if (item.children) {
    if (props.collapsed) emit('expand')
    open.value = open.value.includes(item.label) ? open.value.filter((label) => label !== item.label) : [...open.value, item.label]
  } else message.info(`Раздел «${item.label}» пока недоступен в этом прототипе`)
}
</script>

<template>
  <div class="admin-sidebar-sections">
    <div v-for="item in sections" :key="item.label">
      <a-popover v-if="collapsed && item.children" :arrow="false" :trigger="['hover', 'click']" placement="rightTop" overlay-class-name="admin-sidebar-popup">
        <template #content>
          <div class="admin-sidebar-popup-content">
            <div class="admin-sidebar-popup-title">{{ item.label }}</div>
            <button v-for="child in item.children" :key="child" type="button" class="admin-sidebar-child" @click="select({ label: child })">{{ child }}</button>
          </div>
        </template>
        <button type="button" class="desktop-sidebar-item admin-sidebar-item" :aria-label="item.label" aria-haspopup="true">
          <svg class="admin-sidebar-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="iconMarkup(item)"></svg>
        </button>
      </a-popover>
      <button v-else type="button" class="desktop-sidebar-item admin-sidebar-item" :title="collapsed ? item.label : undefined" :aria-label="item.label" :aria-expanded="item.children ? open.includes(item.label) : undefined" @click="select(item)">
        <svg class="admin-sidebar-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="iconMarkup(item)"></svg>
        <span v-if="!collapsed" class="admin-sidebar-label">{{ item.label }}</span>
        <DownOutlined v-if="!collapsed && item.children" class="admin-sidebar-chevron" :class="{ open: open.includes(item.label) }" />
      </button>
      <div v-if="item.children" class="admin-sidebar-disclosure"
        :class="{ 'is-open': !collapsed && open.includes(item.label) }"
        :inert="collapsed || !open.includes(item.label)">
        <div class="admin-sidebar-clip">
          <div class="admin-sidebar-children">
            <button v-for="child in item.children" :key="child" type="button" class="admin-sidebar-child" @click="select({ label: child })">{{ child }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-sidebar-item { margin-top: 2px; }
.admin-sidebar-icon { width: 20px; height: 20px; flex: none; }
.admin-sidebar-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-sidebar-chevron { font-size: 12px !important; transition: transform var(--section-duration) var(--sidebar-ease); }
.admin-sidebar-chevron.open { transform: rotate(180deg); }
.admin-sidebar-disclosure {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--section-duration) var(--sidebar-ease), opacity var(--section-duration) var(--sidebar-ease);
}
.admin-sidebar-disclosure.is-open { grid-template-rows: 1fr; opacity: 1; }
.admin-sidebar-clip { min-height: 0; overflow: hidden; }
.admin-sidebar-children { min-width: 250px; padding: 2px 0 4px 32px; }
.admin-sidebar-child { display: block; width: 100%; padding: 8px 12px; border: 0; border-radius: 8px; background: transparent; color: inherit; text-align: left; font-size: 14px; cursor: pointer; }
.admin-sidebar-child:hover { background: rgba(128, 128, 128, .12); }
.admin-sidebar-popup-content { width: 230px; max-height: min(70vh, 600px); overflow-y: auto; }
.admin-sidebar-popup-title { padding: 8px 12px; font-size: 14px; font-weight: 600; }
</style>
