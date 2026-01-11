import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/jobs',
          dest: 'assets'
        },
        {
          src: 'assets/pdf',
          dest: 'assets'
        },
        {
          src: 'assets/docs',
          dest: 'assets'
        },
        {
          src: 'api', // Functionality relying on local API folder if any
          dest: ''
        },
        { 
          // Copy legacy JS if needed, or we refactor it all. 
          // For now, copying to ensure old scripts work if referenced.
          src: 'assets/js',
          dest: 'assets'
        },
        {
          src: 'CNAME',
          dest: ''
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        job: path.resolve(__dirname, 'job.html'),
        notFound: path.resolve(__dirname, '404.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
});
