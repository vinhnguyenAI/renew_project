import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  Alert,
  Snackbar,
  Tooltip,
  Modal,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  GetApp as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as TemplateIcon,
  Description as CsvIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TableView as TableViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { dcfApi, DCFFormData } from '../../services/api';
import { DCFResults } from './ResultsPanel';
import { PALETTE } from '../../theme';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import * as Papa from 'papaparse';

// Template types
const TEMPLATE_TYPES = [
  { id: 'solar-standard', name: 'Solar - Standard' },
  { id: 'wind-standard', name: 'Wind - Standard' },
  { id: 'hydro-standard', name: 'Hydro - Standard' },
];

// Parameters that can be batched
const BATCH_PARAMETERS = [
  { id: 'capacity', name: 'Capacity (MW)', group: 'production.bottomUp' },
  { id: 'capacityYield', name: 'Capacity Yield (%)', group: 'production.bottomUp' },
  { id: 'price', name: 'Contracted Price', group: 'pricing.contracted' },
  { id: 'percentage', name: 'Contracted Percentage (%)', group: 'pricing.contracted' },
  { id: 'discountRate', name: 'Discount Rate (%)', group: 'model' },
  { id: 'initial', name: 'Initial CAPEX', group: 'financial.capex' },
  { id: 'interestRate', name: 'Interest Rate (%)', group: 'debt' },
];

interface BatchItem {
  id: string;
  templateId: string;
  name: string;
  paramOverrides: {
    [key: string]: {
      [key: string]: string;
    };
  };
  results: DCFResults | null;
}

interface BatchComparisonProps {
  onBack: () => void;
}

export default function BatchProcessing({ onBack }: BatchComparisonProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('solar-standard');
  const [parameterName, setParameterName] = useState(BATCH_PARAMETERS[0].id);
  const [parameterGroup, setParameterGroup] = useState(BATCH_PARAMETERS[0].group);
  const [paramValues, setParamValues] = useState<string[]>(['']);
  const [batchName, setBatchName] = useState('New Batch Analysis');
  const [batchDescription, setBatchDescription] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // New state for CSV upload functionality
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<string | null>(null);

  // Toggle parameter details
  const toggleParameterDetails = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all parameter details visibility
  const toggleAllParameterDetails = (show: boolean) => {
    const newExpandedItems: Record<string, boolean> = {};
    batchItems.forEach(item => {
      newExpandedItems[item.id] = show;
    });
    setExpandedItems(newExpandedItems);
  };

  // Fill with a few default items
  useEffect(() => {
    if (batchItems.length === 0) {
      const defaultItems = [
        {
          id: '1',
          templateId: 'solar-standard',
          name: 'Solar - 50MW',
          paramOverrides: {
            'production.bottomUp': {
              'capacity': '50',
            },
          },
          results: null,
        },
        {
          id: '2',
          templateId: 'solar-standard',
          name: 'Solar - 100MW',
          paramOverrides: {
            'production.bottomUp': {
              'capacity': '100',
            },
          },
          results: null,
        },
        {
          id: '3',
          templateId: 'wind-standard',
          name: 'Wind - 150MW',
          paramOverrides: {
            'production.bottomUp': {
              'capacity': '150',
            },
          },
          results: null,
        },
      ];
      
      setBatchItems(defaultItems);
      
      // Initialize all items as collapsed
      const initialExpandedState: Record<string, boolean> = {};
      defaultItems.forEach(item => {
        initialExpandedState[item.id] = false;
      });
      setExpandedItems(initialExpandedState);
    }
  }, []);

  const handleAddValue = () => {
    setParamValues([...paramValues, '']);
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...paramValues];
    newValues[index] = value;
    setParamValues(newValues);
  };

  const handleRemoveValue = (index: number) => {
    const newValues = [...paramValues];
    newValues.splice(index, 1);
    setParamValues(newValues);
  };

  const handleParameterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const paramId = event.target.value as string;
    const param = BATCH_PARAMETERS.find(p => p.id === paramId);
    if (param) {
      setParameterName(paramId);
      setParameterGroup(param.group);
    }
  };

  const handleAddBatchItems = () => {
    // Filter out empty values
    const validValues = paramValues.filter(v => v.trim() !== '');
    
    // Don't add if no valid values
    if (validValues.length === 0) return;

    // Get template data
    setLoading(true);
    dcfApi.getTemplateData(selectedTemplate)
      .then(templateData => {
        // Create a new batch item for each parameter value
        const newItems = validValues.map((value, index) => {
          const paramName = BATCH_PARAMETERS.find(p => p.id === parameterName)?.name || '';
          return {
            id: Date.now().toString() + index,
            templateId: selectedTemplate,
            name: `${TEMPLATE_TYPES.find(t => t.id === selectedTemplate)?.name || 'Template'} - ${paramName} ${value}`,
            paramOverrides: {
              [parameterGroup]: {
                [parameterName]: value,
              },
            },
            results: null,
          };
        });

        setBatchItems([...batchItems, ...newItems]);
        setParamValues(['']); // Reset values
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching template data:', error);
        setLoading(false);
      });
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  // Helper function to ensure template data has all required fields
  const ensureRequiredFields = (templateData: DCFFormData) => {
    // Ensure model dates are set
    const today = new Date().toISOString().split('T')[0];
    
    if (!templateData.model) templateData.model = {} as any;
    if (!templateData.model.startDate) templateData.model.startDate = today;
    if (!templateData.model.valuationDate) templateData.model.valuationDate = today;
    if (!templateData.model.codDate) templateData.model.codDate = today;
    if (!templateData.model.capexDate) templateData.model.capexDate = today;
    if (!templateData.model.forecastPeriod) templateData.model.forecastPeriod = '25';
    if (!templateData.model.discountRate) templateData.model.discountRate = '8.5';
    if (!templateData.model.terminalValue) {
      templateData.model.terminalValue = {
        method: 'perpetuity' as 'perpetuity' | 'exitMultiple' | 'none',
        growthRate: '1.5',
        multiple: '10'
      };
    }
    
    // Ensure production parameters
    if (!templateData.production) templateData.production = {} as any;
    if (!templateData.production.bottomUp) templateData.production.bottomUp = {} as any;
    if (!templateData.production.simplified) templateData.production.simplified = {} as any;
    
    // Ensure financial parameters
    if (!templateData.financial) templateData.financial = {} as any;
    if (!templateData.financial.capex) templateData.financial.capex = {} as any;
    if (!templateData.financial.workingCapital) templateData.financial.workingCapital = {} as any;
    if (!templateData.financial.depreciation) templateData.financial.depreciation = {} as any;
    
    // Ensure pricing parameters
    if (!templateData.pricing) templateData.pricing = {} as any;
    if (!templateData.pricing.contracted) templateData.pricing.contracted = {} as any;
    if (!templateData.pricing.merchant) templateData.pricing.merchant = {} as any;
    if (!templateData.pricing.regulatory) templateData.pricing.regulatory = {} as any;
    
    // Ensure costs parameters
    if (!templateData.costs) templateData.costs = {} as any;
    
    // Ensure tax parameters
    if (!templateData.tax) templateData.tax = {} as any;
    
    // Ensure debt parameters
    if (!templateData.debt) templateData.debt = {} as any;
    
    return templateData;
  };

  const handleRunBatchItem = async (id: string) => {
    const item = batchItems.find(item => item.id === id);
    if (!item) return;

    setProcessing(prev => [...prev, id]);

    try {
      // Get sample data as starting point
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/DCF/sample-data`);
      const sampleData = await response.json();
      
      // Create a complete input object with overrides
      let inputData = {...sampleData};
      
      // Set the asset name based on the batch item
      inputData.assetName = item.name;
      
      // Extract dates from parameter overrides if available
      const modelStartDate = item.paramOverrides.dates?.modelStartDate;
      const valuationDate = item.paramOverrides.dates?.valuationDate;
      const codDate = item.paramOverrides.dates?.codDate;
      const capexDate = item.paramOverrides.dates?.capexDate;
      
      // Apply date overrides if available
      if (modelStartDate) {
        inputData.modelStartDate = modelStartDate;
      }
      
      if (valuationDate) {
        inputData.valuationDate = valuationDate;
      }
      
      if (codDate) {
        inputData.codDate = codDate;
      }
      
      // Apply all other parameter overrides
      Object.entries(item.paramOverrides).forEach(([group, params]) => {
        Object.entries(params).forEach(([param, value]) => {
          // For nested groups like 'production.bottomUp'
          if (group.includes('.')) {
            const [mainGroup, subGroup] = group.split('.');
            
            // Handle capacity - direct field in the C# model
            if (mainGroup === 'production' && subGroup === 'bottomUp' && param === 'capacity') {
              inputData.capacity = parseFloat(value);
            }
            // Handle capacityYield - direct field in the C# model
            else if (mainGroup === 'production' && subGroup === 'bottomUp' && param === 'capacityYield') {
              inputData.capacityYield = parseFloat(value) / 100; // Convert from percentage
            }
            // Handle discountRate - direct field in the C# model
            else if (mainGroup === 'model' && param === 'discountRate') {
              inputData.discountRate = parseFloat(value) / 100; // Convert from percentage
            }
            // Handle initial CAPEX - needs to be in the capex dictionary
            else if (mainGroup === 'financial' && subGroup === 'capex' && param === 'initial') {
              // Use the capexDate if provided, otherwise use current year
              const year = capexDate ? new Date(capexDate).getFullYear().toString() : new Date().getFullYear().toString();
              inputData.capex = { [year]: parseFloat(value) };
            }
          } else if (group === 'model') {
            // Handle direct model parameters
            if (param === 'forecastPeriod') {
              inputData.forecastLength = parseInt(value);
            }
          } else if (group === 'financialAssumptions') {
            // Map financial assumptions
            if (param === 'forecastLength') {
              inputData.forecastLength = parseInt(value);
            } else if (param === 'discountRate') {
              inputData.discountRate = parseFloat(value) / 100;
            }
          } else if (group === 'asset') {
            // Handle asset parameters
            if (param === 'capacity') {
              inputData.capacity = parseFloat(value);
            } else if (param === 'type') {
              inputData.assetType = value;
            }
          } else if (group === 'dates') {
            // Handle date fields
            if (param === 'modelStartDate') {
              inputData.modelStartDate = value;
            } else if (param === 'valuationDate') {
              inputData.valuationDate = value;
            } else if (param === 'codDate') {
              inputData.codDate = value; // Commercial Operation Date
            } else if (param === 'capexDate') {
              // Set both the capexDate and update the capex dictionary with the right year
              inputData.capexDate = value;
              // Update the capex year
              const capexYear = new Date(value).getFullYear().toString();
              if (inputData.capex) {
                const capexAmount = Object.values(inputData.capex)[0];
                inputData.capex = { [capexYear]: capexAmount };
              }
            }
          }
        });
      });
      
      console.log('Sending modified data to backend:', inputData);
      
      // Make the API call to calculate
      const calcResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/DCF/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
      });
      
      const result = await calcResponse.json();
      console.log('Calculation result:', result);
      
      // Convert to the format expected by the frontend
      const formattedResult = {
        enterpriseValue: result.npv,
        equityValue: result.npv - (inputData.debtAmount || 0),
        npv: result.npv,
        irr: result.irr,
        paybackPeriod: result.paybackPeriod,
        dscr: { min: 0, average: 0 },
        yearlyResults: result.annualCashFlows.map((cf: number, i: number) => ({
          year: new Date(inputData.modelStartDate).getFullYear() + i,
          fcf: cf,
          dcf: cf / Math.pow(1 + (inputData.discountRate || 0.085), i)
        }))
      };
      
      // Update batch item with results
      setBatchItems(prev => prev.map(bi => 
        bi.id === id ? { ...bi, results: formattedResult } : bi
      ));
    } catch (error) {
      console.error('Error processing batch item:', error);
    } finally {
      setProcessing(prev => prev.filter(p => p !== id));
    }
  };

  // Helper function to generate CSV template
  const generateCsvTemplate = () => {
    // Create headers based on DCF input structure
    const headers = [
      'assetName',
      'assetType',
      'location',
      'capacity',
      'capacityYield',
      'degradationRate',
      'availability',
      'contractedPrice',
      'contractedEscalationRate',
      'merchantPrice',
      'merchantEscalationRate',
      'contractPercentage',
      'regulatoryPrice',
      'discountRate',
      'forecastLength',
      'operatingCost',
      'costInflationRate',
      'taxRate',
      'depreciationMethod',
      'depreciationYears',
      'receivableDays',
      'payableDays',
      'inventoryDays',
      'initialCapex',
      'capexInflationRate',
      'debtAmount',
      'interestRate',
      'terminalValueMethod',
      'terminalGrowthRate',
      'terminalMultiple',
    ];

    // Create example row with sample data (from the API)
    const exampleRow = [
      'Solar Asset 1',
      'solar',
      'California',
      '50',
      '85',
      '0.5',
      '98',
      '65',
      '2.5',
      '45',
      '1.5',
      '70',
      '0',
      '8.5',
      '25',
      '350000',
      '2.5',
      '21',
      'straight_line',
      '25',
      '45',
      '30',
      '15',
      '75000000',
      '1.8',
      '50000000',
      '5.5',
      'perpetuity',
      '1.5',
      '10',
    ];

    // Add a second example row
    const secondRow = [
      'Wind Asset 1',
      'wind',
      'Texas',
      '100',
      '42',
      '0.3',
      '95',
      '55',
      '2.0',
      '40',
      '1.2',
      '60',
      '0',
      '7.5',
      '20',
      '450000',
      '2.0',
      '21',
      'straight_line',
      '20',
      '45',
      '30',
      '15',
      '100000000',
      '1.5',
      '70000000',
      '5.0',
      'perpetuity',
      '1.0',
      '8',
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      exampleRow.join(','),
      secondRow.join(','),
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dcf_batch_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download complete template from the server
  const downloadCompleteTemplate = () => {
    window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/DCF/batch-template`, '_blank');
  };

  // Handle CSV file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setCsvFile(file);
      
      // Parse the CSV file using the correct overload for File objects
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          if (results.data && results.data.length > 0) {
            setCsvData(results.data);
            setSnackbarMessage(`Successfully loaded ${results.data.length} assets from CSV`);
            setSnackbarSeverity('success');
            setShowSnackbar(true);
            
            // Convert CSV data to batch items
            const newItems = results.data.map((row, index) => {
              // Generate a unique ID
              const id = Date.now().toString() + index;
              
              // Map CSV columns to parameter overrides
              const paramOverrides: Record<string, Record<string, string>> = {
                'asset': {
                  'name': row.assetName || `Asset ${index + 1}`,
                  'type': row.assetType || 'solar',
                  'location': row.location || '',
                  'capacity': row.capacity || '50',
                },
                'production.bottomUp': {
                  'capacity': row.capacity || '50',
                  'capacityYield': row.capacityYield || '85',
                  'degradationRate': row.degradationRate || '0.5',
                  'availability': row.availability || '98',
                },
                'pricing.contracted': {
                  'price': row.contractedPrice || '65',
                  'percentage': row.contractPercentage || '70',
                  'escalationRate': row.contractedEscalationRate || '2.5',
                },
                'pricing.merchant': {
                  'price': row.merchantPrice || '45',
                  'priceGrowth': row.merchantEscalationRate || '1.5',
                },
                'pricing.regulatory': {
                  'price': row.regulatoryPrice || '0',
                },
                'financialAssumptions': {
                  'discountRate': row.discountRate || '8.5',
                  'forecastLength': row.forecastLength || '25',
                },
                'model': {
                  'terminalValue.method': row.terminalValueMethod || 'perpetuity',
                  'terminalValue.growthRate': row.terminalGrowthRate || '1.5',
                  'terminalValue.multiple': row.terminalMultiple || '10',
                },
                'financial.capex': {
                  'initial': row.initialCapex || '75000000',
                },
                'financial.workingCapital': {
                  'receivableDays': row.receivableDays || '45',
                  'payableDays': row.payableDays || '30',
                  'inventoryDays': row.inventoryDays || '15',
                },
                'financial.depreciation': {
                  'method': row.depreciationMethod || 'straight_line',
                  'period': row.depreciationYears || '25',
                },
                'costs': {
                  'method': 'manual',
                  'operationalCosts': row.operatingCost || '350000',
                  'costInflation': row.costInflationRate || '2.5',
                },
                'tax': {
                  'corporateRate': row.taxRate || '21',
                },
                'debt': {
                  'amount': row.debtAmount || '50000000',
                  'interestRate': row.interestRate || '5.5',
                },
                'macro': {
                  'costInflation': row.costInflationRate || '2.5',
                  'capexInflation': row.capexInflationRate || '1.8',
                },
                // Add date fields
                'dates': {}
              };
              
              // Parse date fields
              if (row.modelStartDate) {
                paramOverrides.dates['modelStartDate'] = row.modelStartDate;
              }
              
              if (row.valuationDate) {
                paramOverrides.dates['valuationDate'] = row.valuationDate;
              }
              
              if (row.commercialOperationDate || row.codDate) {
                paramOverrides.dates['codDate'] = row.commercialOperationDate || row.codDate;
              }
              
              if (row.capexDate) {
                paramOverrides.dates['capexDate'] = row.capexDate;
              }
              
              // If dates weren't provided but we have a custom year, create date values
              if (!paramOverrides.dates['modelStartDate'] && row.modelStartYear) {
                paramOverrides.dates['modelStartDate'] = `${row.modelStartYear}-01-01`;
              }
              
              if (!paramOverrides.dates['valuationDate'] && row.valuationYear) {
                paramOverrides.dates['valuationDate'] = `${row.valuationYear}-01-01`;
              }
              
              if (!paramOverrides.dates['codDate'] && row.commercialOperationYear) {
                paramOverrides.dates['codDate'] = `${row.commercialOperationYear}-01-01`;
              }
              
              if (!paramOverrides.dates['capexDate'] && row.capexYear) {
                paramOverrides.dates['capexDate'] = `${row.capexYear}-01-01`;
              }
              
              // Create batch item
              return {
                id,
                templateId: row.assetType === 'wind' ? 'wind-standard' : 
                           row.assetType === 'hydro' ? 'hydro-standard' : 'solar-standard',
                name: row.assetName || `Asset ${index + 1}`,
                paramOverrides,
                results: null,
              };
            });
            
            // Update batch items with the new items from CSV
            setBatchItems(newItems);
          } else {
            setSnackbarMessage('CSV file is empty or invalid');
            setSnackbarSeverity('error');
            setShowSnackbar(true);
          }
        },
        error: function(parseError: Error) {
          console.error('Error parsing CSV:', parseError);
          setSnackbarMessage('Error parsing CSV file');
          setSnackbarSeverity('error');
          setShowSnackbar(true);
        }
      });
    }
  };

  // Run all batch items
  const handleRunAllBatch = async () => {
    setLoading(true);
    
    try {
      // Process all items sequentially for better performance and to avoid rate limiting
      for (const item of batchItems) {
        await handleRunBatchItem(item.id);
      }
      
      setSnackbarMessage('All batch items processed successfully');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error processing batch:', error);
      setSnackbarMessage('Error processing batch');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercentage = (value: number) =>
    // Check for sentinel value (-999) which indicates IRR calculation failure
    value === -999 ? 'N/A' : new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

  const formatDecimal = (value: number) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

  // Generate chart data
  const npvChartData = batchItems
    .filter(item => item.results)
    .map(item => ({
      name: item.name,
      NPV: item.results?.npv || 0,
    }));

  const irrChartData = batchItems
    .filter(item => item.results)
    .map(item => ({
      name: item.name,
      IRR: item.results?.irr || 0,
    }));

  // Render a summary of key parameters when details are hidden
  const renderParameterSummary = (item: BatchItem) => {
    // Extract key parameters for summary display
    const assetType = item.paramOverrides.asset?.type || '-';
    const capacity = item.paramOverrides.asset?.capacity || '-';
    const discountRate = item.paramOverrides.financialAssumptions?.discountRate || '-';
    const forecastLength = item.paramOverrides.financialAssumptions?.forecastLength || '-';
    
    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" component="span">
            <strong>Type:</strong> {assetType}
          </Typography>
          <Typography variant="body2" component="span">
            <strong>Capacity:</strong> {capacity} MW
          </Typography>
          <Typography variant="body2" component="span">
            <strong>Discount Rate:</strong> {typeof discountRate === 'number' ? `${(discountRate * 100).toFixed(1)}%` : discountRate}
          </Typography>
          <Typography variant="body2" component="span">
            <strong>Years:</strong> {forecastLength}
          </Typography>
        </Box>
        <Tooltip title="Show All Parameters">
          <IconButton 
            size="small" 
            onClick={() => toggleParameterDetails(item.id)}
            sx={{ position: 'absolute', top: 0, right: 0 }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Open yearly results detail modal
  const handleOpenYearlyResults = (id: string) => {
    setSelectedDetailItem(id);
  };

  // Close yearly results detail modal
  const handleCloseYearlyResults = () => {
    setSelectedDetailItem(null);
  };

  // Find the currently selected item
  const selectedItem = selectedDetailItem 
    ? batchItems.find(item => item.id === selectedDetailItem) 
    : null;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Batch DCF Processing
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Process multiple assets at once by uploading a CSV template
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="CSV Template Upload" />
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<TemplateIcon />}
                    onClick={generateCsvTemplate}
                  >
                    Generate Simple Template
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<TemplateIcon />}
                    onClick={downloadCompleteTemplate}
                  >
                    Download Complete Template
                  </Button>
                </Grid>
                <Grid item>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload CSV
                  </Button>
                </Grid>
                <Grid item>
                  {csvFile && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CsvIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {csvFile.name} - {(csvFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Note: The first asset will use sample data as a reference if enabled
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Batch Assets"
              action={
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Show All Parameters">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => toggleAllParameterDetails(true)}
                      sx={{ mr: 1 }}
                    >
                      Show All Details
                    </Button>
                  </Tooltip>
                  <Tooltip title="Hide All Parameters">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityOffIcon />}
                      onClick={() => toggleAllParameterDetails(false)}
                      sx={{ mr: 1 }}
                    >
                      Hide All Details
                    </Button>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<RunIcon />}
                    onClick={handleRunAllBatch}
                    disabled={loading || batchItems.length === 0}
                  >
                    Run All
                  </Button>
                </Box>
              }
            />
            <Divider />
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Name</TableCell>
                    <TableCell>Parameters</TableCell>
                    <TableCell>Enterprise Value</TableCell>
                    <TableCell>Equity Value</TableCell>
                    <TableCell>NPV</TableCell>
                    <TableCell>IRR</TableCell>
                    <TableCell>Payback Period</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No assets loaded. Upload a CSV template to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          {expandedItems[item.id] ? (
                            <Box sx={{ position: 'relative' }}>
                              <Typography variant="body2" component="div">
                                {Object.entries(item.paramOverrides).map(([group, params]) => (
                                  <Box key={group} sx={{ mb: 0.5 }}>
                                    {Object.entries(params).map(([param, value]) => (
                                      <Box key={param} sx={{ display: 'inline', mr: 1 }}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          component="span"
                                        >
                                          {param}:
                                        </Typography>{' '}
                                        <Typography variant="caption" component="span">
                                          {value}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                ))}
                              </Typography>
                              <Tooltip title="Hide Parameters">
                                <IconButton 
                                  size="small" 
                                  onClick={() => toggleParameterDetails(item.id)}
                                  sx={{ position: 'absolute', top: 0, right: 0 }}
                                >
                                  <VisibilityOffIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            renderParameterSummary(item)
                          )}
                        </TableCell>
                        <TableCell>
                          {processing.includes(item.id) ? (
                            <CircularProgress size={20} />
                          ) : item.results ? (
                            formatCurrency(item.results.enterpriseValue)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {processing.includes(item.id) ? (
                            <CircularProgress size={20} />
                          ) : item.results ? (
                            formatCurrency(item.results.equityValue)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {processing.includes(item.id) ? (
                            <CircularProgress size={20} />
                          ) : item.results ? (
                            formatCurrency(item.results.npv)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {processing.includes(item.id) ? (
                            <CircularProgress size={20} />
                          ) : item.results ? (
                            formatPercentage(item.results.irr)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {processing.includes(item.id) ? (
                            <CircularProgress size={20} />
                          ) : item.results ? (
                            item.results.paybackPeriod >= (item.results.yearlyResults?.length || 0)
                              ? 'Never'
                              : `${formatDecimal(item.results.paybackPeriod)} years`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRunBatchItem(item.id)}
                            disabled={processing.includes(item.id)}
                          >
                            <RunIcon fontSize="small" />
                          </IconButton>
                          {item.results && (
                            <Tooltip title="View Yearly Results">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenYearlyResults(item.id)}
                                disabled={processing.includes(item.id)}
                              >
                                <TableViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveBatchItem(item.id)}
                            disabled={processing.includes(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onBack} sx={{ mr: 2 }}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleRunAllBatch}
              disabled={loading || batchItems.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
            >
              Run All Calculations
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Yearly Results Detail Modal */}
      <Modal
        open={selectedDetailItem !== null}
        onClose={handleCloseYearlyResults}
        aria-labelledby="yearly-results-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 1000,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="yearly-results-modal-title" variant="h6" component="h2">
              Yearly Results: {selectedItem?.name}
            </Typography>
            <Box>
              <Tooltip title="Previous Asset">
                <span>
                  <IconButton 
                    onClick={() => {
                      if (selectedDetailItem && batchItems.length > 0) {
                        const currentIndex = batchItems.findIndex(item => item.id === selectedDetailItem);
                        const prevIndex = (currentIndex - 1 + batchItems.length) % batchItems.length;
                        setSelectedDetailItem(batchItems[prevIndex].id);
                      }
                    }} 
                    size="small"
                    disabled={batchItems.length <= 1}
                  >
                    <ExpandLessIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Next Asset">
                <span>
                  <IconButton 
                    onClick={() => {
                      if (selectedDetailItem && batchItems.length > 0) {
                        const currentIndex = batchItems.findIndex(item => item.id === selectedDetailItem);
                        const nextIndex = (currentIndex + 1) % batchItems.length;
                        setSelectedDetailItem(batchItems[nextIndex].id);
                      }
                    }} 
                    size="small"
                    disabled={batchItems.length <= 1}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton onClick={handleCloseYearlyResults} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {selectedItem?.results ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="subtitle2">NPV</Typography>
                    <Typography variant="h6">{formatCurrency(selectedItem.results.npv)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    <Typography variant="subtitle2">IRR</Typography>
                    <Typography variant="h6">{formatPercentage(selectedItem.results.irr)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="subtitle2">Payback Period</Typography>
                    <Typography variant="h6">
                      {selectedItem.results.paybackPeriod >= (selectedItem.results.yearlyResults?.length || 0)
                        ? 'Never'
                        : `${formatDecimal(selectedItem.results.paybackPeriod)} years`}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="subtitle2">Enterprise Value</Typography>
                    <Typography variant="h6">{formatCurrency(selectedItem.results.enterpriseValue)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <TableContainer component={Paper} sx={{ maxHeight: 'calc(90vh - 250px)' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Year</TableCell>
                      <TableCell align="right">Free Cash Flow</TableCell>
                      <TableCell align="right">Discounted Cash Flow</TableCell>
                      <TableCell align="right">Cumulative DCF</TableCell>
                      <TableCell align="right">% of Total NPV</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItem.results.yearlyResults?.map((yearResult, index) => {
                      // Calculate cumulative DCF
                      const cumulativeDCF = selectedItem.results?.yearlyResults
                        ?.slice(0, index + 1)
                        .reduce((sum, yr) => sum + yr.dcf, 0) || 0;
                      
                      // Calculate percentage of NPV
                      const percentOfNPV = selectedItem.results?.npv 
                        ? (yearResult.dcf / selectedItem.results.npv) * 100
                        : 0;
                      
                      return (
                        <TableRow key={yearResult.year}>
                          <TableCell>{yearResult.year}</TableCell>
                          <TableCell align="right">{formatCurrency(yearResult.fcf)}</TableCell>
                          <TableCell align="right">{formatCurrency(yearResult.dcf)}</TableCell>
                          <TableCell align="right">{formatCurrency(cumulativeDCF)}</TableCell>
                          <TableCell align="right">{percentOfNPV.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Typography variant="body1">No yearly results available</Typography>
          )}
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
} 