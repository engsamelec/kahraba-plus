import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
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
    // Filenames are content-hashed, so they can be cached forever while
    // index.html (unhashed) is always revalidated — see Flask cache headers.
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split heavy vendor libs into their own cacheable chunks so the
        // initial app payload stays small.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
})
