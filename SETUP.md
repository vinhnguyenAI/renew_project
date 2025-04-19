# Renew Project Setup Guide

This document provides instructions for setting up and running both the frontend and backend components of the Renew Project.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [.NET SDK](https://dotnet.microsoft.com/download) (version 9.0 or compatible)
- Visual Studio, Visual Studio Code, or another IDE with C# support

## Project Structure

The project consists of two main components:

- **Frontend**: A React application built with TypeScript, Material UI, and various charting libraries
- **Backend**: A C# ASP.NET Core API that handles DCF calculations and data processing

## Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the frontend directory by copying the example file:

```bash
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key if you plan to use the AI Valuation feature:

```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start the development server

```bash
npm start
```

The frontend application will be available at [http://localhost:3000](http://localhost:3000).

### 5. Building for production

To create an optimized production build:

```bash
npm run build
```

The build files will be generated in the `build` directory.

## Backend Setup

### 1. Navigate to the backend directory

```bash
cd backend_csharp
```

### 2. Restore dependencies

```bash
dotnet restore
```

### 3. Build the project

```bash
dotnet build
```

### 4. Run the API

```bash
dotnet run
```

The backend API will be available at [https://localhost:7087](https://localhost:7087) with Swagger documentation at [https://localhost:7087/swagger](https://localhost:7087/swagger).

### 5. Publishing for production

To create a production-ready build:

```bash
dotnet publish -c Release
```

## Connecting Frontend to Backend

By default, the frontend is configured to connect to the backend API at the URL specified in `frontend/src/services/api.ts`. If you need to change this configuration, modify the `baseURL` in that file.

## CSV Templates

The project includes CSV templates for DCF calculations:

- The frontend can load these templates from the `public` directory
- The backend has copies of these templates in the `wwwroot/templates` directory

## Troubleshooting

### CORS Issues

If you experience CORS-related problems, verify that the backend CORS policy (in `Program.cs`) includes your frontend URL.

### API Connection Issues

If the frontend cannot connect to the backend API:
1. Ensure the backend is running
2. Check that the API URL in `frontend/src/services/api.ts` matches your backend URL
3. Verify network connectivity and firewall settings

## Running in Production

For production deployment:

1. Build the frontend using `npm run build`
2. Deploy the frontend build files to a static web server
3. Publish the backend using `dotnet publish -c Release`
4. Deploy the published backend to a server that supports ASP.NET Core applications
5. Configure appropriate environment variables for both applications

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/?view=aspnetcore-7.0)
- [Material UI Documentation](https://mui.com/getting-started/usage/) 