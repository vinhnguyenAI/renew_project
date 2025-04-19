import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Chip,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Calculate as CalculateIcon,
  BarChart as BarChartIcon,
  Alarm as AlarmIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// Mock data for the asset
const mockAssets = [
  {
    id: 1,
    name: 'Solar Farm Alpha',
    type: 'Solar',
    capacity: 100,
    status: 'Operational',
    location: 'California, USA',
    lastUpdated: '2023-06-15',
    description: 'A 100 MW solar farm located in California. The facility consists of 300,000 solar panels and was commissioned in 2020.',
    coordinates: { lat: 36.7783, lng: -119.4179 },
    owner: 'Renewable Energies Inc.',
    operator: 'Green Operations LLC',
    commissioning: '2020-03-10',
    expectedLifespan: 25,
    keyMetrics: {
      currentOutput: 78.5,
      outputToday: 565,
      outputMonth: 15420,
      outputYear: 175300,
      availability: 96.8,
      performanceRatio: 0.82,
      co2Avoided: 125000,
      revenue: 8750000,
    },
    forecast: {
      nextDay: 580,
      nextWeek: 4050,
      nextMonth: 16200,
    },
    alerts: [
      { id: 1, type: 'warning', message: 'Section B3 performance below threshold', date: '2023-06-14' },
      { id: 2, type: 'info', message: 'Scheduled maintenance on June 20', date: '2023-06-10' },
    ],
    maintenanceSchedule: [
      { id: 1, task: 'Panel cleaning', date: '2023-06-20', status: 'scheduled' },
      { id: 2, task: 'Inverter maintenance', date: '2023-06-25', status: 'scheduled' },
      { id: 3, task: 'Quarterly inspection', date: '2023-07-15', status: 'scheduled' },
    ],
    financials: {
      initialInvestment: 95000000,
      annualRevenue: 8750000,
      operatingCosts: 2100000,
      expectedROI: 12.5,
      paybackPeriod: 8.2,
      ppaTerm: 15,
      ppaRate: 65,
    },
    historicalData: [
      { month: 'Jan', output: 13200, revenue: 858000, target: 12800 },
      { month: 'Feb', output: 14500, revenue: 942500, target: 14000 },
      { month: 'Mar', output: 16800, revenue: 1092000, target: 16000 },
      { month: 'Apr', output: 18200, revenue: 1183000, target: 17500 },
      { month: 'May', output: 19500, revenue: 1267500, target: 19000 },
      { month: 'Jun', output: 15420, revenue: 1002300, target: 18000 },
    ],
    energyMix: [
      { name: 'Direct to Grid', value: 70 },
      { name: 'Battery Storage', value: 15 },
      { name: 'Corporate PPA', value: 15 },
    ],
  },
  {
    id: 2,
    name: 'Wind Park Beta',
    type: 'Wind',
    capacity: 150,
    status: 'Under Construction',
    location: 'Texas, USA',
    lastUpdated: '2023-06-10',
    description: 'A 150 MW wind farm with 50 turbines under construction in Texas. Expected to be operational by Q1 2024.',
    coordinates: { lat: 31.9686, lng: -99.9018 },
    owner: 'Renewable Energies Inc.',
    operator: 'Wind Operations LLC',
    commissioning: '2024-01-15',
    expectedLifespan: 20,
    keyMetrics: {
      constructionProgress: 65,
      estimatedCompletion: '2024-01-15',
      turbinesInstalled: 32,
      turbinesOperational: 0,
      totalTurbines: 50,
      forecastedAnnualOutput: 525000,
      forecastedRevenue: 26250000,
    },
    constructionMilestones: [
      { phase: 'Site preparation', progress: 100, completionDate: '2022-10-15' },
      { phase: 'Foundation construction', progress: 90, completionDate: '2023-03-30' },
      { phase: 'Turbine installation', progress: 64, completionDate: '2023-09-30' },
      { phase: 'Electrical works', progress: 45, completionDate: '2023-11-30' },
      { phase: 'Testing & commissioning', progress: 0, completionDate: '2024-01-15' },
    ],
    alerts: [
      { id: 1, type: 'info', message: 'Turbine delivery scheduled for next week', date: '2023-06-08' },
      { id: 2, type: 'warning', message: 'Potential weather delay for construction', date: '2023-06-12' },
    ],
    financials: {
      initialInvestment: 210000000,
      estimatedAnnualRevenue: 26250000,
      estimatedOperatingCosts: 5250000,
      expectedROI: 15.2,
      paybackPeriod: 7.5,
      ppaTerm: 20,
      ppaRate: 50,
    },
  },
  // Additional mock assets...
];

// Interface for TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`asset-tabpanel-${index}`}
      aria-labelledby={`asset-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const assetId = parseInt(id || '0', 10);
    const foundAsset = mockAssets.find(a => a.id === assetId);
    
    // Simulate loading
    setTimeout(() => {
      setAsset(foundAsset);
      setLoading(false);
    }, 800);
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading asset details...</Typography>
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Asset not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/assets')}
          sx={{ mt: 2 }}
        >
          Back to Assets
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'success';
      case 'Under Construction':
        return 'warning';
      case 'Planned':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderDashboard = () => {
    if (asset.status === 'Operational') {
      return (
        <Grid container spacing={3}>
          {/* Key metrics */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Current Output</Typography>
                <Typography variant="h4">{asset.keyMetrics.currentOutput} MW</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(asset.keyMetrics.currentOutput / asset.capacity) * 100} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {((asset.keyMetrics.currentOutput / asset.capacity) * 100).toFixed(1)}% of capacity
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Output Today</Typography>
                <Typography variant="h4">{asset.keyMetrics.outputToday} MWh</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Forecast: {asset.forecast.nextDay} MWh (tomorrow)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                <Typography variant="h4">{asset.keyMetrics.availability}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={asset.keyMetrics.availability} 
                  sx={{ mt: 1 }} 
                  color={asset.keyMetrics.availability >= 95 ? "success" : "warning"}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Performance Ratio</Typography>
                <Typography variant="h4">{asset.keyMetrics.performanceRatio.toFixed(2)}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={asset.keyMetrics.performanceRatio * 100} 
                  sx={{ mt: 1 }}
                  color={asset.keyMetrics.performanceRatio >= 0.8 ? "success" : "warning"}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Production chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Monthly Production</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={asset.historicalData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="output" stroke="#8884d8" fill="#8884d8" name="Output (MWh)" />
                  <Area type="monotone" dataKey="target" stroke="#82ca9d" fill="#82ca9d" name="Target (MWh)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Energy distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Energy Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={asset.energyMix}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {asset.energyMix.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
              {asset.alerts.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asset.alerts.map((alert: any) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {alert.type === 'warning' ? 
                            <WarningIcon color="warning" /> : 
                            <CheckCircleIcon color="info" />}
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{new Date(alert.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2">No recent alerts</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      );
    } else if (asset.status === 'Under Construction') {
      return (
        <Grid container spacing={3}>
          {/* Construction progress */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Construction Progress</Typography>
                <Typography variant="h4">{asset.keyMetrics.constructionProgress}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={asset.keyMetrics.constructionProgress} 
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Est. completion: {new Date(asset.keyMetrics.estimatedCompletion).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Turbines Installed</Typography>
                <Typography variant="h4">{asset.keyMetrics.turbinesInstalled} / {asset.keyMetrics.totalTurbines}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(asset.keyMetrics.turbinesInstalled / asset.keyMetrics.totalTurbines) * 100} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Forecasted Annual Output</Typography>
                <Typography variant="h4">{asset.keyMetrics.forecastedAnnualOutput.toLocaleString()} MWh</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Forecasted Annual Revenue</Typography>
                <Typography variant="h4">${(asset.keyMetrics.forecastedRevenue / 1000000).toFixed(1)}M</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Construction milestones */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Construction Milestones</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Phase</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Completion Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {asset.constructionMilestones.map((milestone: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{milestone.phase}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={milestone.progress} />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{milestone.progress}%</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(milestone.completionDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Updates</Typography>
              {asset.alerts.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asset.alerts.map((alert: any) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {alert.type === 'warning' ? 
                            <WarningIcon color="warning" /> : 
                            <CheckCircleIcon color="info" />}
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{new Date(alert.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2">No recent updates</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      );
    } else {
      // Planned asset
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                This asset is in the planning phase
              </Typography>
              <Typography variant="body1">
                Detailed information and performance metrics will be available once construction begins.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      );
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/assets')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">{asset.name}</Typography>
          <Chip
            label={asset.status}
            color={getStatusColor(asset.status) as any}
            sx={{ ml: 2 }}
          />
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={() => navigate('/dcf-calculator', { 
              state: { 
                assetData: {
                  id: asset.id,
                  name: asset.name,
                  type: asset.type,
                  capacity: asset.capacity,
                  location: asset.location,
                  status: asset.status,
                  // For operational assets, include revenue information
                  annualRevenue: asset.status === 'Operational' ? asset.financials.annualRevenue : 
                    asset.status === 'Under Construction' ? asset.financials.estimatedAnnualRevenue : 0,
                  operatingCosts: asset.status === 'Operational' ? asset.financials.operatingCosts : 
                    asset.status === 'Under Construction' ? asset.financials.estimatedOperatingCosts : 0,
                  initialInvestment: asset.financials.initialInvestment,
                  expectedROI: asset.financials.expectedROI,
                  ppaRate: asset.financials.ppaRate,
                  ppaTerm: asset.financials.ppaTerm
                }
              }
            })}
            sx={{ mr: 1 }}
          >
            Run DCF
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => alert('Edit asset functionality')}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Info cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Asset Type</Typography>
            <Typography variant="body1">{asset.type}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
            <Typography variant="body1">{asset.capacity} MW</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Location</Typography>
            <Typography variant="body1">{asset.location}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
            <Typography variant="body1">{new Date(asset.lastUpdated).toLocaleDateString()}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="asset details tabs">
          <Tab label="Dashboard" id="asset-tab-0" />
          <Tab label="Details" id="asset-tab-1" />
          <Tab label="Maintenance" id="asset-tab-2" />
          <Tab label="Financials" id="asset-tab-3" />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <TabPanel value={tabValue} index={0}>
        {renderDashboard()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Asset Information</Typography>
              <Typography variant="body1" paragraph>
                {asset.description}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                  <Typography variant="body1" paragraph>{asset.owner}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Operator</Typography>
                  <Typography variant="body1" paragraph>{asset.operator}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Commissioning Date</Typography>
                  <Typography variant="body1" paragraph>
                    {asset.status === 'Under Construction' ? 
                      `Estimated: ${new Date(asset.commissioning).toLocaleDateString()}` : 
                      new Date(asset.commissioning).toLocaleDateString()}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Expected Lifespan</Typography>
                  <Typography variant="body1" paragraph>{asset.expectedLifespan} years</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {asset.status === 'Operational' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Annual Output (YTD)</Typography>
                    <Typography variant="body1">{asset.keyMetrics.outputYear.toLocaleString()} MWh</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">CO2 Emissions Avoided</Typography>
                    <Typography variant="body1">{asset.keyMetrics.co2Avoided.toLocaleString()} tons</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                    <Typography variant="body1">{asset.keyMetrics.availability}%</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {asset.status === 'Operational' ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Maintenance Schedule</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asset.maintenanceSchedule.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.task}</TableCell>
                        <TableCell>{new Date(task.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status.charAt(0).toUpperCase() + task.status.slice(1)} 
                            color={task.status === 'completed' ? 'success' : 'info'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Maintenance information will be available once the asset is operational
            </Typography>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Financial Overview</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Initial Investment</Typography>
                  <Typography variant="body1">${(asset.financials.initialInvestment / 1000000).toFixed(1)}M</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {asset.status === 'Operational' ? 'Annual Revenue' : 'Estimated Annual Revenue'}
                  </Typography>
                  <Typography variant="body1">
                    ${((asset.status === 'Operational' ? asset.financials.annualRevenue : asset.financials.estimatedAnnualRevenue) / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {asset.status === 'Operational' ? 'Operating Costs' : 'Estimated Operating Costs'}
                  </Typography>
                  <Typography variant="body1">
                    ${((asset.status === 'Operational' ? asset.financials.operatingCosts : asset.financials.estimatedOperatingCosts) / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Expected ROI</Typography>
                  <Typography variant="body1">{asset.financials.expectedROI}%</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Payback Period</Typography>
                  <Typography variant="body1">{asset.financials.paybackPeriod} years</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">PPA Terms</Typography>
                  <Typography variant="body1">${asset.financials.ppaRate}/MWh for {asset.financials.ppaTerm} years</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {asset.status === 'Operational' && asset.historicalData && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Revenue History</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={asset.historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AssetDetail; 