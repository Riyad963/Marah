
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // تم دمج المفتاح هنا لضمان تفعيل ميزات الذكاء الاصطناعي فوراً وبشكل مخفي
  const AI_KEY = "AIzaSyDNV4-hBS9uxUO_P4liUZr-gFWIahl3NjM";
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || AI_KEY),
      'process.env': JSON.stringify({})
    }
  }
})
