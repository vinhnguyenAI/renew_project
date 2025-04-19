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
  IconButton,
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
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';

interface SensitivityVariable {
  name: string;
  baseValue: string;
  range: {
    low: string;
    high: string;
    step: string;
  };
}

interface SensitivityPanelProps {
  variables: SensitivityVariable[];
  onAddVariable: (variable: SensitivityVariable) => void;
  onRemoveVariable: (index: number) => void;
  onRunAnalysis: () => void;
  isLoading: boolean;
}

export default function SensitivityPanel({
  variables,
  onAddVariable,
  onRemoveVariable,
  onRunAnalysis,
  isLoading,
}: SensitivityPanelProps) {
  const [newVariable, setNewVariable] = useState<SensitivityVariable>({
    name: '',
    baseValue: '',
    range: {
      low: '',
      high: '',
      step: '',
    },
  });

  // Predefined variables with common ranges for sensitivity analysis
  const predefinedVariables = [
    // Core financial variables
    { name: "Discount Rate", defaultRange: { low: "7.0", high: "10.0", step: "0.5" } },
    { name: "Electricity Price", defaultRange: { low: "40", high: "80", step: "5" } },
    { name: "Capacity Factor", defaultRange: { low: "80", high: "90", step: "2" } },
    
    // Tax variables
    { name: "Corporate Tax Rate", defaultRange: { low: "15", high: "35", step: "5" } },
    { name: "Tax Loss Opening Balance", defaultRange: { low: "0", high: "1000000", step: "200000" } },
    { name: "Tax Loss Expiry Period", defaultRange: { low: "0", high: "10", step: "1" } },
    
    // CAPEX variables
    { name: "Initial CAPEX", defaultRange: { low: "-20", high: "20", step: "10" } },
    { name: "Ongoing CAPEX", defaultRange: { low: "100000", high: "500000", step: "50000" } },
    
    // Capacity market variables
    { name: "Capacity Market Revenue", defaultRange: { low: "0", high: "200000", step: "50000" } },
    { name: "Capacity Market Escalation", defaultRange: { low: "0", high: "5", step: "0.5" } },
    { name: "Capacity Market Term", defaultRange: { low: "5", high: "25", step: "5" } },
    
    // Cost variables
    { name: "O&M Costs", defaultRange: { low: "250000", high: "450000", step: "50000" } },
    { name: "Maintenance Costs", defaultRange: { low: "150000", high: "350000", step: "50000" } },
    { name: "Insurance Costs", defaultRange: { low: "80000", high: "150000", step: "10000" } },
    
    // Other financial variables
    { name: "Interest Rate", defaultRange: { low: "3", high: "8", step: "0.5" } },
    { name: "Inflation Rate", defaultRange: { low: "1", high: "4", step: "0.5" } },
  ];

  const handleVariableNameChange = (event: SelectChangeEvent) => {
    const selectedName = event.target.value;
    // Find the predefined variable to get default ranges
    const predefined = predefinedVariables.find(v => v.name === selectedName);
    
    if (predefined) {
      // Populate with predefined range values
      setNewVariable(prev => ({
        ...prev,
        name: selectedName,
        range: {
          low: predefined.defaultRange.low,
          high: predefined.defaultRange.high,
          step: predefined.defaultRange.step,
        }
      }));
    } else {
      // Just update the name
      setNewVariable(prev => ({
        ...prev,
        name: selectedName
      }));
    }
  };

  const handleAddVariable = () => {
    onAddVariable(newVariable);
    setNewVariable({
      name: '',
      baseValue: '',
      range: {
        low: '',
        high: '',
        step: '',
      },
    });
  };

  const availableVariables = predefinedVariables
    .filter(v => !variables.find(existing => existing.name === v.name))
    .map(v => v.name);

  return (
    <Box sx={{ p: 3 }}>
      {/* Variables Section */}
      <Typography variant="h6" gutterBottom>
        Sensitivity Variables
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Variable Name</InputLabel>
            <Select
              value={newVariable.name}
              onChange={handleVariableNameChange}
              label="Variable Name"
            >
              {availableVariables.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Base Value"
            value={newVariable.baseValue}
            onChange={(e) =>
              setNewVariable((prev) => ({ ...prev, baseValue: e.target.value }))
            }
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Low Range"
            value={newVariable.range.low}
            onChange={(e) =>
              setNewVariable((prev) => ({
                ...prev,
                range: { ...prev.range, low: e.target.value },
              }))
            }
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="High Range"
            value={newVariable.range.high}
            onChange={(e) =>
              setNewVariable((prev) => ({
                ...prev,
                range: { ...prev.range, high: e.target.value },
              }))
            }
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Step Size"
            value={newVariable.range.step}
            onChange={(e) =>
              setNewVariable((prev) => ({
                ...prev,
                range: { ...prev.range, step: e.target.value },
              }))
            }
          />
        </Grid>
        <Grid item xs={12} md={1}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={handleAddVariable}
            disabled={!newVariable.name || !newVariable.baseValue}
            sx={{ height: '100%' }}
          >
            <AddIcon />
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
                <TableCell align="right">Base Value</TableCell>
                <TableCell align="right">Range</TableCell>
                <TableCell align="right">Step</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variables.map((variable, index) => (
                <TableRow key={index}>
                  <TableCell>{variable.name}</TableCell>
                  <TableCell align="right">{variable.baseValue}</TableCell>
                  <TableCell align="right">
                    {variable.range.low} - {variable.range.high}
                  </TableCell>
                  <TableCell align="right">{variable.range.step}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove Variable">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveVariable(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Run Analysis Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={20} /> : <RunIcon />}
          onClick={onRunAnalysis}
          disabled={variables.length === 0 || isLoading}
        >
          {isLoading ? 'Running Analysis...' : 'Run Sensitivity Analysis'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        The Step Size determines the increment between values in the analysis range. For example, with a Discount Rate range of 7.0% to 10.0% and a Step Size of 0.5%, the analysis will calculate results at 7.0%, 7.5%, 8.0%, 8.5%, etc.
      </Typography>
    </Box>
  );
} 