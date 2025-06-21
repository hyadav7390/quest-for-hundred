import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // point all `import 'buffer'` to the shim
      buffer: 'buffer/'
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // make sure `global` becomes `globalThis`
      define: { global: 'globalThis' },
      plugins: [
        // polyfill `process`, `Buffer`, etc.
        NodeGlobalsPolyfillPlugin({ buffer: true })
      ]
    }
  }
}));
