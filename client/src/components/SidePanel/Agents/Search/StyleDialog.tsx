import { Search } from 'lucide-react';
import { MeiliSearch } from 'meilisearch';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input, OGDialog } from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import { useLocalize } from '~/hooks';

interface StyleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { apiKey: string }) => void;
  triggerRef?: RefObject<HTMLInputElement>;
  onStyleSelect?: (url: string, styleName: string) => void;
}

interface StyleMetadata {
  id: string;
  nameKey: string;
  url: string;
  description: string;
  tags: string[];
  category: string;
}

// Initialize Meilisearch client
const meilisearchClient = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_KEY || '',
});

export default function StyleDialog({
  isOpen,
  onOpenChange,
  triggerRef,
  onStyleSelect,
}: StyleDialogProps) {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<StyleMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [meilisearchResults, setMeilisearchResults] = useState<StyleMetadata[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/styles-images/search?query=${encodeURIComponent(searchQuery)}`,
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

  const styleCategories = useCallback(() => {
    return [
      { id: 'all', name: localize('com_ui_category_all') },
      { id: 'minimalist', name: localize('com_ui_category_minimalist') },
      { id: 'modern', name: localize('com_ui_category_modern') },
      { id: 'vintage', name: localize('com_ui_category_vintage') },
      { id: 'artistic', name: localize('com_ui_category_artistic') },
      { id: 'professional', name: localize('com_ui_category_professional') },
      { id: 'creative', name: localize('com_ui_category_creative') },
      { id: 'elegant', name: localize('com_ui_category_elegant') },
      { id: 'cartoon', name: localize('com_ui_category_cartoon') },
    ];
  }, []);
  const styleImages = useCallback(() => {
    return [
      {
        id: '1',
        name: localize('com_ui_style_studio_shot'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fstudioshot.jpg?alt=media&token=9ef59e32-c559-4eeb-9c90-380cf953b63d',
        description: 'Studio shot',
        tags: ['minimalist', 'clean', 'simple'],
        category: 'professional',
      },
      {
        id: '3',
        name: localize('com_ui_style_pixel_art'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fpixelart.jpg?alt=media&token=6739fdff-cc17-4ed2-b884-a5151adf11c9',
        description: 'Pixel art',
        tags: ['vintage', 'paper', 'texture'],
        category: 'vintage',
      },
      {
        id: '4',
        name: localize('com_ui_style_3d_cartoon'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2F3D_cartoon.png?alt=media&token=798c528a-9c45-49ae-bd4c-d52ed5b4b82d',
        description: '3D cartoon',
        tags: ['abstract', 'art', 'creative'],
        category: 'cartoon',
      },
      {
        id: '5',
        name: localize('com_ui_style_pencil_color'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fpencilcolor.png?alt=media&token=6b6dbb18-fdb0-49a3-9b32-d3a1f88b4f0b',
        description: 'Pencil color',
        tags: ['professional', 'dark', 'business'],
        category: 'artistic',
      },
      {
        id: '6',
        name: localize('com_ui_style_pencil_art'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fpencilart.jpg?alt=media&token=b4ae43e6-d735-424b-b478-fde93f219825',
        description: 'Pencil art',
        tags: ['nature', 'green', 'forest'],
        category: 'artistic',
      },
      {
        id: '7',
        name: localize('com_ui_style_retro'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fretro.jpg?alt=media&token=8029386b-ccd4-411b-b90b-9c5d4331a703',
        description: 'Retro',
        tags: ['elegant', 'luxury', 'gold'],
        category: 'vintage',
      },
      {
        id: '10',
        name: localize('com_ui_style_80s_retrogrid'),
        url: 'https://ugricruidisirwkjayzw.supabase.co/storage/v1/object/public/JoJo%20Ventures%20-%20Website/Ø%20Chat/Styles/vintage_retrogrid.png',
        description: '80s retrogrid graphic design',
        tags: ['tech', 'digital', 'blue'],
        category: 'vintage',
      },
      {
        id: '11',
        name: localize('com_ui_style_retro_80s'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FzPX0duSREfYK22JtbqcNZ_304528ca709f446b8851847bf6510355.jpg?alt=media&token=5dd491c1-2a44-416f-92d3-32edad88cd69',
        description: 'Retro 80s vintage',
        tags: ['retro', '80s', 'vintage'],
        category: 'vintage',
      },
      {
        id: '13',
        name: localize('com_ui_style_cartoon_fun'),
        url: 'https://ugricruidisirwkjayzw.supabase.co/storage/v1/object/public/JoJo%20Ventures%20-%20Website/Ø%20Chat/Styles/Cartoon%20Fun/cartoonfun_girl.png',
        description: 'Fun cartoon game ready',
        tags: ['cartoon', 'fun', 'game'],
        category: 'cartoon',
      },
      {
        id: '14',
        name: localize('com_ui_style_product_photography'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FStudio-shot%2C%20product%20photography%2C%20clean%20background%2C%20precise%20lighting%2C%20floating%20composition%2C%20high%20resolution%2C%20soft%20shadows%2C%20minimalist%20aesthetic.jpg?alt=media&token=d577acc5-af23-46c8-85f7-3358fe510610',
        description:
          'Studio-shot, product photography, clean background, precise lighting, floating composition, high resolution, soft shadows, minimalist aesthetic',
        tags: ['vintage', 'sepia', 'retro'],
        category: 'vintage',
      },
      {
        id: '16',
        name: localize('com_ui_style_commercial_photography'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FArtofproduct%20style%2C%20clean%20studio%20shot%2C%20minimalist%20composition%2C%20commercial%20photography%2C%20high%20resolution.jpg?alt=media&token=bda352c1-5791-451a-99bf-5f2ab14f6e4c',
        description:
          'Artofproduct style, clean studio shot, minimalist composition, commercial photography, high resolution',
        tags: ['elegant', 'marble', 'luxury'],
        category: 'elegant',
      },
      {
        id: '17',
        name: localize('com_ui_style_videogame_3d'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FVideogame%203D%20style%2C%20AAA%20game%20cinematic%2C%20highly%20detailed%20rendering%2C%20Unreal%20Engine%205.jpg?alt=media&token=6b341488-2b2e-4964-a510-f847c1fb0032',
        description: 'Videogame 3D style',
        tags: ['fresh', 'green', 'nature'],
        category: 'minimalist',
      },
      {
        id: '18',
        name: localize('com_ui_style_vector_illustration'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FVector%20illustration%2C%20flat%20design%2C%20clean%20lines%2C%20minimalist%20aesthetic%2C%20modern%20graphic%20art%2C%20vibrant%20but%20subtle%20color%20palette.jpg?alt=media&token=6c25cc32-dc69-49d7-a89c-14e62aa14e9d',
        description:
          'Vector illustration, flat design, clean lines, minimalist aesthetic, modern graphic art, vibrant but subtle color palette',
        tags: ['modern', 'white', 'clean'],
        category: 'modern',
      },
      {
        id: '19',
        name: localize('com_ui_style_motionblur'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FBlurredvision%20style%2C%20motion%20blur%20effect%2C%20shallow%20depth%20of%20field%2C%20panning%20shot.jpg?alt=media&token=4ab2b75e-8466-4487-b0bb-fcceb487889c',
        description:
          'Blurredvision style, motion blur effect, shallow depth of field, panning shot',
        tags: ['motion blur', 'depth of field', 'cinematic'],
        category: 'modern',
      },
      {
        id: '20',
        name: localize('com_ui_style_coloring_book'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FColoring-book%20style%2C%20intricate%20line%20art%2C%20black%20outlines%20only%2C%20no%20fill%2C%20no%20shading%2C%20high%20contrast%2C%20crisp%20lines%2C%20perfect%20for%20printing.jpg?alt=media&token=637063c4-3690-4dc9-babe-1b998319dd3a',
        description: 'Coloring book style with intricate line art and black outlines',
        tags: ['line art', 'coloring book', 'outlines'],
        category: 'artistic',
      },
      {
        id: '21',
        name: localize('com_ui_style_arcade_bit'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FArcade-bit%20style%20pixel%20art%20of.jpg?alt=media&token=21f0c56f-f661-44b6-98bd-59cfe3e12342',
        description: 'Arcade-bit style pixel art',
        tags: ['pixel art', 'arcade', '8-bit'],
        category: 'vintage',
      },
      {
        id: '22',
        name: localize('com_ui_style_2000s_camera'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2F2000s-phone%20camera%20quality%2C%20low%20resolution%2C%20slightly%20muted%20colors%2C%20grainy%20texture%2C%20blurry%20edges%2C%20point-and-shoot%20snapshot%20aesthetic.jpg?alt=media&token=f7abeb81-ec3d-49e4-8c60-c655a6da8d24',
        description: '2000s phone camera quality with grainy texture',
        tags: ['retro', 'phone camera', 'grainy'],
        category: 'vintage',
      },
      {
        id: '23',
        name: localize('com_ui_style_arcade_detailed'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FArcade-bit%20style%20pixel%20art%2C%20Intricate%20pixel%20detailing%2C%208-bit%20aesthetic%2C%20high%20resolution.jpg?alt=media&token=9cefa0ac-c1f0-4a0b-9448-f00232cae505',
        description: 'Detailed arcade-bit style pixel art with intricate detailing',
        tags: ['pixel art', 'detailed', '8-bit'],
        category: 'vintage',
      },
      {
        id: '24',
        name: localize('com_ui_style_wide_lens'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FWidelens%20style%2C%20dynamic%20perspective.jpg?alt=media&token=445025c9-a11a-4584-8442-b33bbc0c3bc8',
        description: 'Wide lens style with dynamic perspective',
        tags: ['wide lens', 'perspective', 'dynamic'],
        category: 'modern',
      },
      {
        id: '25',
        name: localize('com_ui_style_plasticine'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FPlasticinepeople%20style%2C%20stop-motion%20animation%20aesthetic%2C%20vibrant%20matte%20colors%2C%20smooth%20clay%20texture%2C%20handcrafted%20look.jpg?alt=media&token=47994336-e28d-4160-a69a-9fcd1edfb924',
        description: 'Plasticine style with stop-motion animation aesthetic',
        tags: ['clay', 'stop-motion', 'handcrafted'],
        category: 'creative',
      },
      {
        id: '26',
        name: localize('com_ui_style_amigurumi'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FAmigurumi%203D%20style%2C%20crocheted%20plushie%2C%20detailed%20yarn%20texture%2C%20handcrafted%20feel%2C%20soft%20lighting.jpg?alt=media&token=7e90f400-835e-472c-abdb-4a4e8152cff4',
        description: 'Amigurumi 3D style with crocheted plushie texture',
        tags: ['crochet', 'yarn', 'handmade'],
        category: 'creative',
      },
      {
        id: '27',
        name: localize('com_ui_style_letterpop'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FLetterpop%20style%2C%20bold%20graphic%20design%2C%20minimalist%20poster%2C%20stark%20shadows%2C%20retro-modern%20aesthetic%2C%20vector%20art%20look.jpg?alt=media&token=471e99b8-56be-4cc7-bca7-6cd1da73f8f7',
        description: 'Letterpop style with bold graphic design and minimalist poster aesthetic',
        tags: ['graphic design', 'minimalist', 'vector'],
        category: 'modern',
      },
      {
        id: '28',
        name: localize('com_ui_style_fisheye'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FFish-eye-lens%20perspective%2C%20extreme%20wide%20angle%2C%20spherical%20distortion.jpg?alt=media&token=f524ee18-66fe-4650-8d21-8cb8e5b6e772',
        description: 'Fish-eye lens perspective with extreme wide angle',
        tags: ['fisheye', 'wide angle', 'distortion'],
        category: 'modern',
      },
      {
        id: '29',
        name: localize('com_ui_style_digital_art'),
        url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2FDigital%20art%2C%20highly%20detailed%20painting%2C%20realistic%20rendering%2C%20expressive%20brushstrokes%2C%20dynamic%20lighting%2C%20character%20concept%20art.jpg?alt=media&token=8500e932-6a46-4ea9-88f0-f65a9f80f8e7',
        description: 'Digital art with highly detailed painting and realistic rendering',
        tags: ['digital art', 'detailed', 'realistic'],
        category: 'artistic',
      },
    ];
  }, []);

  const initializeMeilisearch = useCallback(async () => {
    try {
      const index = meilisearchClient.index('styles');

      // Configure searchable attributes and filters
      await index.updateSettings({
        searchableAttributes: ['name', 'description', 'tags'],
        filterableAttributes: ['category', 'color'],
        sortableAttributes: ['name'],
      });

      // Add documents to the index
      await index.addDocuments(styleImages());
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Meilisearch:', error);
      // Fall back to local filtering if Meilisearch fails
      setIsInitialized(false);
    }
  }, [styleImages]);

  // Meilisearch search function
  const searchWithMeilisearch = useCallback(
    async (query: string, category: string) => {
      if (!isInitialized) return styleImages();

      try {
        const index = meilisearchClient.index('styles');

        const filters = category !== 'all' ? [`category = ${category}`] : [];

        const searchResults = await index.search(query, {
          filter: filters,
          limit: 50,
          attributesToHighlight: ['name', 'description'],
        });

        return searchResults.hits as StyleMetadata[];
      } catch (error) {
        console.error('Meilisearch search failed:', error);
        // Fall back to local filtering
        return styleImages().filter((image) => {
          const matchesSearch =
            !query ||
            image.name.toLowerCase().includes(query.toLowerCase()) ||
            image.description.toLowerCase().includes(query.toLowerCase()) ||
            image.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

          const matchesCategory = category === 'all' || image.category === category;
          return matchesSearch && matchesCategory;
        });
      } finally {
        /* no-op */
      }
    },
    [isInitialized, styleImages],
  );

  // Initialize Meilisearch when component mounts
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeMeilisearch();
    }
  }, [isOpen, isInitialized, initializeMeilisearch]);

  // Perform search when query or category changes
  useEffect(() => {
    const performSearch = async () => {
      const results = await searchWithMeilisearch(searchQuery, selectedCategory);
      setMeilisearchResults(results as StyleMetadata[]);
    };

    if (isInitialized || !searchQuery) {
      performSearch();
    }
  }, [searchQuery, selectedCategory, isInitialized, searchWithMeilisearch]);

  // Use Meilisearch results if available, otherwise fall back to local filtering
  const filteredImages = useCallback(() => {
    if (isInitialized && meilisearchResults.length > 0) {
      return meilisearchResults;
    }

    // Fallback to local filtering
    return styleImages().filter((image) => {
      const matchesSearch =
        !searchQuery ||
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [isInitialized, meilisearchResults, searchQuery, selectedCategory, styleImages]);

  return (
    <OGDialog open={isOpen} onOpenChange={onOpenChange} triggerRef={triggerRef}>
      <OGDialogTemplate
        className="3xl:max-h-[calc(100svh - 300px)] my-auto max-h-[calc(100svh-50px)] min-h-[calc(60svh-50px)] w-11/12 overflow-y-auto md:min-w-[900px] md:max-w-[1400px]"
        title=""
        showCloseButton={true}
        showCancelButton={false}
        main={
          <div className="scrollbar-hide space-y-4 overflow-hidden">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">{localize('com_ui_styles')}</h2>
            </div>
            <div className="flex flex-col items-center gap-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={localize('com_ui_search_by_keywords')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-96 py-2 pl-10 pr-4"
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {styleCategories().map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#7f73f3] text-white'
                        : 'text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results - Grid View Only */}
            <div className="min-h-[42vh]">
              {isLoading && (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Searching for images...' : 'Loading images...'}
                  </p>
                </div>
              )}
              {filteredImages().length > 0 ? (
                <div
                  className="scrollbar-hide grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group cursor-pointer transition-all duration-200"
                      onClick={() => {
                        onStyleSelect && onStyleSelect(image.url, image.description);
                        onOpenChange(false);
                      }}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg dark:border-gray-700">
                        <img
                          src={image.url}
                          alt={image.description}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          title={image.description}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-end bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20">
                          <div className="p-3 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <p className="line-clamp-2 text-sm font-medium">{image.description}</p>
                          </div>
                        </div>
                      </div>
                      {/* Style name under thumbnail */}
                      <div className="mt-2 text-center">
                        <p className="line-clamp-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {localize(image.nameKey as keyof typeof localize)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Search className="mx-auto mb-4 h-16 w-16 opacity-30" />
                  <h3 className="mb-2 text-lg font-medium">{localize('com_ui_no_images_found')}</h3>
                  {searchQuery ? (
                    <div>
                      <p>{localize('com_ui_no_results_for', { searchQuery })}</p>
                      <p className="mt-1 text-sm">{localize('com_ui_try_different_keywords')}</p>
                    </div>
                  ) : (
                    <p>{localize('com_ui_try_searching_styles')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      />
    </OGDialog>
  );
}
