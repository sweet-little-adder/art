const express = require('express');
const { MeiliSearch } = require('meilisearch');
const { logger } = require('~/config');
const { isEnabled } = require('~/server/utils');

const router = express.Router();

// Simple in-memory storage for image metadata
// In production, you'd use a database
const imageMetadata = new Map();

// Initialize with some example data (you can modify these)
const defaultMetadata = {
  'whisk-0': {
    description:
      'A large, blank, illuminated advertising display or billboard standing on a city sidewalk in front of a modern retail store. The display is rectangular with a black frame and is completely white, ready for an advertisement or poster to be placed. The background features a glass storefront with mannequins and clothing visible inside, as well as other shop signs and a clean, urban street scene.',
    tags: [
      'billboard',
      'advertisement',
      'blank',
      'outdoor',
      'sign',
      'city',
      'urban',
      'display',
      'marketing',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_00.jpg?alt=media&token=fb6651b6-2fc3-4e1d-aaa8-333e1cf77249'
  },
  'whisk-1': {
    description: 'Notebook on a desk ',
    tags: ['notbook', 'book', 'white', 'blank', 'desk', 'mockup', 'minimal'],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_01.jpg?alt=media&token=b1e2926e-cca9-402e-b96c-54a2eacf9ae6'
  },
  'whisk-2': {
    description:
      'A plain white t-shirt on a wooden hanger, hanging from a metal rod against a neutral gray background.',
    tags: [
      't-shirt',
      'shirt',
      'white',
      'blank',
      'clothing',
      'hanger',
      'apparel',
      'fashion',
      'mockup',
      'minimal',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_02.jpg?alt=media&token=4c54b7a2-a056-4292-b1fe-5d5cd984dacc'
  },
  'whisk-3': {
    description:
      'A hand holding a modern smartphone with a blank white screen, ready for content or app display. The background is softly blurred, focusing attention on the phone.',
    tags: [
      'phone',
      'smartphone',
      'mobile',
      'blank',
      'screen',
      'hand',
      'device',
      'technology',
      'display',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_03.jpg?alt=media&token=4943edf7-2316-450a-af73-8250b93bb5ea'
  },
  'whisk-4': {
    description:
      'A modern laptop with a blank white screen placed on a wooden desk in a bright room, with a notebook and pen nearby.',
    tags: [
      'laptop',
      'computer',
      'blank',
      'screen',
      'desk',
      'workspace',
      'technology',
      'mockup',
      'notebook',
      'pen',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_04.jpg?alt=media&token=https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_04.jpg?alt=media&token=aa84cb73-b65b-4bc2-9737-60d4e45b87f7'
  },
  'whisk-5': {
    description:
      'A small, plain white rectangular box displayed on a white shelf with a neutral gray background, ideal for product packaging mockup.',
    tags: [
      'box',
      'white',
      'blank',
      'rectangular',
      'shelf',
      'mockup',
      'packaging',
      'minimal',
      'product',
      'display',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_05.jpg?alt=media&token=2476d5c5-e6d5-49dc-a345-85f06d1325cd'
  },
  'whisk-6': {
    description:
      'A large, blank, framed poster or artwork hanging on a light-colored wall in a modern, sunlit living room with a chair and decorative plant.',
    tags: [
      'poster',
      'frame',
      'blank',
      'artwork',
      'wall',
      'living room',
      'interior',
      'mockup',
      'sunlight',
      'decor',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_06.jpg?alt=media&token=ace41be8-6da6-451c-aae1-4c1dcdebb433'
  },
  'whisk-7': {
    description:
      'A plain white t-shirt on a wooden hanger, hanging from a metal rod against a neutral gray background.',
    tags: [
      't-shirt',
      'shirt',
      'white',
      'blank',
      'clothing',
      'hanger',
      'apparel',
      'fashion',
      'mockup',
      'minimal',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_07.jpg?alt=media&token=f9051c75-e869-4f94-9041-34fec55c00d5'
  },
  'whisk-8': {
    description:
      'A large, blank, framed poster or artwork hanging on a light-colored wall in a modern, sunlit living room with a chair and decorative plant.',
    tags: [
      'poster',
      'frame',
      'blank',
      'artwork',
      'wall',
      'living room',
      'interior',
      'mockup',
      'sunlight',
      'decor',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_08.jpg?alt=media&token=d3f4c426-bb47-4fe0-a72d-1adbbaffd9c4',
    token: 'd3f4c426-bb47-4fe0-a72d-1adbbaffd9c4'
  },
  'whisk-9': {
    description:
      'A modern laptop with a blank white screen on a wooden desk, next to a closed notebook and pen, in a softly lit room.',
    tags: [
      'laptop',
      'computer',
      'blank',
      'screen',
      'desk',
      'workspace',
      'notebook',
      'pen',
      'technology',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_09.jpg?alt=media&token=66d4c276-7911-4995-9d55-80cf306256e3',
    token: '66d4c276-7911-4995-9d55-80cf306256e3'
  },
  'whisk-10': {
    description:
      'A large, blank, outdoor advertising billboard with a black frame, standing on a city sidewalk with trees and buildings in the background.',
    tags: [
      'billboard',
      'advertisement',
      'blank',
      'outdoor',
      'sign',
      'city',
      'urban',
      'display',
      'marketing',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_10.jpg?alt=media&token=6ec6882a-bc4b-48c6-9859-60c68403830c',
    token: '6ec6882a-bc4b-48c6-9859-60c68403830c'
  },
  'whisk-11': {
    description:
      'A hand holding a modern smartphone with a blank white screen, ready for content or app display. The background is softly blurred, focusing attention on the phone.',
    tags: [
      'phone',
      'smartphone',
      'mobile',
      'blank',
      'screen',
      'hand',
      'device',
      'technology',
      'display',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_11.jpg?alt=media&token=2df48765-6612-47b1-9dc5-f19f605c2fe9',
    token: '2df48765-6612-47b1-9dc5-f19f605c2fe9'
  },
  'whisk-12': {
    description:
      'A white reusable coffee cup with a lid, placed on a wooden table in a sunlit modern cafe or workspace.',
    tags: [
      'coffee cup',
      'cup',
      'white',
      'blank',
      'reusable',
      'lid',
      'table',
      'cafe',
      'mockup',
      'drinkware',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_12.jpg?alt=media&token=72a549b4-4648-4e02-bc5b-272b2fc2c434',
    token: '72a549b4-4648-4e02-bc5b-272b2fc2c434'
  },
  'whisk-13': {
    description:
      'A white reusable coffee cup with a lid, placed on a wooden table in a sunlit modern cafe or workspace.',
    tags: [
      'coffee cup',
      'cup',
      'white',
      'blank',
      'reusable',
      'lid',
      'table',
      'cafe',
      'mockup',
      'drinkware',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_13.jpg?alt=media&token=ef5872f8-96d4-4553-b421-65019905b6ee',
    token: 'ef5872f8-96d4-4553-b421-65019905b6ee'
  },
  'whisk-14': {
    description:
      'A large, blank, outdoor advertising billboard with a black frame, standing on a city sidewalk with trees and buildings in the background.',
    tags: [
      'billboard',
      'advertisement',
      'blank',
      'outdoor',
      'sign',
      'city',
      'urban',
      'display',
      'marketing',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_14.jpg?alt=media&token=c4877fa7-20cb-48dd-b305-adb02113f1c8',
    token: 'c4877fa7-20cb-48dd-b305-adb02113f1c8'
  },
  'whisk-15': {
    description:
      'A large, blank, outdoor advertising billboard with a black frame, standing on a city sidewalk with trees and buildings in the background.',
    tags: [
      'billboard',
      'advertisement',
      'blank',
      'outdoor',
      'sign',
      'city',
      'urban',
      'display',
      'marketing',
      'mockup',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_15.jpg?alt=media&token=de809db0-46a7-4831-a3e7-808133b21bf4',
    token: 'de809db0-46a7-4831-a3e7-808133b21bf4'
  },
  'whisk-16': {
    description:
      'A plain white shopping bag with handles, standing on a tiled floor in a bright, modern shopping mall environment.',
    tags: [
      'shopping bag',
      'bag',
      'white',
      'blank',
      'retail',
      'mall',
      'handles',
      'store',
      'mockup',
      'indoor',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_16.jpg?alt=media&token=99ca7460-21d2-4420-9620-a7b96e2ddb13',
    token: '99ca7460-21d2-4420-9620-a7b96e2ddb13'
  },
  'whisk-17': {
    description:
      'A plain white shopping bag with handles, standing on a tiled floor in a bright, modern shopping mall environment.',
    tags: [
      'shopping bag',
      'bag',
      'white',
      'blank',
      'retail',
      'mall',
      'handles',
      'store',
      'mockup',
      'indoor',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_17.jpg?alt=media&token=7d584696-f458-47c7-a52b-4e93c5f7ed79',
    token: '7d584696-f458-47c7-a52b-4e93c5f7ed79'
  },
  'whisk-18': {
    description:
      'A tall, plain white box standing upright on a white shelf with a neutral gray background, suitable for product packaging mockup.',
    tags: [
      'box',
      'white',
      'blank',
      'tall',
      'packaging',
      'mockup',
      'shelf',
      'minimal',
      'product',
      'display',
    ],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_18.jpg?alt=media&token=fdf9bd3d-a77d-447c-9459-ccf289a2a5e1',
    token: 'fdf9bd3d-a77d-447c-9459-ccf289a2a5e1'
  },
  'whisk-19': {
    description: 'Notebook on a desk ',
    tags: ['notbook', 'book', 'white', 'blank', 'desk', 'mockup', 'minimal'],
    url: 'https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_19.jpg?alt=media&token=49fff866-99a6-4840-9b9b-7a901d73ae15',
    token: '49fff866-99a6-4840-9b9b-7a901d73ae15'
  },
};

// Load default metadata
Object.entries(defaultMetadata).forEach(([id, metadata]) => {
  imageMetadata.set(id, metadata);
});

// MeiliSearch client
let meiliClient = null;
let meiliIndex = null;

const initializeMeiliSearch = async () => {
  if (!isEnabled(process.env.SEARCH) || !process.env.MEILI_HOST || !process.env.MEILI_MASTER_KEY) {
    logger.info('[stock-images] MeiliSearch not configured, using basic search');
    return false;
  }

  try {
    meiliClient = new MeiliSearch({
      host: process.env.MEILI_HOST,
      apiKey: process.env.MEILI_MASTER_KEY,
    });

    const { status } = await meiliClient.health();
    if (status !== 'available') {
      logger.warn('[stock-images] MeiliSearch not available, using basic search');
      return false;
    }

    // Create or get the images index
    meiliIndex = meiliClient.index('stock-images');

    // Configure the index for better search
    await meiliIndex.updateSettings({
      searchableAttributes: ['description', 'tags'],
      filterableAttributes: ['type'],
      sortableAttributes: ['index'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    // Sync all images to MeiliSearch
    await syncImagesToMeiliSearch();

    logger.info('[stock-images] MeiliSearch initialized successfully');
    return true;
  } catch (error) {
    logger.error('[stock-images] Failed to initialize MeiliSearch:', error);
    return false;
  }
};

const syncImagesToMeiliSearch = async () => {
  if (!meiliIndex) return;

  try {
    const images = [];

    for (let i = 0; i < 20; i++) {
      const id = `whisk-${i}`;
      const metadata = imageMetadata.get(id) || {
        description: 'No description available',
        tags: [],
      };

      images.push({
        id,
        type: 'easy',
        index: i,
        url: `https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_${i.toString().padStart(2, '0')}.jpg?alt=media&token=${metadata.token}`,
        description: metadata.description,
        tags: metadata.tags.join(' '), // MeiliSearch works better with space-separated tags
        tagsArray: metadata.tags, // Keep original array for API responses
      });
    }

    await meiliIndex.addDocuments(images);
    logger.info('[stock-images] Synced images to MeiliSearch');
  } catch (error) {
    logger.error('[stock-images] Failed to sync images to MeiliSearch:', error);
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

// GET /api/stock-images/search
router.get('/search', async (req, res) => {
  try {
    const { query = '' } = req.query;

    // Generate all Easy image URLs
    const images = [];

    for (let i = 0; i < 20; i++) {
      const id = `whisk-${i}`;
      const metadata = imageMetadata.get(id) || {
        description: 'No description available',
        tags: [],
      };

      images.push({
        id,
        type: 'easy',
        index: i,
        url: `https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_${i.toString().padStart(2, '0')}.jpg?alt=media&token=${metadata.token}`,
        ...metadata,
      });
    }

    let results;

    // Use MeiliSearch if available, otherwise fallback to basic search
    if (meiliIndex && query.trim()) {
      try {
        const searchResults = await meiliIndex.search(query, {
          limit: 50,
          attributesToRetrieve: ['id', 'type', 'index', 'url', 'description', 'tagsArray'],
        });

        // Map MeiliSearch results back to our format
        results = searchResults.hits.map((hit) => ({
          id: hit.id,
          type: hit.type,
          index: hit.index,
          url: hit.url,
          description: hit.description,
          tags: hit.tagsArray || [],
        }));
      } catch (error) {
        logger.error('[stock-images] MeiliSearch error, falling back to basic search:', error);
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
    logger.error('[stock-images] Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search images',
    });
  }
});

// GET /api/stock-images/metadata/:imageId
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
    logger.error('[stock-images] Get metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image metadata',
    });
  }
});

// PUT /api/stock-images/metadata/:imageId
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
          id: imageId,
          type: 'easy',
          index: parseInt(imageId.replace('whisk-', '')),
          url: `https://ugricruidisirwkjayzw.supabase.co/storage/v1/object/public/JoJo%20Ventures%20-%20Website/Ø%20Chat/Easy/Whisk_${imageId.replace('whisk-', '').padStart(2, '0')}.jpg`,
          description: metadata.description,
          tags: metadata.tags.join(' '),
          tagsArray: metadata.tags,
        };

        await meiliIndex.updateDocuments([imageData]);
        logger.debug(`[stock-images] Updated ${imageId} in MeiliSearch`);
      } catch (error) {
        logger.error(`[stock-images] Failed to update ${imageId} in MeiliSearch:`, error);
      }
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    logger.error('[stock-images] Update metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update image metadata',
    });
  }
});

// GET /api/stock-images/list
router.get('/list', async (req, res) => {
  try {
    const images = [];

    for (let i = 0; i < 20; i++) {
      const id = `whisk-${i}`;
      const metadata = imageMetadata.get(id) || {
        description: 'No description available',
        tags: [],
      };

      images.push({
        id,
        type: 'easy',
        index: i,
        url: `https://firebasestorage.googleapis.com/v0/b/Ø-chat-6d6d9.firebasestorage.app/o/mockups%2FWhisk_${i.toString().padStart(2, '0')}.jpg?alt=media&token=${metadata.token}`,
        ...metadata,
      });
    }

    res.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    logger.error('[stock-images] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image list',
    });
  }
});

// POST /api/stock-images/sync-meili - Manually sync to MeiliSearch
router.post('/sync-meili', async (req, res) => {
  try {
    const success = await syncImagesToMeiliSearch();

    res.json({
      success: true,
      message: success ? 'Images synced to MeiliSearch' : 'Failed to sync images',
    });
  } catch (error) {
    logger.error('[stock-images] Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync images',
    });
  }
});

module.exports = router;
