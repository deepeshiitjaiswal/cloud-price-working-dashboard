const axios = require('axios');
const logger = require('../config/logger');

async function fetchGCPPrices() {
  try {
    logger.info('Starting GCP price fetch');
    
    const response = await axios.get('https://cloudpricingcalculator.googleapis.com/static/data/pricelist.json', {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.data || !response.data.gcp_price_list) {
      logger.error('Invalid GCP price list format');
      return getStaticGCPData();
    }

    const priceList = response.data.gcp_price_list;
    const instances = [];

    // Process compute instances
    Object.entries(priceList).forEach(([key, value]) => {
      // Only process compute engine instances
      if (key.startsWith('CP-COMPUTEENGINE-VMIMAGE-')) {
        const name = key.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
        const type = name.includes('highcpu') ? 'Compute Optimized' :
                    name.includes('highmem') ? 'Memory Optimized' : 
                    'General Purpose';

        // Extract vCPU and memory from instance name
        const specs = name.split('-');
        let vcpu = 'N/A';
        let memory = 'N/A';
        
        if (specs.length >= 2) {
          const size = specs[specs.length - 1];
          if (!isNaN(size)) {
            vcpu = size;
            // Estimate memory based on instance type
            const memMultiplier = type === 'Memory Optimized' ? 8 : 
                                type === 'Compute Optimized' ? 2 : 4;
            memory = `${parseInt(size) * memMultiplier} GB`;
          }
        }

        // Get price for us-central1 region
        if (value.us_central1) {
          const hourlyPrice = value.us_central1;
          instances.push({
            service: 'GCP',
            description: name,
            type,
            vcpu,
            memory,
            region: 'us-central1',
            price: {
              hourly: `$${hourlyPrice.toFixed(4)}`,
              monthly: `$${(hourlyPrice * 730).toFixed(2)}`,
              yearly: `$${(hourlyPrice * 730 * 12).toFixed(2)}`
            },
            generation: name.startsWith('n2') || name.startsWith('c2') ? 'Current' : 'Previous'
          });
        }
      }
    });

    if (instances.length > 0) {
      logger.info(`Successfully fetched ${instances.length} GCP instances`);
      return instances;
    }

    logger.warn('No instances found in price list, using static data');
    return getStaticGCPData();

  } catch (error) {
    logger.error('Error fetching GCP prices:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    logger.info('Falling back to static GCP data');
    return getStaticGCPData();
  }
}

function getStaticGCPData() {
  return [
    // General Purpose - E2 Series
    {
      service: 'GCP',
      description: 'e2-standard-2',
      type: 'General Purpose',
      vcpu: '2',
      memory: '8 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.0671',
        monthly: '$48.98',
        yearly: '$587.80'
      },
      generation: 'Current'
    },
    {
      service: 'GCP',
      description: 'e2-standard-4',
      type: 'General Purpose',
      vcpu: '4',
      memory: '16 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.1342',
        monthly: '$97.97',
        yearly: '$1,175.59'
      },
      generation: 'Current'
    },
    // Compute Optimized - C2 Series
    {
      service: 'GCP',
      description: 'c2-standard-4',
      type: 'Compute Optimized',
      vcpu: '4',
      memory: '16 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.2088',
        monthly: '$152.42',
        yearly: '$1,829.09'
      },
      generation: 'Current'
    },
    {
      service: 'GCP',
      description: 'c2-standard-8',
      type: 'Compute Optimized',
      vcpu: '8',
      memory: '32 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.4176',
        monthly: '$304.85',
        yearly: '$3,658.18'
      },
      generation: 'Current'
    },
    // Memory Optimized - N2 Memory Series
    {
      service: 'GCP',
      description: 'n2-highmem-2',
      type: 'Memory Optimized',
      vcpu: '2',
      memory: '16 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.1074',
        monthly: '$78.40',
        yearly: '$940.82'
      },
      generation: 'Current'
    },
    {
      service: 'GCP',
      description: 'n2-highmem-4',
      type: 'Memory Optimized',
      vcpu: '4',
      memory: '32 GB',
      region: 'us-central1',
      price: {
        hourly: '$0.2148',
        monthly: '$156.80',
        yearly: '$1,881.65'
      },
      generation: 'Current'
    }
  ];
}

module.exports = { fetchGCPPrices };