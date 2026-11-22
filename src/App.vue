<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { QrcodeOutlined, SearchOutlined } from '@ant-design/icons-vue'
import DesktopHome from './components/DesktopHome.vue'
import MobileSessionSlider from './components/MobileSessionSlider.vue'
import RequestsPage from './components/RequestsPage.vue'
import NotificationsPage from './components/NotificationsPage.vue'
import ProfilePage from './components/ProfilePage.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import AdminSidebarSections from './components/AdminSidebarSections.vue'
import { role, roleOptions } from './data/userStore'
import ScannerFlow from './components/scanner/ScannerFlow.vue'
import FeedbackSheet from './components/FeedbackSheet.vue'
import StudentCodeSheet from './components/StudentCodeSheet.vue'
import ClassStartSheet from './components/ClassStartSheet.vue'
import EventsEmptyCard from './components/EventsEmptyCard.vue'
import EventsInfoSheet from './components/EventsInfoSheet.vue'
import LessonRatingSheet from './components/LessonRatingSheet.vue'
import AttendanceWarningSheet from './components/AttendanceWarningSheet.vue'
import HomeAlertBanners from './components/HomeAlertBanners.vue'
import QrCode from './components/widgets/QrCode.vue'
import { studentCode } from './data/campus'
import { requests } from './data/requestStore'
import { timerLabel } from './data/requestModel'
import NotificationsPopover from './components/NotificationsPopover.vue'
import { unreadCount } from './data/notificationStore'
import { useMediaQuery } from './composables/useMediaQuery'
import logo from './assets/figma/logo.png'
import scannerIcon from './assets/figma/scanner.svg'
import helpIcon from './assets/figma/help.svg'
import cloudIcon from './assets/figma/cloud.svg'
import quickScanIcon from './assets/figma/quick-scan.svg'
import mapIcon from './assets/services/map.svg'
import busIcon from './assets/services/bus.svg'
import educationIcon from './assets/services/edu.svg'
import calendarIcon from './assets/services/calendar.svg'
import rentIcon from './assets/services/rent.svg'
import eventsIcon from './assets/services/event.svg'
import closeIcon from './assets/figma/close.svg'
import homeIcon from './assets/figma/home.svg'
import gridIcon from './assets/figma/grid.svg'
import documentIcon from './assets/figma/document.svg'
import alertIcon from './assets/figma/alert.svg'
import profileIcon from './assets/figma/profile.svg'
import panelToggleIcon from './assets/figma/panel-toggle.svg'
import SidebarThemeIcon from './components/SidebarThemeIcon.vue'
import { themeMode, cycleTheme } from './data/theme'

const noticeVisible = ref(false)
const restrictedServiceOpen = ref(false)
const classStartSheetOpen = ref(false)
const eventsInfoOpen = ref(false)
const activeNav = ref('home')
const isAuthenticated = ref(true)
const sidebarCollapsed = ref(false)
// По макету Figma 1186:3935 (v.2) по умолчанию открывается экран с пустым состоянием («Сегодня нет событий»).
// Для демонстрации слайдера активностей можно передать ?sessions=true в URL или вызвать window.__toggleSessions().
const showSessionSlider = ref(
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).get('sessions') === 'true' ||
   new URLSearchParams(window.location.search).get('slider') === 'true')
)
const statusText = ref('')
const serviceQuery = ref('')
const scannerOpen = ref(false)
const studentCodeOpen = ref(false)
const feedbackOpen = ref(false)
const ratingSheetOpen = ref(false)
const attendanceSheetOpen = ref(false)
const showRatingBanner = ref(false)
const showAttendanceBanner = ref(false)

function handleRatingSubmit(feedback) {
  message.success('Спасибо за отзыв! Ваша оценка сохранена')
  showRatingBanner.value = false
}

function handleAttendanceAction(action) {
  if (action === 'consultation') {
    // Пользователь запросил консультацию
  }
}

const currentLesson = ref({
  title: 'Производственная практика. Практика в информационно-аналитической и организационно-управленческой деятельности',
  instructor: 'Константинопольский Константин Константинович',
  room: 'А914',
  timeRange: '10:10 - 11:40',
})
// Заявка, которую нужно открыть после перехода из уведомления.
const focusRequestId = ref(null)
// Навигация возврата, если просмотр заявки был вызван с другого экрана (например, с главной).
const returnNav = ref(null)
// С 1024px главная собирается из виджетов (DesktopHome); граница совпадает с ПК-стилями в styles.css.
const isDesktop = useMediaQuery('(min-width: 1024px)')
// На ПК можно пройти демо-вход с главной. В этой вкладке вход сохраняется при обновлении.
if (isDesktop.value) isAuthenticated.value = sessionStorage.getItem('fefu-demo-login') === 'yes'
// При смене раскладки закрываем сканер и освобождаем камеру.
watch(isDesktop, () => { scannerOpen.value = false })

const now = ref(Date.now())
let tick
onMounted(() => {
  tick = setInterval(() => { now.value = Date.now() }, 1000)
  if (typeof window !== 'undefined') {
    window.__toggleSessions = () => { showSessionSlider.value = !showSessionSlider.value }
    window.__setSessions = (val) => { showSessionSlider.value = Boolean(val) }
  }
})
onBeforeUnmount(() => clearInterval(tick))

const activityGroups = computed(() => {
  const overdue = { title: 'Срок аренды или брони истёк', items: [] }
  const current = { title: 'Текущие активности', items: [] }
  for (const request of requests.value) {
    if (request.status !== 'active') continue
    if (!timerLabel(request, now.value).overdue) current.items.push(request)
    else if (['tmc', 'equipment', 'workplace'].includes(request.source)) overdue.items.push(request)
  }
  return [current, overdue].filter(group => group.items.length)
})

// Временный набор данных для демонстрации личного кабинета.
const services = [
  { label: 'Карта', description: 'Корпуса, общежития и маршруты по кампусу', icon: mapIcon },
  { label: 'Шаттлы', description: 'Маршруты и расписание автобусов', icon: busIcon },
  { label: 'Расписание', description: 'Занятия, аудитории и преподаватели', icon: educationIcon, requiresAuth: true },
  { label: 'Мероприятия', description: 'Афиша событий ДВФУ', icon: eventsIcon },
  { label: 'Бронирование', description: 'Оборудование, рабочие места и помещения', icon: calendarIcon },
  { label: 'Аренда', description: 'Инвентарь и переносное оборудование', icon: rentIcon },
]

const navigation = [
  { id: 'home', label: 'Главная', icon: homeIcon },
  { id: 'services', label: 'Сервисы', icon: gridIcon },
  { id: 'requests', label: 'Заявки', icon: documentIcon },
  { id: 'notifications', label: 'Уведомления', icon: alertIcon },
  { id: 'profile', label: 'Профиль', icon: profileIcon },
]

// На ПК «Уведомления» и «Профиль» переезжают в шапку, в боковом меню остаются остальные.
const headerIds = ['notifications', 'profile']
const sideNavigation = computed(() => (isDesktop.value ? navigation.filter((item) => !headerIds.includes(item.id)) : navigation))

const currentTitle = computed(() => navigation.find((item) => item.id === activeNav.value)?.label ?? '')
const availableServices = computed(() => services.filter((service) => !service.requiresAuth || isAuthenticated.value))
const restrictedServices = computed(() => isAuthenticated.value ? [] : services.filter((service) => service.requiresAuth))

// Поиск работает только на странице «Сервисы»; на главной остаются полные списки.
const matchesQuery = (service) => {
  const query = serviceQuery.value.trim().toLowerCase()
  return service.label.toLowerCase().includes(query) || service.description.toLowerCase().includes(query)
}
const foundServices = computed(() => availableServices.value.filter(matchesQuery))
const foundRestrictedServices = computed(() => restrictedServices.value.filter(matchesQuery))

function selectNav(id) {
  activeNav.value = id
  statusText.value = ''
  serviceQuery.value = ''
}

function authenticate() {
  isAuthenticated.value = true
  sessionStorage.setItem('fefu-demo-login', 'yes')
  noticeVisible.value = false
  statusText.value = ''
}

function logout() {
  sessionStorage.removeItem('fefu-demo-login')
  isAuthenticated.value = false
  selectNav('home')
}

function openRequestFromNotification(id, fromNav = null) {
  focusRequestId.value = id
  returnNav.value = fromNav
  selectNav('requests')
}

function handleRequestClosed() {
  if (returnNav.value) {
    const nav = returnNav.value
    returnNav.value = null
    selectNav(nav)
  }
}

function onSessionClick(id) {
  const item = requests.value.find((r) => r.id === id)
  if (!item) return

  // Если это учебное занятие / пара (5001, 5002 или событие расписания с преподавателем/аудиторией)
  if (item.id === '5001' || item.id === '5002' || item.instructor || item.room || item.source === 'events') {
    currentLesson.value = {
      title: item.title,
      instructor: item.instructor || 'Константинопольский Константин Константинович',
      room: item.room || 'А914',
      timeRange: item.timeRange || '10:10 - 11:40',
    }
    classStartSheetOpen.value = true
    return
  }

  // Для прочих активностей открываем просмотр с автоматическим возвратом на главную
  openRequestFromNotification(id, 'home')
}

function openService(label) {
  if (label === 'Расписание' && !isAuthenticated.value) {
    restrictedServiceOpen.value = true
    return
  }
  const text = `${label}: демо-раздел пока находится в разработке.`
  // На ПК строка статуса внизу длинной главной не видна — показываем всплывающее сообщение.
  if (isDesktop.value) message.info(text)
  else statusText.value = text
}
</script>

<template>
  <main class="screen" :class="{ 'portal-screen': isDesktop && activeNav === 'home', 'has-desktop-sidebar': isDesktop && isAuthenticated, 'sidebar-collapsed': sidebarCollapsed }" aria-label="FEFU One">
    <header v-if="!isDesktop || activeNav !== 'home'" class="app-header">
      <div v-if="!isDesktop || !isAuthenticated" class="brand">
        <img :src="logo" alt="Логотип FEFU One" class="brand-logo" />
        <span>FEFU One</span>
      </div>

      <div class="header-actions">
        <a-button v-if="!isDesktop" type="text" class="header-button" aria-label="Открыть QR-сканер" @click="scannerOpen = true">
          <img :src="scannerIcon" alt="" aria-hidden="true" />
        </a-button>
        <a-select v-if="isDesktop && isAuthenticated" v-model:value="role" class="header-role-selector" :options="roleOptions" aria-label="Роль" />
        <a-button type="text" class="header-button" aria-label="Обратная связь" @click="feedbackOpen = true">
          <img :src="helpIcon" alt="" aria-hidden="true" />
        </a-button>
        <!-- На ПК уведомления и профиль живут в шапке, а не в боковом меню. -->
        <template v-if="isDesktop && isAuthenticated">
          <NotificationsPopover
            :active="activeNav === 'notifications'"
            @open-request="openRequestFromNotification"
            @open-schedule="openService('Расписание')"
            @open-all="selectNav('notifications')"
          />
          <ProfileMenu @profile="selectNav('profile')" @feedback="feedbackOpen = true" @logout="logout" />
        </template>
        <a-button v-else-if="isDesktop" @click="authenticate">Войти</a-button>
      </div>
    </header>

    <section v-if="activeNav === 'home' && !isDesktop" class="weather" aria-label="Погода">
      <div class="weather-temperature"><img :src="cloudIcon" alt="" aria-hidden="true" /><span>19°</span></div>
      <i aria-hidden="true"></i>
      <span class="weather-label">Ощущается</span><span>19°</span>
      <i aria-hidden="true"></i>
      <span class="weather-label">Ветер</span><span>5 м/с</span>
    </section>

    <div
      class="content"
      :class="{
        'home-content': activeNav === 'home',
        'desktop-home-content': activeNav === 'home' && isDesktop,
        'requests-content': activeNav === 'requests',
      }"
    >
      <DesktopHome
        v-if="activeNav === 'home' && isDesktop"
        :authenticated="isAuthenticated"
        :services="services"
        :now="now"
        @feedback="feedbackOpen = true"
        @login="authenticate"
        @logout="logout"
        @open-request="(id) => openRequestFromNotification(id, 'home')"
        @open-scanner="scannerOpen = true"
        @open-student-code="studentCodeOpen = true"
        @navigate="selectNav"
      >
        <template v-if="isAuthenticated" #activities>
          <MobileSessionSlider
            v-for="group in activityGroups"
            :key="group.title"
            :title="group.title"
            :items="group.items"
            :now="now"
            desktop
            @open="onSessionClick"
          />
        </template>
      </DesktopHome>

      <template v-else-if="activeNav === 'home'">
        <template v-if="isAuthenticated && showSessionSlider && activityGroups.length">
          <MobileSessionSlider
            v-for="group in activityGroups"
            :key="group.title"
            :title="group.title"
            :items="group.items"
            :now="now"
            @open="onSessionClick"
          />
        </template>
        <EventsEmptyCard
          v-else-if="isAuthenticated"
          @open-info="eventsInfoOpen = true"
        />
        <section class="quick-actions" aria-label="Быстрые действия">
          <button type="button" class="quick-code-card" aria-label="Открыть QR-пропуск" @click="studentCodeOpen = true">
            <div class="code-preview-box">
              <QrCode :text="studentCode" :size="40" :margin="0" :bordered="false" color="#ffffff" label="QR-код пропуска" />
            </div>
            <div class="code-card-text">
              <strong class="code-card-title">QR-пропуск</strong>
              <span class="code-card-subtitle">Код для отметки</span>
            </div>
          </button>
          <div class="quick-stack">
            <button type="button" class="quick-stack-card scanner-card" aria-label="Открыть QR-сканер" @click="scannerOpen = true">
              <span class="quick-icon scanner-icon"><img :src="scannerIcon" alt="" aria-hidden="true" /></span>
              <div class="stack-card-copy">
                <strong>QR-сканер</strong>
              </div>
            </button>
            <button type="button" class="quick-stack-card requests-card" aria-label="Открыть мои заявки" @click="selectNav('requests')">
              <span class="quick-icon requests-icon"><img :src="documentIcon" alt="" aria-hidden="true" /></span>
              <div class="stack-card-copy">
                <strong>Мои заявки</strong>
              </div>
            </button>
          </div>
        </section>

        <section class="services" aria-labelledby="services-title">
          <div class="section-heading">
            <h1 id="services-title">Сервисы</h1>
            <a-button type="link" class="all-services" @click="selectNav('services')">Посмотреть все</a-button>
          </div>

          <div class="service-grid">
            <a-button
              v-for="service in availableServices"
              :key="service.label"
              class="service-card"
              :aria-label="`Открыть сервис «${service.label}»`"
              @click="openService(service.label)"
            >
              <img :src="service.icon" alt="" aria-hidden="true" />
              <span>{{ service.label }}</span>
            </a-button>

            <div v-if="restrictedServices.length" class="service-divider" role="separator">
              <span>Доступно после авторизации</span>
            </div>

            <a-button
              v-for="service in restrictedServices"
              :key="service.label"
              class="service-card"
              @click="openService(service.label)"
            >
              <img :src="service.icon" alt="" aria-hidden="true" />
              <span>{{ service.label }}</span>
            </a-button>
          </div>

          <!-- Персональные плашки по занятиям студента (Figma nodes 1051:1681 и 1051:1751) -->
          <HomeAlertBanners
            v-if="isAuthenticated && (showRatingBanner || showAttendanceBanner)"
            :show-rating="showRatingBanner"
            :show-attendance="showAttendanceBanner"
            @open-rating="ratingSheetOpen = true"
            @open-attendance="attendanceSheetOpen = true"
          />
        </section>

        <section v-if="!isAuthenticated && noticeVisible" class="auth-card" aria-labelledby="auth-title">
          <a-button type="text" class="close-notice" aria-label="Закрыть сообщение" @click="noticeVisible = false">
            <img :src="closeIcon" alt="" aria-hidden="true" />
          </a-button>
          <h2 id="auth-title">Больше возможностей</h2>
          <p>Доступ к заявкам, бронированиям, персональным настройкам и другим сервисам после авторизации</p>
          <a-button type="primary" block class="login-button" @click="authenticate">Войти в аккаунт</a-button>
          <a-button block class="register-button" @click="authenticate">Зарегистрироваться</a-button>
        </section>
      </template>

      <section v-else-if="activeNav === 'services'" class="page-section" aria-labelledby="page-title">
        <a-typography-title id="page-title" :level="3">Сервисы</a-typography-title>
        <a-input
          v-model:value="serviceQuery"
          class="service-search"
          size="large"
          allow-clear
          placeholder="Поиск по сервисам"
          aria-label="Поиск по сервисам"
        >
          <template #prefix><SearchOutlined aria-hidden="true" /></template>
        </a-input>
        <div class="service-list">
          <a-button
            v-for="service in foundServices"
            :key="service.label"
            class="service-list-item"
            @click="openService(service.label)"
          >
            <img :src="service.icon" alt="" aria-hidden="true" />
            <span class="service-list-copy">
              <span class="service-list-name">{{ service.label }}</span>
              <span class="service-list-desc">{{ service.description }}</span>
            </span>
          </a-button>
          <a-divider v-if="foundRestrictedServices.length" orientation="left" :orientation-margin="0" plain class="service-list-divider">
            Доступно после авторизации
          </a-divider>
          <a-button
            v-for="service in foundRestrictedServices"
            :key="service.label"
            class="service-list-item"
            @click="openService(service.label)"
          >
            <img :src="service.icon" alt="" aria-hidden="true" />
            <span class="service-list-copy">
              <span class="service-list-name">{{ service.label }}</span>
              <span class="service-list-desc">{{ service.description }}</span>
            </span>
          </a-button>
        </div>
        <a-empty
          v-if="!foundServices.length && !foundRestrictedServices.length"
          class="services-empty"
          :description="`Ничего не найдено по запросу «${serviceQuery.trim()}»`"
        />
      </section>

      <RequestsPage
        v-else-if="activeNav === 'requests'"
        :authenticated="isAuthenticated"
        :focus-request-id="focusRequestId"
        @login="authenticate"
        @focused="focusRequestId = null"
        @closed="handleRequestClosed"
      />

      <NotificationsPage
        v-else-if="activeNav === 'notifications'"
        :authenticated="isAuthenticated"
        @login="authenticate"
        @open-request="openRequestFromNotification"
        @open-schedule="openService('Расписание')"
      />

      <ProfilePage v-else-if="activeNav === 'profile'" />

      <section v-else class="empty-page" :aria-labelledby="`${activeNav}-title`">
        <h1 :id="`${activeNav}-title`">{{ currentTitle }}</h1>
        <p>Пока здесь пусто.</p>
      </section>

      <p v-if="statusText" class="status" role="status" aria-live="polite">{{ statusText }}</p>
    </div>

    <ScannerFlow v-if="scannerOpen" @close="scannerOpen = false" @open-requests="scannerOpen = false; selectNav('requests')" />
    <FeedbackSheet :open="feedbackOpen" @close="feedbackOpen = false" />
    <StudentCodeSheet :open="studentCodeOpen" @close="studentCodeOpen = false" />
    <ClassStartSheet
      :open="classStartSheetOpen"
      :lesson="currentLesson"
      @close="classStartSheetOpen = false"
      @scan="classStartSheetOpen = false; scannerOpen = true"
    />
    <EventsInfoSheet
      :open="eventsInfoOpen"
      @close="eventsInfoOpen = false"
    />
    <LessonRatingSheet
      :open="ratingSheetOpen"
      @close="ratingSheetOpen = false"
      @submit="handleRatingSubmit"
    />
    <AttendanceWarningSheet
      :open="attendanceSheetOpen"
      @close="attendanceSheetOpen = false"
      @action="handleAttendanceAction"
    />

    <a-modal v-model:open="restrictedServiceOpen" title="Расписание" :footer="null">
      <p>Расписание занятий, аудитории и преподаватели доступны после входа в аккаунт.</p>
      <a-button type="primary" @click="restrictedServiceOpen = false; authenticate()">Войти</a-button>
    </a-modal>
    <aside v-if="isDesktop && isAuthenticated" class="desktop-sidebar" :class="{ collapsed: sidebarCollapsed }" aria-label="Боковая панель">
      <div class="desktop-sidebar-header">
        <div class="desktop-sidebar-brand" :aria-hidden="sidebarCollapsed"><img :src="logo" alt="" /><strong>FEFU One</strong></div>
        <button class="desktop-sidebar-toggle" type="button" :aria-label="sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'" :aria-expanded="!sidebarCollapsed" @click="sidebarCollapsed = !sidebarCollapsed">
          <img :src="panelToggleIcon" alt="" :class="{ rotated: sidebarCollapsed }" />
        </button>
      </div>
      <nav class="desktop-sidebar-nav" aria-label="Основная навигация">
        <button v-for="item in (role === 'system_admin' ? sideNavigation.filter(item => item.id === 'home') : sideNavigation)" :key="item.id" type="button" class="desktop-sidebar-item" :class="{ active: activeNav === item.id }" :aria-current="activeNav === item.id ? 'page' : undefined" :title="sidebarCollapsed ? item.label : undefined" @click="selectNav(item.id)">
          <img :src="item.icon" alt="" /><span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </button>
        <AdminSidebarSections v-if="role === 'system_admin'" :collapsed="sidebarCollapsed" @expand="sidebarCollapsed = false" />
      </nav>
      <div class="desktop-sidebar-footer">
        <div v-if="!sidebarCollapsed" class="sidebar-theme-selector" role="group" aria-label="Тема оформления">
          <button type="button" :class="{ selected: themeMode === 'light' }" :aria-pressed="themeMode === 'light'" title="Светлая тема" aria-label="Светлая тема" @click="themeMode = 'light'"><SidebarThemeIcon mode="light" /></button>
          <button type="button" :class="{ selected: themeMode === 'dark' }" :aria-pressed="themeMode === 'dark'" title="Тёмная тема" aria-label="Тёмная тема" @click="themeMode = 'dark'"><SidebarThemeIcon mode="dark" /></button>
          <button type="button" :class="{ selected: themeMode === 'system' }" :aria-pressed="themeMode === 'system'" title="Системная тема" aria-label="Системная тема" @click="themeMode = 'system'"><SidebarThemeIcon mode="system" /></button>
        </div>
        <button v-else type="button" class="sidebar-theme-cycle" title="Сменить тему" aria-label="Сменить тему" @click="cycleTheme"><SidebarThemeIcon :mode="themeMode" /></button>
      </div>
    </aside>
    <nav v-if="!isDesktop || (!isAuthenticated && activeNav !== 'home')" class="bottom-nav" aria-label="Основная навигация">
      <a-button
        v-for="item in sideNavigation"
        :key="item.id"
        type="text"
        class="nav-item"
        :class="{ active: activeNav === item.id }"
        :aria-current="activeNav === item.id ? 'page' : undefined"
        :aria-label="item.id === 'notifications' && unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : undefined"
        @click="selectNav(item.id)"
      >
        <span class="nav-icon">
          <img :src="item.icon" alt="" aria-hidden="true" />
          <span v-if="item.id === 'notifications' && unreadCount" class="nav-badge" aria-hidden="true"></span>
        </span>
        <span>{{ item.label }}</span>
      </a-button>
    </nav>
  </main>
</template>
