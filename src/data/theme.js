import { computed, ref, watch } from 'vue'

const stored = localStorage.getItem('fefu-theme-pref')
export const themeMode = ref(['light', 'dark', 'system'].includes(stored) ? stored : 'light')
const systemQuery = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(systemQuery.matches)
systemQuery.addEventListener('change', (event) => { systemDark.value = event.matches })
export const isDark = computed(() => themeMode.value === 'system' ? systemDark.value : themeMode.value === 'dark')
watch(isDark, (dark) => { document.documentElement.classList.toggle('dark', dark) }, { immediate: true })
watch(themeMode, (mode) => { localStorage.setItem('fefu-theme-pref', mode) })
export function cycleTheme() {
  const modes = ['light', 'dark', 'system']
  themeMode.value = modes[(modes.indexOf(themeMode.value) + 1) % modes.length]
}
