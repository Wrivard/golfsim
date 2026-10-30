import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';

/**
 * Vite plugin that updates og:image and twitter:image meta tags
 * to point to the app's opengraph image with the correct Replit domain.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-meta-images',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const baseUrl = getDeploymentUrl();
        if (!baseUrl) {
          log('[meta-images] no Replit deployment domain found, skipping meta tag updates');
          return html;
        }

        const imageUrl = getOpenGraphImageUrl(baseUrl);
        if (!imageUrl) {
          log('[meta-images] OpenGraph image not found, skipping meta tag updates');
          return html;
        }

        log('[meta-images] updating meta image tags to:', imageUrl);
        return rewriteMetaImageUrls(html, imageUrl);
      },
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const baseUrl = getDeploymentUrl();
        if (!baseUrl) return;

        const imageUrl = getOpenGraphImageUrl(baseUrl);
        if (!imageUrl) {
          log('[meta-images] OpenGraph image not found, skipping emitted HTML updates');
          return;
        }

        for (const asset of Object.values(bundle)) {
          if (asset.type !== 'asset' || !asset.fileName.endsWith('.html')) continue;
          asset.source = rewriteMetaImageUrls(String(asset.source), imageUrl);
        }
      },
    },
  };
}

function getOpenGraphImageUrl(baseUrl: string): string | null {
  const publicDir = path.resolve(import.meta.dirname, 'public');
  const imageExt = ['png', 'jpg', 'jpeg'].find((ext) =>
    fs.existsSync(path.join(publicDir, `opengraph.${ext}`))
  );
  if (!imageExt) return null;

  const imagePath = path.join(publicDir, `opengraph.${imageExt}`);
  const imageVersion = createHash('sha256')
    .update(fs.readFileSync(imagePath))
    .digest('hex')
    .slice(0, 12);
  return `${baseUrl}/opengraph.${imageExt}?v=${imageVersion}`;
}

function rewriteMetaImageUrls(html: string, imageUrl: string): string {
  return html
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
      `<meta property="og:image" content="${imageUrl}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
      `<meta name="twitter:image" content="${imageUrl}" />`
    );
}

function getDeploymentUrl(): string | null {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const url = `https://${process.env.REPLIT_INTERNAL_APP_DOMAIN}`;
    log('[meta-images] using internal app domain:', url);
    return url;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    log('[meta-images] using dev domain:', url);
    return url;
  }

  return null;
}

function log(...args: any[]): void {
  if (process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
}
