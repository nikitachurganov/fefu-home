import { createApp, h } from 'vue'
import Antd, { ConfigProvider, theme } from 'ant-design-vue'
import { isDark } from './data/theme'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import './styles.css'

createApp({
  render: () => h(ConfigProvider, { theme: { algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm, token: { fontFamily: 'Inter, Arial, sans-serif' } } }, () => h(App)),
}).use(Antd).mount('#app')
