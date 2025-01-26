# Cloud Price Working Dashboard

A real-time cloud pricing comparison dashboard that fetches and displays pricing data from major cloud providers:
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)

## Features

- Real-time pricing data from cloud provider APIs
- Compare instance types across providers
- Filter by:
  - Instance type (General Purpose, Compute Optimized, Memory Optimized)
  - vCPU count
  - Memory size
  - Region
- Price comparison in hourly, monthly, and yearly formats

## Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file in the backend directory with:
```
PORT=5000
AWS_REGION=us-east-1
AZURE_FILTER="serviceName eq 'Virtual Machines' and priceType eq 'Consumption'"
```

## API Endpoints

- `GET /api/prices`: Get pricing data from all cloud providers
- `GET /api/prices/aws`: Get AWS pricing data
- `GET /api/prices/azure`: Get Azure pricing data
- `GET /api/prices/gcp`: Get GCP pricing data

## Technologies

- Frontend: React.js
- Backend: Node.js, Express
- APIs: AWS Price List API, Azure Retail Prices API, GCP Calculator API
# cloud-price-working-dashboard
