import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Chip,
  Alert,
  Avatar,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ChevronRight as ChevronRightIcon,
  WarningAmber as WarningIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  OfflineBolt as EnergyIcon,
  Speed as CapacityIcon,
  AttachMoney as RevenueIcon,
  Co2 as Co2Icon,
  GridView as GridViewIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../theme';
import ProprietaryInsights from '../components/Dashboard/ProprietaryInsights';

// Mock data for the dashboard
const portfolioSummary = {
  totalAssets: 8,
  operationalAssets: 5,
  underConstructionAssets: 2,
  plannedAssets: 1,
  totalCapacity: 850, // MW
  operationalCapacity: 550, // MW
  annualOutput: 1520000, // MWh
  annualRevenue: 76500000, // $
  co2Avoided: 780000, // tons
  averageAvailability: 95.8, // %
  portfolioValue: 825000000, // $
  irr: 14.2, // %
  paybackPeriod: 7.8, // years
};

const monthlyPerformance = [
  { month: 'Jan', output: 110200, revenue: 5510000, target: 105000 },
  { month: 'Feb', output: 108500, revenue: 5425000, target: 102000 },
  { month: 'Mar', output: 132600, revenue: 6630000, target: 128000 },
  { month: 'Apr', output: 142300, revenue: 7115000, target: 140000 },
  { month: 'May', output: 152800, revenue: 7640000, target: 150000 },
  { month: 'Jun', output: 128450, revenue: 6422500, target: 145000 },
];

const assetTypeDistribution = [
  { name: 'Solar', value: 450 },
  { name: 'Wind', value: 350 },
  { name: 'Hydro', value: 50 },
];

const locationDistribution = [
  { name: 'California', value: 300 },
  { name: 'Texas', value: 250 },
  { name: 'New York', value: 150 },
  { name: 'Florida', value: 100 },
  { name: 'Other', value: 50 },
];

const topAssetsByCO2 = [
  { id: 1, name: 'Solar Farm Alpha', co2Avoided: 125000, percentage: 16.0 },
  { id: 4, name: 'Wind Park Delta', co2Avoided: 118000, percentage: 15.1 },
  { id: 2, name: 'Wind Park Beta', co2Avoided: 112000, percentage: 14.4 },
  { id: 5, name: 'Solar Farm Epsilon', co2Avoided: 105000, percentage: 13.5 },
  { id: 3, name: 'Solar Farm Gamma', co2Avoided: 98000, percentage: 12.6 },
];

const topAssetsByRevenue = [
  { id: 2, name: 'Wind Park Beta', revenue: 15800000, percentage: 20.7 },
  { id: 1, name: 'Solar Farm Alpha', revenue: 14500000, percentage: 19.0 },
  { id: 4, name: 'Wind Park Delta', revenue: 13200000, percentage: 17.3 },
  { id: 5, name: 'Solar Farm Epsilon', revenue: 11800000, percentage: 15.4 },
  { id: 3, name: 'Solar Farm Gamma', revenue: 10500000, percentage: 13.7 },
];

const recentAlerts = [
  { 
    id: 1, 
    assetId: 1, 
    assetName: 'Solar Farm Alpha', 
    type: 'warning', 
    message: 'Performance below threshold in Section B3', 
    date: '2023-06-14' 
  },
  { 
    id: 2, 
    assetId: 3, 
    assetName: 'Solar Farm Gamma', 
    type: 'info', 
    message: 'Scheduled maintenance on June 20', 
    date: '2023-06-12' 
  },
  { 
    id: 3, 
    assetId: 4, 
    assetName: 'Wind Park Delta', 
    type: 'success', 
    message: 'Output exceeded target by 8%', 
    date: '2023-06-10' 
  },
  { 
    id: 4, 
    assetId: 2, 
    assetName: 'Wind Park Beta', 
    type: 'warning', 
    message: 'Potential weather delay for construction', 
    date: '2023-06-08' 
  },
];

const upcomingEvents = [
  { 
    id: 1, 
    assetId: 1, 
    assetName: 'Solar Farm Alpha', 
    event: 'Quarterly maintenance', 
    date: '2023-06-22' 
  },
  { 
    id: 2, 
    assetId: 3, 
    assetName: 'Solar Farm Gamma', 
    event: 'Panel cleaning', 
    date: '2023-06-25' 
  },
  { 
    id: 3, 
    assetId: 5, 
    assetName: 'Solar Farm Epsilon', 
    event: 'Annual inspection', 
    date: '2023-07-05' 
  },
];

const COLORS = PALETTE.chart;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress color="primary" />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <LightbulbIcon color="info" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          mb: 4,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
          <Avatar 
            sx={{ 
              bgcolor: alpha(PALETTE.orange, 0.1), 
              color: PALETTE.orange,
              width: 48,
              height: 48,
              mr: 2,
            }}
          >
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600} color="text.primary">
              Portfolio Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of your renewable energy portfolio performance
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<FilterListIcon />}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/assets')}
            startIcon={<GridViewIcon />}
          >
            View Assets
          </Button>
        </Box>
      </Box>

      {/* Portfolio Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Portfolio Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(PALETTE.orange, 0.1), 
                      color: PALETTE.orange,
                      width: 40,
                      height: 40,
                      mr: 1.5,
                    }}
                  >
                    <EnergyIcon />
                  </Avatar>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                    Total Assets
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: PALETTE.darkGray,
                    mb: 1,
                  }}
                >
                  {portfolioSummary.totalAssets}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1, 
                    mt: 1 
                  }}
                >
                  <Chip 
                    size="small" 
                    label={`${portfolioSummary.operationalAssets} operational`} 
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.dark,
                      fontWeight: 500,
                    }}
                  />
                  <Chip 
                    size="small" 
                    label={`${portfolioSummary.underConstructionAssets} in construction`} 
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark,
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(PALETTE.darkGray, 0.1), 
                      color: PALETTE.darkGray,
                      width: 40,
                      height: 40,
                      mr: 1.5,
                    }}
                  >
                    <CapacityIcon />
                  </Avatar>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                    Total Capacity
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: PALETTE.darkGray,
                    mb: 1,
                  }}
                >
                  {portfolioSummary.totalCapacity} <span style={{ fontSize: '1rem' }}>MW</span>
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {portfolioSummary.operationalCapacity} MW operational
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {Math.round((portfolioSummary.operationalCapacity / portfolioSummary.totalCapacity) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(portfolioSummary.operationalCapacity / portfolioSummary.totalCapacity) * 100} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.success.main,
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(PALETTE.gold, 0.1), 
                      color: PALETTE.gold,
                      width: 40,
                      height: 40,
                      mr: 1.5,
                    }}
                  >
                    <RevenueIcon />
                  </Avatar>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                    Annual Revenue
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: PALETTE.darkGray,
                    mb: 1,
                  }}
                >
                  ${(portfolioSummary.annualRevenue / 1000000).toFixed(1)}M
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 1,
                    p: 0.5,
                    pl: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    width: 'fit-content',
                  }}
                >
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.success.main }}>
                    +8.2% vs last year
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: theme.palette.success.main,
                      width: 40,
                      height: 40,
                      mr: 1.5,
                    }}
                  >
                    <Co2Icon />
                  </Avatar>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                    CO2 Avoided
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: PALETTE.darkGray,
                    mb: 1,
                  }}
                >
                  {(portfolioSummary.co2Avoided / 1000).toFixed(1)}K <span style={{ fontSize: '1rem' }}>tons</span>
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 1,
                    p: 0.5,
                    pl: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    width: 'fit-content',
                  }}
                >
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.success.main }}>
                    +12.5% vs last year
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add ProprietaryInsights component before the charts section */}
      <ProprietaryInsights />

      {/* Charts */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Monthly Performance */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Monthly Performance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={monthlyPerformance}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke={PALETTE.orange} />
                <YAxis yAxisId="right" orientation="right" stroke={PALETTE.gold} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [`$${(Number(value) / 1000000).toFixed(2)}M`, 'Revenue'];
                  if (name === 'output') return [`${Number(value).toLocaleString()} MWh`, 'Output'];
                  if (name === 'target') return [`${Number(value).toLocaleString()} MWh`, 'Target'];
                  return [value, name];
                }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="output" stroke={PALETTE.orange} fill={PALETTE.orange} name="Output (MWh)" />
                <Area yAxisId="left" type="monotone" dataKey="target" stroke={PALETTE.gold} fill={PALETTE.gold} name="Target (MWh)" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={PALETTE.darkGray} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Portfolio Composition */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Asset Type Distribution (MW)</Typography>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={assetTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {assetTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE.chart[index % PALETTE.chart.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} MW`} />
              </PieChart>
            </ResponsiveContainer>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Location Distribution (MW)</Typography>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={locationDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {locationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE.chart[index % PALETTE.chart.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} MW`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Assets and Alerts */}
      <Grid container spacing={3}>
        {/* Top Assets by CO2 Avoided */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Top Assets by CO2 Avoided</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">CO2 (tons)</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topAssetsByCO2.map((asset) => (
                    <TableRow key={asset.id} hover onClick={() => navigate(`/assets/${asset.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell align="right">{asset.co2Avoided.toLocaleString()}</TableCell>
                      <TableCell align="right">{asset.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Assets by Revenue */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Top Assets by Revenue</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topAssetsByRevenue.map((asset) => (
                    <TableRow key={asset.id} hover onClick={() => navigate(`/assets/${asset.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell align="right">${(asset.revenue / 1000000).toFixed(1)}M</TableCell>
                      <TableCell align="right">{asset.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Alerts and Upcoming Events */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
            {recentAlerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type as any}
                icon={getAlertIcon(alert.type)}
                sx={{ mb: 1 }}
              >
                <Box onClick={() => navigate(`/assets/${alert.assetId}`)} sx={{ cursor: 'pointer' }}>
                  <Typography variant="subtitle2">{alert.assetName}</Typography>
                  <Typography variant="body2">{alert.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Alert>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
            {upcomingEvents.map((event) => (
              <Box 
                key={event.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  mb: 2,
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/assets/${event.assetId}`)}
              >
                <CalendarIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2">{event.event}</Typography>
                  <Typography variant="body2">{event.assetName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 