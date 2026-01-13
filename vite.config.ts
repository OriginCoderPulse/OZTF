import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from 'path'
import vueJsxPlugin from "@vitejs/plugin-vue-jsx";

const host = process.env.TAURI_DEV_HOST;


export default defineConfig(async () => ({
  plugins: [vue(), vueJsxPlugin({
    transformOn: true,
    mergeProps: true
  })],

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@Component': path.resolve(__dirname, './src/Components'),
      '@Form': path.resolve(__dirname, './src/Components/FormBuilder'),
    }
  }
}));
