import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  root: path.resolve(__dirname, './frontend'),
  envDir: path.resolve(__dirname, '.'),
  plugins: [
    react(), 
    tailwindcss(),
    // Plugin to copy ONNX runtime WASM files to dist
    {
      name: 'copy-onnx-wasm',
      writeBundle() {
        const sourceDir = path.resolve(__dirname, 'node_modules/onnxruntime-web/dist')
        const targetDir = path.resolve(__dirname, 'dist')
        
        if (fs.existsSync(sourceDir)) {
          // Copy all WASM files (including variants like .jsep.wasm)
          const allFiles = fs.readdirSync(sourceDir)
          const wasmFiles = allFiles.filter(f => f.endsWith('.wasm'))
          const mjsFiles = allFiles.filter(f => f.endsWith('.mjs') && f.includes('ort'))
          
          const filesToCopy = [...wasmFiles, ...mjsFiles]
          
          filesToCopy.forEach(file => {
            const source = path.join(sourceDir, file)
            const target = path.join(targetDir, file)
            try {
              fs.copyFileSync(source, target)
              const stats = fs.statSync(target)
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
              console.log(`✅ Copied ${file} (${sizeInMB} MB)`)
            } catch (err) {
              console.error(`❌ Failed to copy ${file}:`, err)
            }
          })
          
          console.log(`📦 Total ONNX files copied: ${filesToCopy.length}`)
        } else {
          console.error('❌ ONNX Runtime Web source directory not found!')
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0, // Don't inline WASM files
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          if (id.includes('framer-motion')) {
            return 'motion-vendor';
          }

          if (id.includes('@dnd-kit') || id.includes('sortablejs')) {
            return 'dnd-vendor';
          }

          if (id.includes('html5-qrcode') || id.includes('qrcode') || id.includes('react-qr-code')) {
            return 'qr-vendor';
          }

          if (id.includes('i18next')) {
            return 'i18n-vendor';
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          if (id.includes('@n8n/chat')) {
            return 'n8n-chat-vendor';
          }
        },
      },
    },
  },
  // Configure server to properly handle WASM files
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  // Configure preview server (for npm run preview)
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  // Optimize deps to include onnxruntime-web
  optimizeDeps: {
    exclude: ['onnxruntime-web'], // Don't pre-bundle, needs WASM files
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, './frontend/src/test/setup.ts'),
    exclude: ['frontend lama/**', 'frontend baru/**', '**/node_modules/**', '**/dist/**'],
  }
})
