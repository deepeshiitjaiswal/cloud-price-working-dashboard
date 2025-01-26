const axios = require('axios');
const logger = require('../config/logger');

async function fetchAzurePrices() {
  try {
    logger.info('Starting Azure price fetch');
    
    const filter = encodeURIComponent("serviceName eq 'Virtual Machines' and priceType eq 'Consumption' and armRegionName eq 'eastus'");
    const url = `https://prices.azure.com/api/retail/prices?$filter=${filter}`;
    
    const response = await axios.get(url);
    const items = response.data.Items;
    
    const processedInstances = new Map();
    
    for (const item of items) {
      if (item.type === 'Consumption' && 
          item.skuName && 
          !item.skuName.includes('Low Priority') &&
          !item.skuName.includes('Spot') &&
          item.productName.includes('Windows') === false) {
        
        const instanceKey = item.armSkuName;
        
        if (!processedInstances.has(instanceKey)) {
          const [vcpu, memory] = getInstanceSpecs(item.skuName);
          
          processedInstances.set(instanceKey, {
            service: 'Azure',
            description: item.armSkuName,
            type: getInstanceType(item.armSkuName),
            vcpu,
            memory,
            region: 'East US',
            price: {
              hourly: `$${item.retailPrice.toFixed(4)}`,
              monthly: `$${(item.retailPrice * 730).toFixed(2)}`,
              yearly: `$${(item.retailPrice * 730 * 12).toFixed(2)}`
            },
            generation: item.skuName.includes('v2') ? 'Previous' : 'Current'
          });
        }
      }
    }
    
    // Convert Map to Array and sort by price
    const instances = Array.from(processedInstances.values())
      .sort((a, b) => {
        const priceA = parseFloat(a.price.hourly.replace('$', ''));
        const priceB = parseFloat(b.price.hourly.replace('$', ''));
        return priceA - priceB;
      });

    logger.info('Azure price fetch completed successfully', {
      instanceCount: instances.length
    });

    return instances;
  } catch (error) {
    logger.error('Error in Azure price fetch', {
      error: error.message,
      stack: error.stack
    });
    
    // Fallback to static data in case of API failure
    return getFallbackPrices();
  }
}

function getInstanceSpecs(skuName) {
  // Extract vCPU and memory from common Azure VM sizes
  const specs = {
    'B1s': ['1', '1 GB'],
    'B2s': ['2', '4 GB'],
    'B4ms': ['4', '16 GB'],
    'D2s_v3': ['2', '8 GB'],
    'D4s_v3': ['4', '16 GB'],
    'D8s_v3': ['8', '32 GB'],
    'E2s_v3': ['2', '16 GB'],
    'E4s_v3': ['4', '32 GB'],
    'E8s_v3': ['8', '64 GB'],
    'F2s_v2': ['2', '4 GB'],
    'F4s_v2': ['4', '8 GB'],
    'F8s_v2': ['8', '16 GB']
  };
  
  const normalizedName = skuName.replace(/_/g, '').toLowerCase();
  for (const [size, [vcpu, memory]] of Object.entries(specs)) {
    if (normalizedName.includes(size.toLowerCase())) {
      return [vcpu, memory];
    }
  }
  
  return ['N/A', 'N/A'];
}

function getInstanceType(instanceName) {
  const name = instanceName.toLowerCase();
  if (name.startsWith('b')) return 'General Purpose';
  if (name.startsWith('d')) return 'General Purpose';
  if (name.startsWith('e')) return 'Memory Optimized';
  if (name.startsWith('f')) return 'Compute Optimized';
  if (name.startsWith('g')) return 'GPU Optimized';
  if (name.startsWith('h')) return 'High Performance';
  if (name.startsWith('l')) return 'Storage Optimized';
  if (name.startsWith('m')) return 'Memory Optimized';
  return 'General Purpose';
}

function getFallbackPrices() {
  logger.info('Using fallback Azure prices');
  return [
    {
      service: 'Azure',
      description: 'B2s',
      type: 'General Purpose',
      vcpu: '2',
      memory: '4 GB',
      region: 'East US',
      price: {
        hourly: '$0.0416',
        monthly: '$30.37',
        yearly: '$364.42'
      },
      generation: 'Current'
    },
    {
      service: 'Azure',
      description: 'D2s v3',
      type: 'General Purpose',
      vcpu: '2',
      memory: '8 GB',
      region: 'East US',
      price: {
        hourly: '$0.096',
        monthly: '$70.08',
        yearly: '$840.96'
      },
      generation: 'Current'
    },
    {
      service: 'Azure',
      description: 'F4s v2',
      type: 'Compute Optimized',
      vcpu: '4',
      memory: '8 GB',
      region: 'East US',
      price: {
        hourly: '$0.169',
        monthly: '$123.37',
        yearly: '$1,480.44'
      },
      generation: 'Current'
    }
  ];
}

module.exports = { fetchAzurePrices };