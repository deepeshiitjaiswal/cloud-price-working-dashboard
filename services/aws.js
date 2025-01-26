const axios = require('axios');
const logger = require('../config/logger');

const AWS_REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)'
};

async function fetchAWSPrices() {
  try {
    logger.info('Starting AWS price fetch');
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Fetch region index first
    const regionIndexUrl = 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/region_index.json';
    const regionResponse = await axios.get(regionIndexUrl);
    
    // Get the current region's price list URL
    const regionPriceUrl = regionResponse.data.regions[region].currentVersionUrl;
    const priceResponse = await axios.get(`https://pricing.us-east-1.amazonaws.com${regionPriceUrl}`);
    
    const products = priceResponse.data.products;
    const terms = priceResponse.data.terms.OnDemand;

    const instances = [];
    
    // Process only EC2 instance products
    for (const [productId, product] of Object.entries(products)) {
      if (product.productFamily === 'Compute Instance' && 
          product.attributes.operatingSystem === 'Linux' &&
          product.attributes.tenancy === 'Shared') {
        
        // Find the pricing term for this product
        const productTerms = Object.values(terms[productId] || {});
        if (productTerms.length === 0) continue;
        
        const priceDimensions = Object.values(productTerms[0].priceDimensions)[0];
        const hourlyPrice = parseFloat(priceDimensions.pricePerUnit.USD);
        
        instances.push({
          service: 'AWS',
          description: product.attributes.instanceType,
          type: getInstanceType(product.attributes.instanceType),
          vcpu: product.attributes.vcpu,
          memory: `${product.attributes.memory}`,
          region: AWS_REGIONS[region] || region,
          price: {
            hourly: `$${hourlyPrice.toFixed(4)}`,
            monthly: `$${(hourlyPrice * 730).toFixed(2)}`,
            yearly: `$${(hourlyPrice * 730 * 12).toFixed(2)}`
          },
          generation: product.attributes.instanceFamily.includes('Previous') ? 'Previous' : 'Current'
        });
      }
    }
    
    // Sort instances by price
    instances.sort((a, b) => {
      const priceA = parseFloat(a.price.hourly.replace('$', ''));
      const priceB = parseFloat(b.price.hourly.replace('$', ''));
      return priceA - priceB;
    });

    logger.info('AWS price fetch completed successfully', {
      instanceCount: instances.length
    });

    return instances;
  } catch (error) {
    logger.error('Error in AWS price fetch', {
      error: error.message,
      stack: error.stack
    });
    
    // Fallback to static data in case of API failure
    return getFallbackPrices();
  }
}

function getInstanceType(instanceType) {
  if (instanceType.startsWith('t')) return 'General Purpose';
  if (instanceType.startsWith('c')) return 'Compute Optimized';
  if (instanceType.startsWith('r')) return 'Memory Optimized';
  if (instanceType.startsWith('i')) return 'Storage Optimized';
  if (instanceType.startsWith('g') || instanceType.startsWith('p')) return 'GPU Optimized';
  return 'General Purpose';
}

function getFallbackPrices() {
  logger.info('Using fallback AWS prices');
  return [
    {
      service: 'AWS',
      description: 't3.micro',
      type: 'General Purpose',
      vcpu: '2',
      memory: '1 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.0104',
        monthly: '$7.59',
        yearly: '$91.10'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 't3.small',
      type: 'General Purpose',
      vcpu: '2',
      memory: '2 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.0208',
        monthly: '$15.18',
        yearly: '$182.21'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 't3.medium',
      type: 'General Purpose',
      vcpu: '2',
      memory: '4 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.0416',
        monthly: '$30.37',
        yearly: '$364.42'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 't3.large',
      type: 'General Purpose',
      vcpu: '2',
      memory: '8 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.0832',
        monthly: '$60.74',
        yearly: '$728.83'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 't3.xlarge',
      type: 'General Purpose',
      vcpu: '4',
      memory: '16 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.1664',
        monthly: '$121.47',
        yearly: '$1,457.66'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'c5.large',
      type: 'Compute Optimized',
      vcpu: '2',
      memory: '4 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.085',
        monthly: '$62.05',
        yearly: '$744.60'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'c5.xlarge',
      type: 'Compute Optimized',
      vcpu: '4',
      memory: '8 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.17',
        monthly: '$124.10',
        yearly: '$1,489.20'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'c5.2xlarge',
      type: 'Compute Optimized',
      vcpu: '8',
      memory: '16 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.34',
        monthly: '$248.20',
        yearly: '$2,978.40'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'r5.large',
      type: 'Memory Optimized',
      vcpu: '2',
      memory: '16 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.126',
        monthly: '$91.98',
        yearly: '$1,103.76'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'r5.xlarge',
      type: 'Memory Optimized',
      vcpu: '4',
      memory: '32 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.252',
        monthly: '$183.96',
        yearly: '$2,207.52'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'r5.2xlarge',
      type: 'Memory Optimized',
      vcpu: '8',
      memory: '64 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.504',
        monthly: '$367.92',
        yearly: '$4,415.04'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'm5.large',
      type: 'General Purpose',
      vcpu: '2',
      memory: '8 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.096',
        monthly: '$70.08',
        yearly: '$840.96'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'm5.xlarge',
      type: 'General Purpose',
      vcpu: '4',
      memory: '16 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.192',
        monthly: '$140.16',
        yearly: '$1,681.92'
      },
      generation: 'Current'
    },
    {
      service: 'AWS',
      description: 'm5.2xlarge',
      type: 'General Purpose',
      vcpu: '8',
      memory: '32 GB',
      region: 'us-east-1',
      price: {
        hourly: '$0.384',
        monthly: '$280.32',
        yearly: '$3,363.84'
      },
      generation: 'Current'
    }
  ];
}

module.exports = { fetchAWSPrices };