const express = require('express');
const axios = require('axios');
const { logger } = require('~/config');

const router = express.Router();

/**
 * Proxy route for external images to avoid CORS issues
 * Usage: /api/proxy-images?url=https://fal.media/files/panda/image.jpg
 */
router.get('/', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Only allow specific domains for security
    const allowedDomains = [
      'fal.media',
      'cdn.fal.ai',
      'files.fal.ai'
    ];
    
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain => hostname.includes(domain));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // Fetch the image
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'LibreChat/1.0',
      },
    });

    // Set appropriate headers
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Pipe the image data to the response
    response.data.pipe(res);
    
  } catch (error) {
    logger.error('[proxy-images] Error proxying image:', error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

module.exports = router; 