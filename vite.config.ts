import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages 배포 시 VITE_BASE=/<저장소명>/ 로 지정한다.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "김항철 academy",
        description: "김항철 academy 수업 스케줄·공지·변경 요청",
        lang: "ko",
        short_name: "김항철 academy",
        display: "standalone",
        start_url: base,
        scope: base,
        theme_color: "#1b1b1b",
        background_color: "#f1f1f1",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          // 바탕이 꽉 차 있고 그림이 가운데 80% 안에 있어 원형·둥근 사각으로 잘려도 된다
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // 에뮬레이터가 필요한 테스트(src/data)는 npm run test:emu 에서만 돈다.
    exclude: process.env.FIRESTORE_EMULATOR_HOST
      ? ["node_modules/**", "dist/**"]
      : ["node_modules/**", "dist/**", "src/data/**"],
  },
});
