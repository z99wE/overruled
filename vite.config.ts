import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);

/**
 * pdfjs needs the standard-14 font metrics and the CJK character maps to read
 * documents that do not embed their fonts — which is most Word-generated legal
 * PDFs. Without them, text extraction silently degrades. Both are copied out of
 * node_modules at build time and self-hosted, so no third-party CDN is involved.
 */
function pdfjsAssets(): Plugin {
  const dirs: Array<[string, string]> = [
    ['standard_fonts', 'standard_fonts'],
    ['cmaps', 'cmaps'],
  ];
  let outDir = 'dist';
  return {
    name: 'pdfjs-assets',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      for (const [src, dest] of dirs) {
        let from: string;
        try {
          from = dirname(require.resolve(`pdfjs-dist/package.json`));
        } catch {
          return;
        }
        const srcDir = join(from, src);
        if (!existsSync(srcDir)) continue;
        cpSync(srcDir, join(outDir, dest), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdfjsAssets()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
