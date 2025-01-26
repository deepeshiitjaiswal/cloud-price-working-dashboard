# Cloud Price Dashboard - Frontend

A modern React-based frontend for comparing cloud pricing across AWS, Azure, and GCP.

## Features

- Real-time price comparison
- Interactive filtering:
  - Instance type (General Purpose, Compute Optimized, Memory Optimized)
  - vCPU count
  - Memory size
  - Region
- Responsive design
- Price display in multiple formats:
  - Hourly
  - Monthly
  - Yearly
- Modern UI with sorting and filtering capabilities

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Backend service running (see backend README)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/deepeshiitjaiswal/cloud-price-working-dashboard.git
cd cloud-price-working-dashboard/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

Development mode:
```bash
npm start
```

Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── public/          # Static files
├── src/             # Source files
│   ├── components/  # React components
│   ├── styles/      # CSS styles
│   ├── utils/       # Utility functions
│   ├── App.js       # Main App component
│   └── index.js     # Entry point
└── package.json     # Dependencies and scripts
```

## Components

### PriceComparison
Main component for displaying and comparing cloud prices.
- Fetches data from backend API
- Implements filtering and sorting
- Displays pricing in a table format

### Features:
- Sort by any column
- Filter by:
  - Provider
  - Instance Type
  - vCPU
  - Memory
  - Price Range
- Export data to CSV
- Responsive design for mobile devices

## Styling

The application uses:
- CSS Modules for component-specific styles
- Responsive design principles
- Modern UI/UX practices

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
