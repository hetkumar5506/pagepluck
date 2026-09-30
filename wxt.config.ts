import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'PagePluck — Web Asset & Design Token Exporter',
    description:
      'Extract images, inline SVGs, CSS backgrounds, color palettes, and fonts from any website directly into the Chrome side panel. 100% local.',
    permissions: ['downloads', 'sidePanel'],
    host_permissions: ['<all_urls>'],
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' },
    action: {
      default_title: 'Open PagePluck (Asset & Token Exporter)',
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png' },
    },
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
