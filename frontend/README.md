# Renew Frontend

This is the frontend application for Renew, a renewable energy asset valuation tool. It's built with React, TypeScript, and Material-UI.

## Features

- Dashboard with key metrics and visualizations
- Asset management (create, read, update, delete)
- DCF calculator for renewable energy assets
- Portfolio analysis
- Report generation
- User settings

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Development Server

```
npm start
```
or
```
yarn start
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```
npm run build
```
or
```
yarn build
```

This will create an optimized production build in the `build` folder.

## Project Structure

- `public/` - Static assets
- `src/` - Source code
  - `components/` - Reusable UI components
  - `pages/` - Page components
  - `services/` - API services
  - `utils/` - Utility functions
  - `App.tsx` - Main application component
  - `index.tsx` - Entry point

## Technologies Used

- React
- TypeScript
- Material-UI
- React Router
- Recharts
- Axios

## API Integration

The frontend communicates with the backend API for data retrieval and manipulation. API endpoints are defined in the services directory.

## Contributing

Please follow the project's coding standards and submit pull requests for any new features or bug fixes. 