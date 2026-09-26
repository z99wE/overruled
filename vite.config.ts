import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
          from = dirname(require.resolve('pdfjs-dist/package.json'));
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

/**
 * Stamp the service-worker cache with a content hash of the emitted assets.
 * A hand-maintained version string is a footgun: forget to bump it after a
 * deploy and returning clients keep a stale shell. Deriving it removes the
 * manual step entirely and keeps the cache honest with zero runtime cost.
 */
function swBuildId(): Plugin {
  let outDir = 'dist';
  return {
    name: 'sw-build-id',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const swPath = join(outDir, 'sw.js');
      if (!existsSync(swPath)) return;
      const assetsDir = join(outDir, 'assets');
      const parts = existsSync(assetsDir)
        ? readdirSync(assetsDir)
            .sort()
            .map((f) => `${f}:${statSync(join(assetsDir, f)).size}`)
        : ['no-assets'];
      const id = createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
      const src = readFileSync(swPath, 'utf8');
      writeFileSync(swPath, src.replace('__BUILD_ID__', id));
      console.log(`  sw.js cache -> overrool-${id}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdfjsAssets(), swBuildId()],
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
