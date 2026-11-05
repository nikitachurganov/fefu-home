<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { QrcodeOutlined, SearchOutlined } from '@ant-design/icons-vue'
import DesktopHome from './components/DesktopHome.vue'
import RequestsPage from './components/RequestsPage.vue'
import NotificationsPage from './components/NotificationsPage.vue'
import ProfilePage from './components/ProfilePage.vue'
import ScannerFlow from './components/scanner/ScannerFlow.vue'
import FeedbackSheet from './components/FeedbackSheet.vue'
import StudentCodeSheet from './components/StudentCodeSheet.vue'
import QrCode from './components/widgets/QrCode.vue'
import { studentCode } from './data/campus'
import NotificationsPopover from './components/NotificationsPopover.vue'
import { unreadCount } from './data/notificationStore'
import { useMediaQuery } from './composables/useMediaQuery'
import logo from './assets/figma/logo.png'
import scannerIcon from './assets/figma/scanner.svg'
import helpIcon from './assets/figma/help.svg'
import cloudIcon from './assets/figma/cloud.svg'
import quickScanIcon from './assets/figma/quick-scan.svg'
import mapIcon from './assets/figma/map.svg'
import busIcon from './assets/figma/bus.svg'
import educationIcon from './assets/figma/education.svg'
import calendarIcon from './assets/figma/calendar.svg'
import rentIcon from './assets/figma/rent.svg'
import eventsIcon from './assets/figma/events.svg'
import closeIcon from './assets/figma/close.svg'
import homeIcon from './assets/figma/home.svg'
import gridIcon from './assets/figma/grid.svg'
import documentIcon from './assets/figma/document.svg'
import alertIcon from './assets/figma/alert.svg'
import profileIcon from './assets/figma/profile.svg'

const noticeVisible = ref(true)
const activeNav = ref('home')
const isAuthenticated = ref(false)
const statusText = ref('')
const serviceQuery = ref('')
const scannerOpen = ref(false)
const studentCodeOpen = ref(false)
const feedbackOpen = ref(false)
// Заявка, которую нужно открыть после перехода из уведомления.
const focusRequestId = ref(null)
// С 1024px главная собирается из виджетов (DesktopHome); граница совпадает с ПК-стилями в styles.css.
const isDesktop = useMediaQuery('(min-width: 1024px)')
// Камера есть только на телефоне: при смене раскладки сканер закрываем, чтобы он не открылся снова при возврате.
watch(isDesktop, () => { scannerOpen.value = false })

// Временный набор данных для демонстрации личного кабинета.
const services = [
  { label: 'Карта', description: 'Корпуса, общежития и маршруты по кампусу', icon: mapIcon },
  { label: 'Шаттлы', description: 'Маршруты и расписание автобусов', icon: busIcon },
  { label: 'Расписание', description: 'Занятия, аудитории и преподаватели', icon: educationIcon, requiresAuth: true },
  { label: 'Мероприятия', description: 'Афиша событий ДВФУ', icon: eventsIcon, requiresAuth: true },
  { label: 'Бронирование', description: 'Оборудование, рабочие места и помещения', icon: calendarIcon, requiresAuth: true },
  { label: 'Аренда', description: 'Инвентарь и переносное оборудование', icon: rentIcon, requiresAuth: true },
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
// Уведомления в шапке — поповер (NotificationsPopover), поэтому в цикле остаётся только профиль.
const headerNavigation = navigation.filter((item) => item.id === 'profile')
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
  noticeVisible.value = false
  statusText.value = ''
}

function openRequestFromNotification(id) {
  focusRequestId.value = id
  selectNav('requests')
}

function openService(label) {
  const text = `${label}: демо-раздел пока находится в разработке.`
  // На ПК строка статуса внизу длинной главной не видна — показываем всплывающее сообщение.
  if (isDesktop.value) message.info(text)
  else statusText.value = text
}
</script>

<template>
  <main class="screen" aria-label="FEFU One">
    <header class="app-header">
      <div class="brand">
        <img :src="logo" alt="Логотип FEFU One" class="brand-logo" />
        <span>FEFU One</span>
      </div>

      <div class="header-actions">
        <a-button v-if="!isDesktop" type="text" class="header-button" aria-label="Открыть QR-сканер" @click="scannerOpen = true">
          <img :src="scannerIcon" alt="" aria-hidden="true" />
        </a-button>
        <a-button type="text" class="header-button" aria-label="Обратная связь" @click="feedbackOpen = true">
          <img :src="helpIcon" alt="" aria-hidden="true" />
        </a-button>
        <!-- На ПК уведомления и профиль живут в шапке, а не в боковом меню. -->
        <template v-if="isDesktop">
          <NotificationsPopover
            :active="activeNav === 'notifications'"
            @open-request="openRequestFromNotification"
            @open-schedule="openService('Расписание')"
            @open-all="selectNav('notifications')"
          />
          <a-button
            v-for="item in headerNavigation"
            :key="item.id"
            type="text"
            class="header-button header-nav"
            :class="{ active: activeNav === item.id }"
            :aria-label="item.id === 'notifications' && unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : item.label"
            :aria-current="activeNav === item.id ? 'page' : undefined"
            @click="selectNav(item.id)"
          >
            <span class="header-nav-icon">
              <img :src="item.icon" alt="" aria-hidden="true" />
              <span v-if="item.id === 'notifications' && unreadCount" class="header-nav-badge" aria-hidden="true"></span>
            </span>
          </a-button>
        </template>
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
        @login="authenticate"
        @open-request="openRequestFromNotification"
        @open-schedule="openService('Расписание')"
        @open-service="openService"
        @open-scanner="scannerOpen = true"
        @open-student-code="studentCodeOpen = true"
        @navigate="selectNav"
      />

      <template v-else-if="activeNav === 'home'">
        <section class="quick-actions" aria-label="Быстрые действия">
          <button type="button" class="quick-code-card" aria-label="Открыть код для отметки на парах" @click="studentCodeOpen = true">
            <div class="code-preview-box">
              <QrCode :text="studentCode" :size="100" :margin="0" :bordered="false" color="#ffffff" label="QR-код пропуска" />
            </div>
            <span class="code-card-label">Код для отметки<br />на парах</span>
          </button>
          <div class="quick-stack">
            <button type="button" class="quick-stack-card scanner-card" aria-label="Открыть QR-сканер" @click="scannerOpen = true">
              <span class="quick-icon scanner-icon"><img :src="quickScanIcon" alt="" aria-hidden="true" /></span>
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
              disabled
            >
              <img :src="service.icon" alt="" aria-hidden="true" />
              <span>{{ service.label }}</span>
            </a-button>
          </div>
        </section>

        <section v-if="!isAuthenticated && noticeVisible" class="auth-card" aria-labelledby="auth-title">
          <a-button type="text" class="close-notice" aria-label="Закрыть сообщение" @click="noticeVisible = false">
            <img :src="closeIcon" alt="" aria-hidden="true" />
          </a-button>
          <h2 id="auth-title">После входа доступно больше сервисов</h2>
          <p>В личном кабинете доступны заявки, бронирования, расписание, мероприятия и шаттлы.</p>
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
            disabled
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

    <nav class="bottom-nav" aria-label="Основная навигация">
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
