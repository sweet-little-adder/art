import { Search } from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, OGDialog } from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import { useLocalize } from '~/hooks';

interface MockupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { apiKey: string }) => void;
  triggerRef?: RefObject<HTMLInputElement>;
  onImageSelect?: (url: string) => void;
}

interface ImageMetadata {
  id: string;
  type: 'easy';
  index: number;
  url: string;
  description: string;
  tags: string[];
}

export default function MockupDialog({
  isOpen,
  onOpenChange,
  triggerRef,
  onImageSelect,
}: MockupDialogProps) {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/stock-images/search?query=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to search images');
      }

      const data = await response.json();
      if (data.success) {
        setImages(data.results);
      } else {
        throw new Error(data.error || 'Failed to search images');
      }
    } catch (err) {
      console.error('Error searching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to search images');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        searchImages();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isOpen, searchImages]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stock-images/search', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const data = await response.json();
      if (data.success) {
        setImages(data.results);
      } else {
        throw new Error(data.error || 'Failed to load images');
      }
    } catch (err) {
      console.error('Error loading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OGDialog open={isOpen} onOpenChange={onOpenChange} triggerRef={triggerRef}>
      <OGDialogTemplate
        className="3xl:max-h-[calc(100svh - 300px)] my-auto max-h-[calc(100svh-50px)] w-11/12 overflow-y-auto md:min-w-[800px] md:max-w-[1250px]"
        title=""
        showCloseButton={true}
        showCancelButton={false}
        main={
          <div className="scrollbar-hide space-y-4 overflow-hidden">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">{localize('com_assistants_stock')}</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={localize('com_ui_search_by_keywords')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4"
              />
            </div>
            <div className="min-h-[70vh]">
              {error && (
                <div className="py-4 text-center text-red-500 dark:text-red-400">
                  <p>{error}</p>
                  <button
                    onClick={loadImages}
                    className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                  >
                    {localize('com_ui_try_different_keywords')}
                  </button>
                </div>
              )}
              {isLoading && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Searching for images...' : 'Loading images...'}
                  </p>
                </div>
              )}
              {!isLoading && !error && (
                <div
                  className="scrollbar-hide grid max-h-[70vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((image) => (
                    <div key={image.id} className="group h-full w-full overflow-hidden rounded-lg">
                      <img
                        src={image.url}
                        alt={image.description}
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-200 group-hover:scale-110"
                        onClick={() => {
                          onImageSelect && onImageSelect(image.url);
                        }}
                        title={image.description}
                      />
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && !error && images.length === 0 && searchQuery && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>
                    {localize('com_ui_no_images_found')} &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-sm">{localize('com_ui_try_different_keywords')}</p>
                </div>
              )}
            </div>
          </div>
        }
      />
    </OGDialog>
  );
}
