import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PALETTE } from '../../theme';

interface ReportData {
  assetName: string;
  assetType: string;
  assetLocation: string;
  assetStatus: string;
  enterpriseValue: number;
  equityValue: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  dscr: {
    min: number;
    average: number;
  };
  yearlyResults: Array<{
    year: number;
    revenue?: number;
    ebitda?: number;
    fcf: number;
    dcf: number;
  }>;
  isSample?: boolean;
}

interface ReportTemplateProps {
  data: ReportData;
  reportDate: string;
  title?: string;
}

const ReportTemplate: React.FC<ReportTemplateProps> = ({ data, reportDate, title }) => {
  // Replace the COLORS array with the palette
  const COLORS = PALETTE.chart;

  // Format currency values
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Format percentage values
  const formatPercentage = (value: number) =>
    // Check for sentinel value (-999) which indicates IRR calculation failure
    value === -999 ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

  // Format decimal values
  const formatDecimal = (value: number) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // Prepare chart data for revenue and cash flow
  const cashFlowData = data.yearlyResults.map((year) => ({
    year: year.year,
    revenue: year.revenue || 0,
    ebitda: year.ebitda || 0,
    fcf: year.fcf,
    dcf: year.dcf,
  }));

  // Prepare pie chart data
  const revenueBreakdown = [
    { name: 'Operational Costs', value: data.yearlyResults.reduce((sum, y) => sum + (y.revenue || 0) * 0.3, 0) },
    { name: 'Debt Service', value: data.yearlyResults.reduce((sum, y) => sum + (y.revenue || 0) * 0.15, 0) },
    { name: 'Taxes', value: data.yearlyResults.reduce((sum, y) => sum + (y.revenue || 0) * 0.1, 0) },
    { name: 'Free Cash Flow', value: data.yearlyResults.reduce((sum, y) => sum + y.fcf, 0) },
  ];

  return (
    <Paper sx={{ p: 4, maxWidth: '100%', mx: 'auto', mb: 4 }}>
      {/* Header with watermark for sample data */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        {data.isSample && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: 'rotate(45deg) translate(20%, -50%)',
              fontSize: '1.5rem',
              color: 'rgba(255, 0, 0, 0.2)',
              fontWeight: 'bold',
              pointerEvents: 'none',
              border: '2px solid rgba(255, 0, 0, 0.2)',
              padding: '4px 48px',
            }}
          >
            SAMPLE DATA
          </Box>
        )}

        <Typography variant="h4" gutterBottom>
          {title || `Renewable Asset Valuation Report`}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="subtitle1" color="text.secondary">
              Report Date: {reportDate}
            </Typography>
          </Grid>
          <Grid item>
            <Chip
              label={data.isSample ? 'Sample Data' : 'Verified Data'}
              color={data.isSample ? 'warning' : 'success'}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Asset Information */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Asset Information
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Asset Name
                  </TableCell>
                  <TableCell>{data.assetName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Type
                  </TableCell>
                  <TableCell>{data.assetType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Location
                  </TableCell>
                  <TableCell>{data.assetLocation}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                  <TableCell>{data.assetStatus}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Summary Valuation
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Enterprise Value
                  </TableCell>
                  <TableCell>{formatCurrency(data.enterpriseValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Equity Value
                  </TableCell>
                  <TableCell>{formatCurrency(data.equityValue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    NPV
                  </TableCell>
                  <TableCell>{formatCurrency(data.npv)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    IRR
                  </TableCell>
                  <TableCell>{formatPercentage(data.irr)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Charts and Analysis */}
      <Grid container spacing={3}>
        {/* Cash Flow Chart */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom>
            Revenue and Cash Flow Projection
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={PALETTE.orange} />
                <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={PALETTE.gold} />
                <Line type="monotone" dataKey="fcf" name="Free Cash Flow" stroke={PALETTE.darkGray} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Revenue Breakdown */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom>
            Revenue Allocation
          </Typography>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE.chart[index % PALETTE.chart.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Key Financial Metrics */}
      <Typography variant="h6" gutterBottom>
        Key Financial Metrics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payback Period
            </Typography>
            <Typography variant="h5">{formatDecimal(data.paybackPeriod)} years</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              IRR
            </Typography>
            <Typography variant="h5">{formatPercentage(data.irr)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Min DSCR
            </Typography>
            <Typography variant="h5">{formatDecimal(data.dscr.min)}x</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Avg DSCR
            </Typography>
            <Typography variant="h5">{formatDecimal(data.dscr.average)}x</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Disclaimer */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Disclaimer: This report was generated automatically based on the inputs provided. The analysis presented is for 
          informational purposes only and should not be considered as financial advice. All projections are based on assumptions
          that may not materialize. Professional consultation is recommended before making any investment decisions.
          {data.isSample && ' THIS REPORT USES SAMPLE DATA AND SHOULD NOT BE USED FOR ACTUAL DECISION MAKING.'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ReportTemplate; 