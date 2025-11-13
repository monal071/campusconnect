import Image from "next/image";
import { useState } from "react";

/**
 * Optimized Image Component with fallback and blur placeholder
 * Replaces all <img> tags throughout the app
 */
export default function OptimizedImage({
  src,
  alt = "",
  width,
  height,
  className = "",
  priority = false,
  quality = 75,
  objectFit = "cover",
  fallbackSrc = "/default-avatar.png",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Handle image load error
  const handleError = () => {
    setImgSrc(fallbackSrc);
  };

  // Handle image load complete
  const handleLoad = () => {
    setIsLoading(false);
  };

  // If no src, use fallback immediately
  if (!src) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        onError={handleError}
        onLoadingComplete={handleLoad}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{ objectFit }}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Avatar Image Component (circular, optimized)
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = "",
  priority = false,
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      priority={priority}
      quality={90}
      fallbackSrc="/default-avatar.png"
    />
  );
}

/**
 * Post/Resource Image Component (responsive)
 */
export function ContentImage({ src, alt, className = "", priority = false }) {
  return (
    <div className={`relative w-full aspect-video ${className}`}>
      <Image
        src={src || "/placeholder.png"}
        alt={alt}
        fill
        priority={priority}
        quality={80}
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

/**
 * Thumbnail Image Component (small, low quality)
 */
export function ThumbnailImage({ src, alt, size = 64, className = "" }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded ${className}`}
      quality={60}
      fallbackSrc="/placeholder.png"
    />
  );
}
