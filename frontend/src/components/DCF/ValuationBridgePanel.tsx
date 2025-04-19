import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { PALETTE } from '../../theme';

export interface ValuationBridgeStep {
  label: string;
  impact: number;
  cumulativeValue: number;
}

interface BridgeVariable {
  name: string;
  path: string;
  currentValue: string | number;
  newValue: string | number;
}

interface ValuationBridgePanelProps {
  valuationBridge: ValuationBridgeStep[];
  variables: BridgeVariable[];
  currentNPV: number;
  onAddVariable: (variable: BridgeVariable) => void;
  onRemoveVariable: (index: number) => void;
  onGenerateBridge: () => void;
  isLoading: boolean;
}

export default function ValuationBridgePanel({
  valuationBridge,
  variables,
  currentNPV,
  onAddVariable,
  onRemoveVariable,
  onGenerateBridge,
  isLoading,
}: ValuationBridgePanelProps) {
  const [selectedVariable, setSelectedVariable] = useState('');
  const [newValue, setNewValue] = useState('');

  // List of available variables that can be adjusted in the bridge
  const availableVariables = [
    { name: 'Discount Rate', path: 'model.discountRate' },
    { name: 'Electricity Price', path: 'pricing.merchant.price' },
    { name: 'Capacity Factor', path: 'production.bottomUp.capacityYield' },
    { name: 'Tax Rate', path: 'tax.corporateRate' },
    { name: 'Initial CAPEX', path: 'financial.capex.initial' },
    { name: 'Contracted Price', path: 'pricing.contracted.price' },
  ];

  // Get filtered list that excludes already added variables
  const filteredVariables = availableVariables.filter(
    (v) => !variables.find((added) => added.name === v.name)
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const handleVariableChange = (event: SelectChangeEvent) => {
    setSelectedVariable(event.target.value);
  };

  const handleAddVariable = () => {
    if (!selectedVariable || !newValue) return;

    const varInfo = availableVariables.find((v) => v.name === selectedVariable);
    if (!varInfo) return;

    onAddVariable({
      name: varInfo.name,
      path: varInfo.path,
      currentValue: 0, // This will be filled in by the parent component
      newValue: parseFloat(newValue),
    });

    // Reset fields
    setSelectedVariable('');
    setNewValue('');
  };

  // Waterfall chart component
  const BridgeChart: React.FC<{ data: ValuationBridgeStep[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    // Calculate absolute positions for each bar in the waterfall
    const processedData = data.map((step, index) => {
      // For first bar (base value)
      if (index === 0) {
        return {
          name: step.label,
          start: 0,
          value: step.cumulativeValue,  // First bar starts from 0 and goes up to base value
          impact: 0,
          cumulative: step.cumulativeValue,
          fill: PALETTE.darkGray,
          isSpecial: true,
          isBase: true,
          isFinal: false
        };
      }
      
      // For last bar (final value)
      if (index === data.length - 1 && step.label.includes('Final')) {
        return {
          name: step.label,
          start: 0,
          value: step.cumulativeValue,  // Final bar shows the total value
          impact: 0,
          cumulative: step.cumulativeValue,
          fill: PALETTE.darkGray,
          isSpecial: true,
          isBase: false,
          isFinal: true
        };
      }
      
      // For interim steps, we track both the start position and the impact
      const previousValue = data[index - 1].cumulativeValue;
      const isPositive = step.impact >= 0;
      
      return {
        name: step.label,
        start: isPositive ? previousValue : previousValue + step.impact,
        value: Math.abs(step.impact),  // Bar height is absolute value of impact
        impact: step.impact,
        cumulative: step.cumulativeValue,
        previousValue: previousValue, // Store the previous value for display
        fill: isPositive ? PALETTE.orange : PALETTE.red,
        isSpecial: false,
        isBase: false,
        isFinal: false
      };
    });
    
    // Calculate max value for y-axis scaling including some padding
    const maxValue = Math.max(...data.map(d => d.cumulativeValue)) * 1.2;
    
    // Custom label component for the bars
    const CustomLabel = (props: any) => {
      const { x, y, width, height, value, index } = props;
      const item = processedData[index];
      
      if (!item) return <></>;
      
      // Don't show labels for very small impacts
      if (Math.abs(item.impact) / maxValue < 0.02 && !item.isSpecial) {
        return <></>;
      }
      
      // Base/Final labels - just show the value
      if (item.isBase || item.isFinal) {
        return (
          <text 
            x={x + width / 2} 
            y={y - 10} 
            fill="#333" 
            textAnchor="middle" 
            dominantBaseline="auto"
            fontSize={12}
            fontWeight="bold"
          >
            ${(item.cumulative / 1000000).toFixed(1)}M
          </text>
        );
      }
      
      // Impact labels - show only the impact
      const isPositive = item.impact >= 0;
      const sign = isPositive ? '+' : '';
      
      return (
        <text 
          x={x + width / 2} 
          y={isPositive ? y - 10 : y + height + 15} 
          fill="#333" 
          textAnchor="middle" 
          dominantBaseline="auto"
          fontSize={11}
        >
          {sign}${(Math.abs(item.impact) / 1000000).toFixed(1)}M
        </text>
      );
    };
    
    return (
      <Box sx={{ height: 450, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart
            data={processedData}
            margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-30}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              domain={[0, maxValue]}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              label={{ value: 'Value ($M)', angle: -90, position: 'insideLeft', offset: -5 }}
            />
            <RechartsTooltip 
              formatter={(value, name, props) => {
                const item = props.payload;
                if (!item) return [value, name];
                
                if (item.isBase) {
                  return [`$${(item.cumulative / 1000000).toFixed(1)}M`, 'Base Value'];
                }
                
                if (item.isFinal) {
                  return [`$${(item.cumulative / 1000000).toFixed(1)}M`, 'Final Value'];
                }
                
                // For impact bars, show both previous value and impact
                const isPositive = item.impact >= 0;
                const sign = isPositive ? '+' : '';
                return [
                  <span>
                    Starting: ${(item.previousValue / 1000000).toFixed(1)}M<br/>
                    Impact: {sign}${(Math.abs(item.impact) / 1000000).toFixed(1)}M<br/>
                    Final: ${(item.cumulative / 1000000).toFixed(1)}M
                  </span>,
                  item.name
                ];
              }}
            />
            <Bar 
              dataKey="value" 
              stackId="stack"
              label={CustomLabel}
            >
              {processedData.map((entry, index) => {
                // Skip the final bar for regular rendering
                if (index === processedData.length - 1 && entry.isFinal) return null;
                
                return <Cell key={`cell-${index}`} fill={entry.fill} />;
              })}
            </Bar>
            
            {/* Render the final value as a separate bar for better visibility */}
            {processedData.length > 0 && processedData[processedData.length - 1].isFinal && (
              <Bar 
                dataKey="value" 
                data={[processedData[processedData.length - 1]]}
                fill={PALETTE.darkGray}
                label={CustomLabel}
              />
            )}
            
            {/* Add connectors between the bars to show the progression */}
            {processedData.map((entry, index) => {
              // Skip first and last items
              if (index === 0 || index === processedData.length - 1) return null;
              
              const prevCumulative = processedData[index - 1].cumulative;
              
              return (
                <ReferenceLine
                  key={`ref-${index}`}
                  y={prevCumulative}
                  stroke="#666"
                  strokeDasharray="3 3"
                  segment={[
                    { x: index - 0.4, y: prevCumulative },
                    { x: index + 0.4, y: prevCumulative }
                  ]}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Valuation Bridge
      </Typography>
      <Typography variant="body2" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        A valuation bridge shows how specific changes to input parameters affect the enterprise value.
        Add variables below to see their impact on the final value.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <FormControl fullWidth>
            <InputLabel>Select Variable</InputLabel>
            <Select
              value={selectedVariable}
              onChange={handleVariableChange}
              label="Select Variable"
            >
              {filteredVariables.map((variable) => (
                <MenuItem key={variable.name} value={variable.name}>
                  {variable.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="New Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            type="number"
            placeholder="Enter new value"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddVariable}
            disabled={!selectedVariable || !newValue}
            sx={{ height: '100%' }}
          >
            Add
          </Button>
        </Grid>
      </Grid>

      {/* Variables Table */}
      {variables.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Variable</TableCell>
                <TableCell align="right">Current Value</TableCell>
                <TableCell align="right">New Value</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variables.map((variable, index) => (
                <TableRow key={index}>
                  <TableCell>{variable.name}</TableCell>
                  <TableCell align="right">{variable.currentValue}</TableCell>
                  <TableCell align="right">{variable.newValue}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove Variable">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onRemoveVariable(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Generate Bridge Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={20} /> : <RunIcon />}
          onClick={onGenerateBridge}
          disabled={variables.length === 0 || isLoading}
        >
          {isLoading ? 'Generating Bridge...' : 'Generate Valuation Bridge'}
        </Button>
      </Box>

      {/* Valuation Bridge Chart */}
      {valuationBridge.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Enterprise Value Bridge
          </Typography>
          
          {/* Chart Visualization of Valuation Bridge */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <BridgeChart data={valuationBridge} />
          </Paper>

          {/* Tabular Data for Valuation Bridge */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell align="right">Starting Value</TableCell>
                  <TableCell align="right">Impact</TableCell>
                  <TableCell align="right">Final Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {valuationBridge.map((step, index) => {
                  // For the base value (first step)
                  if (index === 0) {
                    return (
                      <TableRow key={index}>
                        <TableCell>{step.label}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">{formatCurrency(step.cumulativeValue)}</TableCell>
                      </TableRow>
                    );
                  }
                  
                  // For the final value (last step if it's labeled as Final)
                  if (index === valuationBridge.length - 1 && step.label.includes('Final')) {
                    return (
                      <TableRow key={index}>
                        <TableCell>{step.label}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">{formatCurrency(step.cumulativeValue)}</TableCell>
                      </TableRow>
                    );
                  }
                  
                  // For interim steps (variable impacts)
                  const previousValue = valuationBridge[index - 1].cumulativeValue;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{step.label}</TableCell>
                      <TableCell align="right">{formatCurrency(previousValue)}</TableCell>
                      <TableCell align="right">
                        {`${step.impact >= 0 ? '+' : ''}${formatCurrency(step.impact)}`}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(step.cumulativeValue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}