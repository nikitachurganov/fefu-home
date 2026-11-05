import { onBeforeUnmount, ref } from 'vue'

// Реактивное совпадение с медиазапросом — по нему App выбирает мобильную или ПК-раскладку главной.
export function useMediaQuery(query) {
  const list = window.matchMedia(query)
  const matches = ref(list.matches)
  const update = (event) => { matches.value = event.matches }
  list.addEventListener('change', update)
  onBeforeUnmount(() => list.removeEventListener('change', update))
  return matches
}
