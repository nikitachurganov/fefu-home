<script setup>
import { ref } from 'vue'
import ruRU from 'ant-design-vue/es/locale/ru_RU'
import VisibilitySettings from './components/VisibilitySettings.vue'
import backIcon from './assets/back.svg'
import excelIcon from './assets/excel.svg'
import downloadIcon from './assets/download.svg'
import sidebarToggleIcon from './assets/sidebar-toggle.svg'
import chevronDownIcon from './assets/chevron-down.svg'
import chevronUpIcon from './assets/chevron-up.svg'
import logoShape from './assets/logo-shape.svg'
import logoCheck from './assets/logo-check.svg'
import logoVector from './assets/logo-vector.svg'

const theme = { token: { colorPrimary: '#2d82cf', borderRadius: 6, fontSize: 14 } }

const objectName = 'Переговорная А903'
const breadcrumbs = ['Бронирование', 'Объекты бронирования', objectName]

const tabs = [
  { key: 'info', label: 'Информация' },
  { key: 'schedule', label: 'Расписание' },
  { key: 'documents', label: 'Документы' },
  { key: 'settings', label: 'Настройки' },
  { key: 'visibility', label: 'Видимость' },
  { key: 'requests', label: 'Заявки' },
]
// Страница открывается сразу на разделе «Видимость».
const activeTab = ref('visibility')

// Режим редактирования раздела «Видимость»: управляется кнопками футера карточки.
const editing = ref(false)
const visibilityRef = ref(null)

function startEditing() {
  editing.value = true
}

function saveEditing() {
  visibilityRef.value?.save()
  editing.value = false
}

function cancelEditing() {
  visibilityRef.value?.cancel()
  editing.value = false
}

const menu = [
  { label: 'Аналитика', expandable: true },
  { label: 'Мои закрепления' },
  { label: 'Имущественный комплекс', expandable: true },
  { label: 'Коллективы' },
  {
    label: 'Бронирование',
    expanded: true,
    children: [{ label: 'Мероприятия' }, { label: 'Объекты бронирования', active: true }],
  },
  { label: 'Пользователи', expandable: true },
  { label: 'Транспорт', expandable: true },
  { label: 'Типы и классы' },
  { label: 'Категории поиска' },
  { label: 'Сообщения от пользователей', expandable: true },
]
</script>

<template>
  <a-config-provider :locale="ruRU" :theme="theme">
    <div class="admin">
      <header class="admin__header">
        <div class="admin__brand">
          <div class="admin__logo">
            <div class="admin__logo-marker">
              <img class="admin__logo-shape" :src="logoShape" alt="" />
              <img class="admin__logo-check" :src="logoCheck" alt="" />
            </div>
            <img class="admin__logo-vector" :src="logoVector" alt="" />
          </div>
          <span class="admin__brand-name">FEFUone</span>
          <button class="admin__icon-button" type="button" aria-label="Свернуть меню">
            <img :src="sidebarToggleIcon" alt="" width="24" height="24" />
          </button>
        </div>

        <nav class="admin__breadcrumbs" aria-label="Навигация">
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb">
            <span v-if="index" class="admin__crumb-sep">/</span>
            <span class="admin__crumb" :class="{ 'admin__crumb--current': index === breadcrumbs.length - 1 }">
              {{ crumb }}
            </span>
          </template>
        </nav>
      </header>

      <aside class="admin__sidebar">
        <ul class="menu">
          <li v-for="item in menu" :key="item.label" class="menu__group">
            <div class="menu__item">
              <span>{{ item.label }}</span>
              <img
                v-if="item.expandable || item.children"
                class="menu__chevron"
                :src="item.expanded ? chevronUpIcon : chevronDownIcon"
                alt=""
              />
            </div>
            <ul v-if="item.children && item.expanded" class="menu__sub">
              <li
                v-for="child in item.children"
                :key="child.label"
                class="menu__item menu__item--sub"
                :class="{ 'menu__item--active': child.active }"
              >
                {{ child.label }}
              </li>
            </ul>
          </li>
        </ul>
      </aside>

      <main class="admin__body">
        <section class="card">
          <div class="card__head">
            <button class="card__back" type="button" aria-label="Назад к списку">
              <img :src="backIcon" alt="" width="14" height="14" />
            </button>
            <h1 class="card__title">{{ objectName }}</h1>
            <div class="card__actions">
              <a-button size="small">
                <span class="card__report">
                  <img :src="excelIcon" alt="" width="14" height="14" />
                  Отчет
                  <img :src="downloadIcon" alt="" width="14" height="14" />
                </span>
              </a-button>
              <a-button size="small">Показать на карте</a-button>
              <a-button size="small">Поделиться</a-button>
            </div>
          </div>

          <div class="card__tabs" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="card__tab"
              :class="{ 'card__tab--active': activeTab === tab.key }"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab.key"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="card__body">
            <!-- v-show, чтобы несохранённые правки не терялись при смене вкладки -->
            <VisibilitySettings v-show="activeTab === 'visibility'" ref="visibilityRef" :editing="editing" />
            <a-empty
              v-if="activeTab !== 'visibility'"
              class="card__empty"
              description="Раздел в этом прототипе не реализован"
            />
          </div>

          <footer v-if="activeTab === 'visibility'" class="card__footer">
            <a-button v-if="!editing" type="primary" ghost @click="startEditing">Редактировать</a-button>
            <template v-else>
              <a-button type="primary" @click="saveEditing">Сохранить</a-button>
              <a-button @click="cancelEditing">Отменить</a-button>
            </template>
          </footer>
        </section>
      </main>
    </div>
  </a-config-provider>
</template>

<style>
body {
  margin: 0;
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  font-family: 'SF Pro Text', -apple-system, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 22px;
}
</style>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  grid-template-rows: 72px minmax(0, 1fr);
  min-height: 100vh;
}

.admin__header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.admin__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin__logo {
  position: relative;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 14px;
  background: #2867ab;
  flex: none;
}

.admin__logo-marker {
  position: absolute;
  left: 18.75%;
  right: 18.75%;
  top: 12.5%;
  bottom: 25%;
}

.admin__logo-shape {
  position: absolute;
  inset: 0 0 -6.7px 0;
  width: 100%;
  height: calc(100% + 6.7px);
}

.admin__logo-check {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12.5px;
  height: 12.5px;
  transform: translate(-50%, -50%);
}

.admin__logo-vector {
  position: absolute;
  inset: 21.84% 40.63% 33.93% 37.5%;
  width: 21.87%;
  height: 44.23%;
}

.admin__brand-name {
  font-family: Inter, 'Segoe UI', sans-serif;
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  color: #121212;
}

.admin__icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.admin__icon-button:hover {
  background: rgba(0, 0, 0, 0.04);
}

.admin__breadcrumbs {
  display: flex;
  align-items: center;
  min-width: 0;
}

.admin__crumb {
  padding: 0 4px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.admin__crumb--current {
  color: rgba(0, 0, 0, 0.88);
}

.admin__crumb-sep {
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.45);
}

.admin__sidebar {
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.menu,
.menu__sub {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
}

.menu__item {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 32px 0 24px;
  border-radius: 8px;
  cursor: pointer;
}

.menu__item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.menu__chevron {
  position: absolute;
  right: 19px;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
}

.menu__sub {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.02);
}

.menu__item--sub {
  padding-left: 48px;
  padding-right: 16px;
}

.menu__item--active,
.menu__item--active:hover {
  background: #e6f4ff;
  color: #2d82cf;
}

.admin__body {
  display: flex;
  padding: 20px;
  background: #f5f5f5;
  min-width: 0;
}

.card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
}

.card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px 0;
}

.card__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
  cursor: pointer;
}

.card__title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 590;
  line-height: 24px;
}

.card__actions {
  display: flex;
  gap: 8px;
}

.card__report {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.card__tabs {
  display: flex;
  gap: 32px;
  margin-top: 12px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.card__tab {
  padding: 12px 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font: inherit;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
}

.card__tab--active {
  border-bottom-color: #2d82cf;
  color: #2d82cf;
}

.card__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.card__empty {
  padding: 64px 0;
}

.card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 900px) {
  .admin {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin__sidebar {
    display: none;
  }

  .card__head {
    flex-wrap: wrap;
  }

  .card__tabs {
    gap: 20px;
    overflow-x: auto;
  }
}
</style>
