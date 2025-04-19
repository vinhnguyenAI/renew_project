import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

// Mock data for portfolio overview
const portfolioSummary = {
  totalAssets: 12,
  totalCapacity: 1250, // MW
  totalValue: 2750000000, // $2.75B
  irr: 9.8, // %
  roi: 2.4, // multiple
  paybackPeriod: 7.2, // years
};

// Mock data for asset breakdown by type
const assetTypeData = [
  { name: 'Solar', value: 45, color: '#FFBB28' },
  { name: 'Wind', value: 35, color: '#00C49F' },
  { name: 'Hydro', value: 15, color: '#0088FE' },
  { name: 'Storage', value: 5, color: '#FF8042' },
];

// Mock data for capacity by location
const capacityByLocation = [
  { name: 'California', solar: 250, wind: 120, hydro: 0, storage: 30 },
  { name: 'Texas', solar: 180, wind: 220, hydro: 0, storage: 15 },
  { name: 'New York', solar: 90, wind: 0, hydro: 75, storage: 10 },
  { name: 'Florida', solar: 120, wind: 0, hydro: 0, storage: 5 },
  { name: 'Washington', solar: 0, wind: 100, hydro: 110, storage: 0 },
];

// Mock data for portfolio assets
const portfolioAssets = [
  { id: 1, name: 'Solar Farm Alpha', type: 'Solar', capacity: 150, location: 'California', value: 320000000, irr: 10.2 },
  { id: 2, name: 'Wind Park Beta', type: 'Wind', capacity: 200, location: 'Texas', value: 450000000, irr: 9.5 },
  { id: 3, name: 'Hydro Plant Gamma', type: 'Hydro', capacity: 100, location: 'Washington', value: 280000000, irr: 8.7 },
  { id: 4, name: 'Solar Array Delta', type: 'Solar', capacity: 120, location: 'Florida', value: 260000000, irr: 11.3 },
  { id: 5, name: 'Wind Farm Epsilon', type: 'Wind', capacity: 180, location: 'Texas', value: 390000000, irr: 9.8 },
];

const Portfolio: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const handleGenerateReport = () => {
    navigate('/reports', {
      state: {
        sourceType: 'portfolio',
        assets: portfolioAssets,
        title: 'Portfolio Analysis Report',
        description: 'Comprehensive analysis of the entire portfolio'
      }
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Portfolio Overview</Typography>
        <Button variant="contained" onClick={handleGenerateReport}>Generate Portfolio Report</Button>
      </Box>

      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Assets
              </Typography>
              <Typography variant="h5">{portfolioSummary.totalAssets}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Capacity
              </Typography>
              <Typography variant="h5">{portfolioSummary.totalCapacity} MW</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h5">{formatCurrency(portfolioSummary.totalValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Portfolio IRR
              </Typography>
              <Typography variant="h5">{portfolioSummary.irr}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                ROI Multiple
              </Typography>
              <Typography variant="h5">{portfolioSummary.roi}x</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Payback Period
              </Typography>
              <Typography variant="h5">{portfolioSummary.paybackPeriod} years</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="portfolio tabs">
          <Tab label="Overview" />
          <Tab label="Assets" />
          <Tab label="Financial Analysis" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Asset Breakdown by Type
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Capacity by Location (MW)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={capacityByLocation}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="solar" stackId="a" fill="#FFBB28" name="Solar" />
                      <Bar dataKey="wind" stackId="a" fill="#00C49F" name="Wind" />
                      <Bar dataKey="hydro" stackId="a" fill="#0088FE" name="Hydro" />
                      <Bar dataKey="storage" stackId="a" fill="#FF8042" name="Storage" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Assets Tab */}
        {tabValue === 1 && (
          <Paper>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="portfolio assets table">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity (MW)</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>IRR (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioAssets.map((asset) => (
                    <TableRow key={asset.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {asset.name}
                      </TableCell>
                      <TableCell>{asset.type}</TableCell>
                      <TableCell>{asset.capacity}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{formatCurrency(asset.value)}</TableCell>
                      <TableCell>{asset.irr}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Financial Analysis Tab */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Analysis
            </Typography>
            <Typography variant="body1" paragraph>
              This section will contain detailed financial analysis of the portfolio, including:
            </Typography>
            <ul>
              <li>Cash flow projections</li>
              <li>Sensitivity analysis</li>
              <li>Risk assessment</li>
              <li>Comparative valuation metrics</li>
            </ul>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Financial analysis features are under development. Check back soon for updates.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Portfolio; 