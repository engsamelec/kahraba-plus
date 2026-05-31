import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Kahraba Plus | كهربا بلس",
        short_name: "Kahraba+",
        description:
          "متجر كهربا بلس للإلكترونيات والقطع الكهربائية — Kahraba Plus electronics store",
        lang: "ar",
        dir: "rtl",
        theme_color: "#1e293b",
        background_color: "#1e293b",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Don't precache the SPA fallback for API calls; let them hit network.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/products"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "products-cache" },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://images.unsplash.com",
            handler: "CacheFirst",
            options: {
              cacheName: "product-images",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Standard dist/ — consumed by Capacitor (webDir) and served by Flask.
    outDir: "dist",
    emptyOutDir: true,
  },
})
