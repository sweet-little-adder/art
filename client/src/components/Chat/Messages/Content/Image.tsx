import React, { useState, useRef, useMemo } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { cn, scaleImage } from '~/utils';
import DialogImage from './DialogImage';
import { Skeleton } from '~/components';

// Utility function to proxy external image URLs to avoid CORS issues
const getProxiedImageUrl = (url: string): string => {
  if (url.startsWith('http') && (url.includes('fal.media') || url.includes('cdn.fal.ai') || url.includes('files.fal.ai'))) {
    const encodedUrl = encodeURIComponent(url);
    return `/api/proxy-images?url=${encodedUrl}`;
  }
  return url;
};

const Image = ({
  imagePath,
  altText,
  height,
  width,
  placeholderDimensions,
  className,
  args,
}: {
  imagePath: string;
  altText: string;
  height: number;
  width: number;
  placeholderDimensions?: {
    height?: string;
    width?: string;
  };
  className?: string;
  args?: {
    prompt?: string;
    quality?: 'low' | 'medium' | 'high';
    size?: string;
    style?: string;
    [key: string]: unknown;
  };
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = () => setIsLoaded(true);

  const { width: scaledWidth, height: scaledHeight } = useMemo(
    () =>
      scaleImage({
        originalWidth: Number(placeholderDimensions?.width?.split('px')[0] ?? width),
        originalHeight: Number(placeholderDimensions?.height?.split('px')[0] ?? height),
        containerRef,
      }),
    [placeholderDimensions, height, width],
  );

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = altText;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={containerRef}>
      <div
        className={cn(
          'relative mt-1 flex h-auto w-full max-w-lg items-center justify-center overflow-hidden rounded-lg border border-border-light text-text-secondary-alt shadow-md',
          className,
        )}
      >
        <button
          type="button"
          aria-label={`View ${altText} in dialog`}
          onClick={() => setIsOpen(true)}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LazyLoadImage
            alt={altText}
            onLoad={handleImageLoad}
            visibleByDefault={true}
            className={cn(
              'opacity-100 transition-opacity duration-100',
              isLoaded ? 'opacity-100' : 'opacity-0',
            )}
            src={getProxiedImageUrl(imagePath)}
            style={{
              width: `${scaledWidth}`,
              height: 'auto',
              color: 'transparent',
              display: 'block',
            }}
            placeholder={
              <Skeleton
                className={cn('h-auto w-full', `h-[${scaledHeight}] w-[${scaledWidth}]`)}
                aria-label="Loading image"
                aria-busy="true"
              />
            }
          />
        </button>
        {isLoaded && (
          <DialogImage
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            src={getProxiedImageUrl(imagePath)}
            downloadImage={downloadImage}
            args={args}
          />
        )}
      </div>
    </div>
  );
};

export default Image;
