import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PriceComparison.css';

const PriceComparison = () => {
  const [data, setData] = useState({ aws: [], azure: [], gcp: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProvider, setActiveProvider] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('hourly');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await axios.get('/api/prices');
      const normalizedData = {
        aws: Array.isArray(response.data.aws) ? response.data.aws : [],
        azure: Array.isArray(response.data.azure) ? response.data.azure.map(normalizePrice) : [],
        gcp: Array.isArray(response.data.gcp) ? response.data.gcp.map(normalizePrice) : []
      };
      setData(normalizedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch pricing data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizePrice = (item) => {
    if (typeof item.price === 'object') {
      return item;
    }

    const hourlyPrice = parseFloat(item.price) || 0;
    return {
      ...item,
      price: {
        hourly: `$${hourlyPrice.toFixed(4)}`,
        monthly: `$${(hourlyPrice * 730).toFixed(2)}`,
        yearly: `$${(hourlyPrice * 730 * 12).toFixed(2)}`
      }
    };
  };

  const filterData = () => {
    try {
      let filtered = [];
      
      if (activeProvider === 'all' || activeProvider === 'aws') {
        filtered = [...filtered, ...data.aws];
      }
      if (activeProvider === 'all' || activeProvider === 'azure') {
        filtered = [...filtered, ...data.azure];
      }
      if (activeProvider === 'all' || activeProvider === 'gcp') {
        filtered = [...filtered, ...data.gcp];
      }

      const searchFiltered = filtered.filter(item => 
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.service || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

      return searchFiltered.sort((a, b) => {
        const priceA = parseFloat((a.price[priceDisplay] || '').replace(/[$,]/g, '')) || 0;
        const priceB = parseFloat((b.price[priceDisplay] || '').replace(/[$,]/g, '')) || 0;
        return priceA - priceB;
      });
    } catch (error) {
      console.error('Error in filterData:', error);
      return [];
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Loading pricing data...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={fetchPrices}>Retry</button>
    </div>
  );

  const filteredData = filterData();

  return (
    <div className={`price-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <header className="dashboard-header">
        <h1>☁️ Cloud Price Comparison</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search instances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="provider-filters">
        <button 
          className={activeProvider === 'all' ? 'active' : ''} 
          onClick={() => setActiveProvider('all')}
        >
          All Providers ({filteredData.length})
        </button>
        <button 
          className={activeProvider === 'aws' ? 'active' : ''} 
          onClick={() => setActiveProvider('aws')}
        >
          AWS ({data.aws.length})
        </button>
        <button 
          className={activeProvider === 'azure' ? 'active' : ''} 
          onClick={() => setActiveProvider('azure')}
        >
          Azure ({data.azure.length})
        </button>
        <button 
          className={activeProvider === 'gcp' ? 'active' : ''} 
          onClick={() => setActiveProvider('gcp')}
        >
          GCP ({data.gcp.length})
        </button>
      </div>

      <div className="price-display-options">
        <button 
          className={priceDisplay === 'hourly' ? 'active' : ''} 
          onClick={() => setPriceDisplay('hourly')}
        >
          Hourly
        </button>
        <button 
          className={priceDisplay === 'monthly' ? 'active' : ''} 
          onClick={() => setPriceDisplay('monthly')}
        >
          Monthly
        </button>
        <button 
          className={priceDisplay === 'yearly' ? 'active' : ''} 
          onClick={() => setPriceDisplay('yearly')}
        >
          Yearly
        </button>
      </div>

      <button
        className="theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {filteredData.length === 0 ? (
        <div className="no-results">
          <h3>No instances found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="price-grid">
          {filteredData.map((item, index) => (
            <div key={index} className="price-card">
              <div className="card-header">
                <span className={`provider-badge ${(item.service || '').toLowerCase()}`}>
                  {item.service}
                </span>
                <h3>{item.description}</h3>
              </div>
              <div className="card-body">
                {item.type && <p><strong>Type</strong> <span>{item.type}</span></p>}
                {item.vcpu && <p><strong>vCPU</strong> <span>{item.vcpu}</span></p>}
                {item.memory && <p><strong>Memory</strong> <span>{item.memory}</span></p>}
                {item.generation && <p><strong>Generation</strong> <span>{item.generation}</span></p>}
                <p><strong>Region</strong> <span>{item.region}</span></p>
                <div className="price-details">
                  <p><strong>{priceDisplay.charAt(0).toUpperCase() + priceDisplay.slice(1)} Price</strong></p>
                  <p className="price-value">
                    {item.price && typeof item.price === 'object' ? item.price[priceDisplay] : item.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceComparison;