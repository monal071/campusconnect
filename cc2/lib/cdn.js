/**
 * CDN Utilities for static asset delivery
 */

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ZONE = process.env.CLOUDFLARE_ZONE_ID;

/**
 * Get CDN URL for static assets
 */
export function getCDNUrl(path) {
  if (!CDN_URL) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${CDN_URL}/${cleanPath}`;
}

/**
 * Get image URL with CDN and optimization
 */
export function getImageUrl(src, { width, quality = 75, format = 'auto' } = {}) {
  if (!src) return null;
  
  // External images
  if (src.startsWith('http')) {
    return src;
  }
  
  // Use CDN if configured
  const baseUrl = CDN_URL || '';
  const imagePath = src.startsWith('/') ? src : `/${src}`;
  
  // Cloudflare Image Resizing
  if (CLOUDFLARE_ACCOUNT && width) {
    return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT}${imagePath}/w=${width},q=${quality},f=${format}`;
  }
  
  return `${baseUrl}${imagePath}`;
}

/**
 * Purge CDN cache for specific URLs
 */
export async function purgeCDNCache(urls) {
  if (!CLOUDFLARE_ZONE || !process.env.CLOUDFLARE_API_TOKEN) {
    console.warn('CDN purge not configured');
    return false;
  }
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: urls }),
      }
    );
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('CDN purge error:', error);
    return false;
  }
}

/**
 * Purge entire CDN cache
 */
export async function purgeAllCDNCache() {
  if (!CLOUDFLARE_ZONE || !process.env.CLOUDFLARE_API_TOKEN) {
    console.warn('CDN purge not configured');
    return false;
  }
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purge_everything: true }),
      }
    );
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('CDN purge all error:', error);
    return false;
  }
}

/**
 * Preload critical assets
 */
export function preloadAssets(assets) {
  if (typeof window === 'undefined') return;
  
  assets.forEach(({ src, as = 'image', type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = getCDNUrl(src);
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove('lazy');
        observer.unobserve(lazyImage);
      }
    });
  });
  
  observer.observe(img);
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(src, widths = [320, 640, 960, 1280, 1920]) {
  return widths
    .map((width) => `${getImageUrl(src, { width })} ${width}w`)
    .join(', ');
}

/**
 * CDN configuration for different file types
 */
export const cdnConfig = {
  images: {
    formats: ['webp', 'avif', 'jpg', 'png'],
    qualities: {
      low: 40,
      medium: 75,
      high: 90,
    },
    sizes: [320, 640, 960, 1280, 1920, 2560],
  },
  videos: {
    maxSize: 50 * 1024 * 1024, // 50MB
    formats: ['mp4', 'webm'],
  },
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
  },
};

export default {
  getCDNUrl,
  getImageUrl,
  purgeCDNCache,
  purgeAllCDNCache,
  preloadAssets,
  lazyLoadImage,
  generateSrcSet,
  cdnConfig,
};
