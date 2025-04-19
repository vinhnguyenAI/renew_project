# Renew - Renewable Energy Asset Valuation Tool

Renew is a comprehensive tool for valuing renewable energy assets using Discounted Cash Flow (DCF) analysis. It provides a user-friendly interface for managing assets, performing financial calculations, and generating reports.

## Project Structure

The project consists of two main components:

1. **Backend**: An ASP.NET Core application that handles data processing, calculations, and API endpoints.
2. **Frontend**: A React application with TypeScript and Material-UI that provides the user interface.

## Features

- **Asset Management**: Create, read, update, and delete renewable energy assets
- **DCF Calculator**: Perform detailed DCF analysis on renewable energy assets
- **Portfolio Analysis**: Analyze a portfolio of renewable energy assets
- **Report Generation**: Generate and download reports in various formats
- **Dashboard**: Visualize key metrics and data

## Getting Started

### Prerequisites

- .NET 6.0 SDK or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend_csharp
   ```

2. Restore the dependencies:
   ```
   dotnet restore
   ```

3. Build the application:
   ```
   dotnet build
   ```

4. Run the development server:
   ```
   dotnet run
   ```

The API will be available at https://localhost:7001 (HTTPS) or http://localhost:5001 (HTTP).

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Run the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

The application will be available at http://localhost:3000.

## API Documentation

Once the backend server is running, you can access the API documentation at:

- Swagger UI: https://localhost:7001/swagger or http://localhost:5001/swagger

## Technologies Used

### Backend
- ASP.NET Core
- Entity Framework Core
- C# 10
- SQL Server/SQLite
- Swagger/OpenAPI

### Frontend
- React
- TypeScript
- Material-UI
- React Router
- Recharts
- Axios

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created to simplify the valuation process for renewable energy assets.
- Special thanks to all contributors who have helped to improve this tool. 