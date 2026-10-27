import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// In development the API is reached through this proxy, so the browser sees one origin and the
// SameSite=Strict session cookie just works. API_PROXY_TARGET points at the running .NET API.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 8080,
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:5285', changeOrigin: true },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
