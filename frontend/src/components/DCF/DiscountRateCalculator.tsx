import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Divider,
  Slider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SelectChangeEvent } from '@mui/material/Select';

interface DiscountRateProps {
  discountRate: number;
  onDiscountRateChange: (value: number) => void;
  npvAtCurrentRate: number;
}

const DiscountRateCalculator: React.FC<DiscountRateProps> = ({
  discountRate,
  onDiscountRateChange,
  npvAtCurrentRate,
}) => {
  const [waccComponents, setWaccComponents] = useState({
    debtWeight: 60,
    equityWeight: 40,
    costOfDebt: 5.0,
    riskFreeRate: 3.0,
    beta: 1.2,
    marketRiskPremium: 5.5,
    countryRiskPremium: 1.0,
    taxRate: 25,
  });

  const [sensitivityData, setSensitivityData] = useState<{ discountRate: number; npv: number }[]>([]);
  const [calculationMethod, setCalculationMethod] = useState<'wacc' | 'manual'>('wacc');
  const [actualWacc, setActualWacc] = useState<number | null>(null);

  // Calculate WACC
  const calculateWACC = () => {
    const {
      debtWeight,
      equityWeight,
      costOfDebt,
      riskFreeRate,
      beta,
      marketRiskPremium,
      countryRiskPremium,
      taxRate,
    } = waccComponents;

    // Cost of equity using CAPM
    const costOfEquity = riskFreeRate + beta * marketRiskPremium + countryRiskPremium;
    
    // WACC calculation
    const wacc =
      (debtWeight / 100) * costOfDebt * (1 - taxRate / 100) +
      (equityWeight / 100) * costOfEquity;
    
    return parseFloat(wacc.toFixed(2));
  };

  // Handle WACC component changes
  const handleWaccComponentChange = (component: keyof typeof waccComponents) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      setWaccComponents({
        ...waccComponents,
        [component]: value,
      });
    }
  };

  // Generate sensitivity data
  useEffect(() => {
    const baseDiscount = discountRate;
    const data = [];
    
    // Generate points for -5% to +5% around the current discount rate
    for (let i = -5; i <= 5; i++) {
      const rate = Math.max(1, baseDiscount + i);
      // Simple approximation of NPV at different discount rates
      // In a real implementation, this would recalculate NPV at each rate
      const multiplier = baseDiscount / rate;
      const approximateNPV = npvAtCurrentRate * multiplier;
      
      data.push({
        discountRate: rate,
        npv: parseFloat(approximateNPV.toFixed(0)),
      });
    }
    
    setSensitivityData(data);
  }, [discountRate, npvAtCurrentRate]);

  // Update discount rate when WACC changes
  useEffect(() => {
    if (calculationMethod === 'wacc') {
      const calculatedWacc = calculateWACC();
      setActualWacc(calculatedWacc);
      // Comment out the automatic override of discount rate
      // onDiscountRateChange(calculatedWacc);
    }
  }, [waccComponents, calculationMethod]);

  // Handle method change without automatically changing the discount rate
  const handleMethodChange = (event: SelectChangeEvent<'wacc' | 'manual'>) => {
    const newMethod = event.target.value as 'wacc' | 'manual';
    setCalculationMethod(newMethod);
    
    // Only update the discount rate if user explicitly chooses to apply the WACC
    // No automatic override here
  };

  const handleManualDiscountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > 0) {
      onDiscountRateChange(value);
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onDiscountRateChange(newValue);
    }
  };

  // Add displayWacc function to format the actual WACC for display
  const displayWacc = () => {
    if (actualWacc !== null) {
      return `${actualWacc.toFixed(2)}%`;
    }
    return 'Not calculated';
  };

  // Add applyWacc function to apply the calculated WACC as the discount rate
  const applyWacc = () => {
    if (actualWacc !== null) {
      onDiscountRateChange(actualWacc);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Calculation Method */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Discount Rate Method
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Calculation Method</InputLabel>
                <Select
                  value={calculationMethod}
                  label="Calculation Method"
                  onChange={handleMethodChange}
                >
                  <MenuItem value="wacc">Weighted Average Cost of Capital (WACC)</MenuItem>
                  <MenuItem value="manual">Manual Input</MenuItem>
                </Select>
              </FormControl>
              {calculationMethod === 'manual' && (
                <TextField
                  fullWidth
                  label="Discount Rate (%)"
                  type="number"
                  value={discountRate}
                  onChange={handleManualDiscountChange}
                  InputProps={{
                    endAdornment: '%',
                  }}
                  margin="normal"
                />
              )}
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Discount Rate: {discountRate}%</Typography>
                <Slider
                  value={discountRate}
                  onChange={handleSliderChange}
                  aria-labelledby="discount-rate-slider"
                  min={1}
                  max={30}
                  step={0.1}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* WACC Components */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  WACC Components
                </Typography>
                <Tooltip title="Weighted Average Cost of Capital (WACC) represents the average rate that a company is expected to pay to finance its assets, considering the proportion of debt and equity in its capital structure.">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Capital Structure
                  </Typography>
                  <TextField
                    fullWidth
                    label="Debt Weight (%)"
                    type="number"
                    value={waccComponents.debtWeight}
                    onChange={handleWaccComponentChange('debtWeight')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Equity Weight (%)"
                    type="number"
                    value={waccComponents.equityWeight}
                    onChange={handleWaccComponentChange('equityWeight')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    type="number"
                    value={waccComponents.taxRate}
                    onChange={handleWaccComponentChange('taxRate')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cost Components
                  </Typography>
                  <TextField
                    fullWidth
                    label="Cost of Debt (%)"
                    type="number"
                    value={waccComponents.costOfDebt}
                    onChange={handleWaccComponentChange('costOfDebt')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Risk-Free Rate (%)"
                    type="number"
                    value={waccComponents.riskFreeRate}
                    onChange={handleWaccComponentChange('riskFreeRate')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Beta"
                    type="number"
                    value={waccComponents.beta}
                    onChange={handleWaccComponentChange('beta')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Market Risk Premium (%)"
                    type="number"
                    value={waccComponents.marketRiskPremium}
                    onChange={handleWaccComponentChange('marketRiskPremium')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                  <TextField
                    fullWidth
                    label="Country Risk Premium (%)"
                    type="number"
                    value={waccComponents.countryRiskPremium}
                    onChange={handleWaccComponentChange('countryRiskPremium')}
                    margin="dense"
                    disabled={calculationMethod !== 'wacc'}
                  />
                </Grid>
              </Grid>
              
              {calculationMethod === 'wacc' && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography>
                    Calculated WACC: <strong>{displayWacc()}</strong>
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={applyWacc}
                    disabled={actualWacc === null}
                  >
                    Apply WACC as Discount Rate
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sensitivity Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              NPV Sensitivity to Discount Rate
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sensitivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="discountRate" 
                    label={{ value: 'Discount Rate (%)', position: 'insideBottomRight', offset: -10 }} 
                  />
                  <YAxis 
                    label={{ value: 'NPV', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'NPV']}
                    labelFormatter={(label) => `Discount Rate: ${label}%`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="npv"
                    name="Net Present Value"
                    stroke="#3f51b5"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiscountRateCalculator; 