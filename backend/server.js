require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const NodeCache = require('node-cache');
const compression = require('compression');

// Service imports
const { fetchAWSPrices } = require('./services/aws');
const { fetchAzurePrices } = require('./services/azure');
const { fetchGCPPrices } = require('./services/gcp');

// Initialize cache
const cache = new NodeCache({ 
  stdTTL: 21600, // 6 hours
  checkperiod: 120,
  useClones: false
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Price update function
const updatePrices = async () => {
  try {
    logger.info('Starting price update');
    
    const [aws, azure, gcp] = await Promise.all([
      fetchAWSPrices().catch(e => {
        logger.error('AWS fetch failed', { error: e.message });
        return cache.get('aws_prices') || [];
      }),
      fetchAzurePrices().catch(e => {
        logger.error('Azure fetch failed', { error: e.message });
        return cache.get('azure_prices') || [];
      }),
      fetchGCPPrices().catch(e => {
        logger.error('GCP fetch failed', { error: e.message });
        return cache.get('gcp_prices') || [];
      })
    ]);

    const pricingData = {
      aws,
      azure,
      gcp,
      lastUpdated: new Date().toISOString()
    };

    cache.set('aws_prices', aws);
    cache.set('azure_prices', azure);
    cache.set('gcp_prices', gcp);
    cache.set('pricing_data', pricingData);

    logger.info('Price update completed', {
      awsCount: aws.length,
      azureCount: azure.length,
      gcpCount: gcp.length
    });

    return pricingData;
  } catch (error) {
    logger.error('Error in price update', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// API endpoint
app.get('/api/prices', async (req, res) => {
  try {
    let data = cache.get('pricing_data');
    
    if (!data) {
      logger.info('Cache miss, fetching new pricing data');
      data = await updatePrices();
    }

    res.json(data);
  } catch (error) {
    logger.error('Error serving prices', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to fetch pricing data',
      message: error.message
    });
  }
});

// Initialize data and start server
const initializeServer = async () => {
  try {
    logger.info('Initializing server');
    await updatePrices();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Update prices every 6 hours
    setInterval(updatePrices, 6 * 60 * 60 * 1000);
  } catch (error) {
    logger.error('Server initialization failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

initializeServer();
