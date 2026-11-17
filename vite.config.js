import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Dev only: the lazily-loaded map page made Vite pre-bundle react-leaflet
  // with its own React copy → "Invalid hook call" on /geo. Force one React.
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: { include: ["react-leaflet", "leaflet"] },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.svg"],

      manifest: {
        name: "Graffiti Vendor App",
        short_name: "VendorApp",
        description: "Offline-first vendor submission app",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",

        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
              },
            },
          },
          {
            urlPattern: /\/Vendor\/dashboard\.php/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});