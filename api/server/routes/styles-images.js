const express = require('express');
const { MeiliSearch } = require('meilisearch');
const { logger } = require('~/config');
const { isEnabled } = require('~/server/utils');

const router = express.Router();

// Simple in-memory storage for image metadata
// In production, you'd use a database
const imageMetadata = new Map();

// Initialize with some example data (you can modify these)
const defaultMetadata = [
  {
    nameKey: 'com_ui_style_studio_shot',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_18.jpg?alt=media&token=9a675408-60ad-406c-8502-be58a45384d5',
    description: 'Studio shot',
    tags: ['minimalist', 'clean', 'simple'],
    category: 'professional',
  },
  {
    nameKey: 'com_ui_style_pixel_art',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_16.jpg?alt=media&token=1952d045-3fed-4098-8a54-930cf9b88a06',
    description: 'Pixel art',
    tags: ['vintage', 'paper', 'texture'],
    category: 'vintage',
  },
  {
    nameKey: 'com_ui_style_pencil_color',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_21.jpg?alt=media&token=84e47423-5e30-467f-bbf5-1753efd468d5',
    description: 'Pencil color',
    tags: ['professional', 'dark', 'business'],
    category: 'artistic',
  },
  {
    nameKey: 'com_ui_style_pencil_art',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_15.jpg?alt=media&token=60e1a8a1-2d40-4c43-9788-6d702d329179',
    description: 'Pencil art',
    tags: ['nature', 'green', 'forest'],
    category: 'artistic',
  },
  {
    nameKey: 'com_ui_style_retro',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_17.jpg?alt=media&token=61bf8fda-3439-4f8a-a8ad-365c4ab02b0d',
    description:
      'Synthwave style, 1980s retro-futurism, neon glow, vibrant gradient sunset, dark purple and pink color palette, vaporwave aesthetic',
    tags: ['elegant', 'luxury', 'gold'],
    category: 'vintage',
  },
  {
    nameKey: 'com_ui_style_retro_80s',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_20.jpg?alt=media&token=a9824930-e8a5-4c84-9a4e-ed12bcef8326',
    description: 'Retro 80s vintage',
    tags: ['retro', '80s', 'vintage'],
    category: 'vintage',
  },
  {
    nameKey: 'com_ui_style_videogame_3d',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_13.jpg?alt=media&token=f53c114a-590e-4c46-9624-7c722d89ca18',
    description: 'Videogame 3D style',
    tags: ['fresh', 'green', 'nature'],
    category: 'minimalist',
  },
  {
    nameKey: 'com_ui_style_vector_illustration',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_12.jpg?alt=media&token=fb836700-6a3c-4b64-a290-1e234825db14',
    description:
      'Vector illustration, flat design, clean lines, minimalist aesthetic, modern graphic art, vibrant but subtle color palette',
    tags: ['modern', 'white', 'clean'],
    category: 'modern',
  },
  {
    nameKey: 'com_ui_style_motionblur',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_06.jpg?alt=media&token=d1fda94d-1d92-474f-bfab-3de6ced8ef74',
    description: 'Blurredvision style, motion blur effect, shallow depth of field, panning shot',
    tags: ['motion blur', 'depth of field', 'cinematic'],
    category: 'modern',
  },
  {
    nameKey: 'com_ui_style_coloring_book',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_07.jpg?alt=media&token=c7beb26c-3464-4785-ae05-c2034bfe3c26',
    description: 'Coloring book style with intricate line art and black outlines',
    tags: ['line art', 'coloring book', 'outlines'],
    category: 'artistic',
  },
  {
    nameKey: 'com_ui_style_arcade_detailed',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_04.jpg?alt=media&token=d846e803-a652-4601-9793-bd6650cee622',
    description: 'Detailed arcade-bit style pixel art with intricate detailing',
    tags: ['pixel art', 'detailed', '8-bit'],
    category: 'vintage',
  },
  {
    nameKey: 'com_ui_style_wide_lens',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_14.jpg?alt=media&token=4ca4ce8b-d6e5-4322-9e56-26098ae1c28a',
    description: 'Wide lens style with dynamic perspective',
    tags: ['wide lens', 'perspective', 'dynamic'],
    category: 'modern',
  },
  {
    nameKey: 'com_ui_style_plasticine',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_11.jpg?alt=media&token=112dfb7a-f406-4a5b-9d0f-30d9a42d963d',
    description: 'Plasticine style with stop-motion animation aesthetic',
    tags: ['clay', 'stop-motion', 'handcrafted'],
    category: 'creative',
  },
  {
    nameKey: 'com_ui_style_amigurumi',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_02.jpg?alt=media&token=a6eb44d4-e1e7-45df-ab7c-2a5ff56bbc5a',
    description: 'Amigurumi 3D style with crocheted plushie texture',
    tags: ['crochet', 'yarn', 'handmade'],
    category: 'creative',
  },
  {
    nameKey: 'com_ui_style_fisheye',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_09.jpg?alt=media&token=d66a443c-2536-4922-b05b-905e1f29eb2f',
    description: 'Fish-eye lens perspective with extreme wide angle',
    tags: ['fisheye', 'wide angle', 'distortion'],
    category: 'modern',
  },
  {
    nameKey: 'com_ui_style_digital_art',
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/style%2Fstyle_08.jpg?alt=media&token=a3cc4713-2bb6-41b6-a8cc-adda511c5b1c',
    description: 'Digital art with highly detailed painting and realistic rendering',
    tags: ['digital art', 'detailed', 'realistic'],
    category: 'artistic',
  },
];

// Load default metadata
defaultMetadata.forEach((metadata) => {
  imageMetadata.set(metadata.nameKey, metadata);
});

// MeiliSearch client
let meiliClient = null;
let meiliIndex = null;

const initializeMeiliSearch = async () => {
  if (!isEnabled(process.env.SEARCH) || !process.env.MEILI_HOST || !process.env.MEILI_MASTER_KEY) {
    logger.info('[style-images] MeiliSearch not configured, using basic search');
    return false;
  }

  try {
    meiliClient = new MeiliSearch({
      host: process.env.MEILI_HOST,
      apiKey: process.env.MEILI_MASTER_KEY,
    });

    const { status } = await meiliClient.health();
    if (status !== 'available') {
      logger.warn('[style-images] MeiliSearch not available, using basic search');
      return false;
    }

    // Create or get the images index
    meiliIndex = meiliClient.index('style-images');

    // Configure the index for better search
    await meiliIndex.updateSettings({
      searchableAttributes: ['description', 'tags'],
      filterableAttributes: ['type'],
      sortableAttributes: ['index'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    // Sync all images to MeiliSearch
    await syncImagesToMeiliSearch();

    logger.info('[style-images] MeiliSearch initialized successfully');
    return true;
  } catch (error) {
    logger.error('[style-images] Failed to initialize MeiliSearch:', error);
    return false;
  }
};

const syncImagesToMeiliSearch = async () => {
  if (!meiliIndex) return;

  try {
    const images = defaultMetadata.map((metadata, index) => ({
      nameKey: metadata.nameKey,
      type: 'easy',
      index,
      url: metadata.url,
      description: metadata.description,
      tags: metadata.tags.join(' '),
      tagsArray: metadata.tags,
    }));

    await meiliIndex.addDocuments(images);
    logger.info('[style-images] Synced images to MeiliSearch');
  } catch (error) {
    logger.error('[style-images] Failed to sync images to MeiliSearch:', error);
  }
};

// Initialize MeiliSearch on startup
initializeMeiliSearch();

// Helper function for basic search (fallback)
const basicSearch = (images, query) => {
  if (!query.trim()) return images;

  const searchTerm = query.toLowerCase();
  return images.filter(
    (image) =>
      image.description?.toLowerCase().includes(searchTerm) ||
      image.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)),
  );
};

// GET /api/style-images/search
router.get('/search', async (req, res) => {
  try {
    const { query = '' } = req.query;

    // Generate all Easy image URLs
    const images = defaultMetadata.map((metadata, index) => ({
      nameKey: metadata.nameKey,
      type: 'easy',
      index,
      url: metadata.url,
      description: metadata.description,
      tags: metadata.tags,
    }));

    let results;

    // Use MeiliSearch if available, otherwise fallback to basic search
    if (meiliIndex && query.trim()) {
      try {
        const searchResults = await meiliIndex.search(query, {
          limit: 50,
          attributesToRetrieve: ['nameKey', 'type', 'index', 'url', 'description', 'tagsArray'],
        });

        // Map MeiliSearch results back to our format
        results = searchResults.hits.map((hit) => ({
          nameKey: hit.nameKey,
          type: hit.type,
          index: hit.index,
          url: hit.url,
          description: hit.description,
          tags: hit.tagsArray || [],
        }));
      } catch (error) {
        logger.error('[style-images] MeiliSearch error, falling back to basic search:', error);
        results = basicSearch(images, query);
      }
    } else {
      results = basicSearch(images, query);
    }

    res.json({
      success: true,
      results,
      total: results.length,
      query,
      searchEngine: meiliIndex ? 'meilisearch' : 'basic',
    });
  } catch (error) {
    logger.error('[style-images] Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search images',
    });
  }
});

// GET /api/style-images/metadata/:imageId
router.get('/metadata/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const metadata = imageMetadata.get(imageId);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Image metadata not found',
      });
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    logger.error('[style-images] Get metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image metadata',
    });
  }
});

// PUT /api/style-images/metadata/:imageId
router.put('/metadata/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { description, tags } = req.body;

    if (!description || !tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Description and tags array are required',
      });
    }

    const metadata = {
      description: description.trim(),
      tags: tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0),
    };

    imageMetadata.set(imageId, metadata);

    // Update MeiliSearch if available
    if (meiliIndex) {
      try {
        const imageData = {
          nameKey: imageId,
          type: 'easy',
          index: parseInt(imageId.replace('whisk-', '')),
          url: `https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/images%2Fstyle%2Fstyle_${imageId.replace('whisk-', '').padStart(2, '0')}.jpg`,
          description: metadata.description,
          tags: metadata.tags.join(' '),
          tagsArray: metadata.tags,
        };

        await meiliIndex.updateDocuments([imageData]);
        logger.debug(`[style-images] Updated ${imageId} in MeiliSearch`);
      } catch (error) {
        logger.error(`[style-images] Failed to update ${imageId} in MeiliSearch:`, error);
      }
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    logger.error('[style-images] Update metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update image metadata',
    });
  }
});

// GET /api/style-images/list
router.get('/list', async (req, res) => {
  try {
    const images = defaultMetadata.map((metadata, index) => ({
      nameKey: metadata.nameKey,
      type: 'easy',
      index,
      url: metadata.url,
      description: metadata.description,
      tags: metadata.tags,
    }));

    res.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    logger.error('[style-images] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image list',
    });
  }
});

// POST /api/style-images/sync-meili - Manually sync to MeiliSearch
router.post('/sync-meili', async (req, res) => {
  try {
    const success = await syncImagesToMeiliSearch();

    res.json({
      success: true,
      message: success ? 'Images synced to MeiliSearch' : 'Failed to sync images',
    });
  } catch (error) {
    logger.error('[style-images] Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync images',
    });
  }
});

module.exports = router;
