import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Stepper,
  Step as MuiStep,
  StepLabel,
  StepButton,
  Tabs,
  Tab,
  useTheme,
  TextField,
  Checkbox,
  Container,
  Drawer,
  MenuItem,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Delete as DeleteIcon,
  Dataset as DatasetIcon,
  HelpOutline as HelpOutlineIcon,
  QueuePlayNext as QueuePlayNextIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  Layers as LayersIcon,
  Calculate as CalculateIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  EnergySavingsLeaf as LeafIcon,
  Add as AddIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import ResultsPanel from '../components/DCF/ResultsPanel';
import SensitivityPanel from '../components/DCF/SensitivityPanel';
import ValuationBridgePanel from '../components/DCF/ValuationBridgePanel';
import { ValuationBridgeStep as BridgeStep } from '../components/DCF/ValuationBridgePanel';
import { DCFResults } from '../components/DCF/ResultsPanel';
import { dcfApi, ExtendedDCFResults } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import BatchProcessing from '../components/DCF/BatchProcessing';
import DiscountRateCalculator from '../components/DCF/DiscountRateCalculator';
import type { DCFFormData } from '../services/api';
import { StepIconProps } from '@mui/material/StepIcon';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as Yup from 'yup';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import AIValuation from '../components/DCF/AIValuation';
import CalculatorModeDialog from '../components/DCF/CalculatorModeDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface FormData {
  // Asset Information
  asset: {
    name: string;
    type: 'solar' | 'wind' | 'hydro' | 'other';
    location: string;
    status: 'operational' | 'under_construction';
    description: string;
  };
  // Production Inputs
  production: {
    simplified: {
      annualProduction: string;
    };
    bottomUp: {
      capacity: string;
      capacityYield: string;
      degradationRate: string;
      plannedOutageHours: string;
      unplannedOutageHours: string;
      availability: string;
    };
  };
  // Pricing Inputs
  pricing: {
    contracted: {
      price: string;
      percentage: string;
      escalationRate: string;
      contractLength: string;
    };
    merchant: {
      price: string;
      percentage: string;
      priceGrowth: string;
    };
    regulatory: {
      price: string;
      percentage: string;
      regulatoryPeriod: string;
    };
    capacityMarket: {
      enabled: boolean;
      revenue: string; // Annual fixed payment
      escalationRate: string; // Annual growth rate
      term: string; // Duration in years
    };
  };
  
  // Tax section separated from Financial
  tax: {
    corporateRate: string;
    carryForwardLosses: {
      enabled: boolean;
      openingBalance: string;
      expiryPeriod: string;
    };
    capitalAllowances: {
      method: 'straightLine' | 'decliningBalance' | 'custom';
      rate: string;
      openingBalance: string;
      pools: Array<{
        name: string;
        rate: string;
        openingBalance: string;
      }>;
    };
  };
  
  // Cost Inputs
  costs: {
    method: 'manual' | 'perMW' | 'percentage';
    operationalCosts: string;
    maintenanceCosts: string;
    landLeaseCosts: string;
    insuranceCosts: string;
    administrativeCosts: string;
    otherCosts: string;
    costEscalation: string;
  };
  // Financial Inputs
  financial: {
    taxRate: string; // Changed from optional (taxRate?) to required
    depreciation: {
      method: 'straightLine' | 'decliningBalance' | 'custom';
      period: string;
      salvageValue: string;
    };
    workingCapital: {
      receivableDays: string;
      payableDays: string;
      inventoryDays: string;
    };
    capex: {
      initial: string;
      ongoing: string;
      contingency: string;
    };
  };
  // Macroeconomic Assumptions
  macro: {
    revenueInflation: string;
    costInflation: string;
    capexInflation: string;
    baseYear: string;
  };
  // Debt Financing
  debt: {
    amount: string;
    interestRate: string;
    term: string;
    drawdownSchedule: string;
    repaymentStructure: 'linear' | 'balloon' | 'custom';
    gracePeroid: string;
    upfrontFee: string;
    dsra: string; // Debt Service Reserve Account
  };
  // Model Parameters
  model: {
    discountRate: string;
    startDate: string;
    forecastPeriod: string;
    endDate: string;
    codDate: string; // Commercial Operation Date
    capexDate: string; // Date when initial CAPEX is spent
    valuationDate: string; // Date to which cash flows are discounted
    terminalValue: {
      method: 'perpetuity' | 'exitMultiple' | 'none';
      growthRate: string;
      multiple: string;
    };
  };
  // Sensitivity Analysis
  sensitivity: {
    enabled: boolean;
    variables: Array<{
      name: string;
      baseValue: string;
      range: {
        low: string;
        high: string;
        step: string;
      };
    }>;
  };
}

interface SensitivityVariable {
  name: string;
  baseValue: string;
  range: {
    low: string;
    high: string;
    step: string;
  };
}

interface ValuationBridgeStep {
  label: string;
  impact: number;
  cumulativeValue: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  formData: FormData;
  results: ExtendedDCFResults | null;
  createdAt: string;
  updatedAt: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dcf-tabpanel-${index}`}
      aria-labelledby={`dcf-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function DCFCalculator() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBottomUpProduction, setIsBottomUpProduction] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Asset Information
    asset: {
      name: '',
      type: 'solar',
      location: 'Unknown Location',
      status: 'operational',
      description: '',
    },
    // Production Inputs
    production: {
      simplified: {
        annualProduction: '',
      },
      bottomUp: {
        capacity: '',
        capacityYield: '',
        degradationRate: '0.5',
        plannedOutageHours: '0',
        unplannedOutageHours: '0',
        availability: '98',
      },
    },
    // Pricing Inputs
    pricing: {
      contracted: {
        price: '',
        percentage: '',
        escalationRate: '',
        contractLength: '',
      },
      merchant: {
        price: '',
        percentage: '',
        priceGrowth: '',
      },
      regulatory: {
        price: '',
        percentage: '',
        regulatoryPeriod: '',
      },
      capacityMarket: {
        enabled: false,
        revenue: '0',
        escalationRate: '2.0',
        term: '15',
      },
    },
    
    // New tax section
    tax: {
      corporateRate: '21',
      carryForwardLosses: {
        enabled: false,
        openingBalance: '0',
        expiryPeriod: '5',
      },
      capitalAllowances: {
        method: 'straightLine',
        rate: '4',
        openingBalance: '0',
        pools: [],
      },
    },
    
    // Cost Inputs
    costs: {
      method: 'manual', // 'manual' | 'perMW' | 'percentage'
      operationalCosts: '',
      maintenanceCosts: '',
      landLeaseCosts: '',
      insuranceCosts: '',
      administrativeCosts: '',
      otherCosts: '',
      costEscalation: '',
    },
    // Financial Inputs
    financial: {
      taxRate: '21', // Changed from optional (taxRate?) to required
      depreciation: {
        method: 'straightLine',
        period: '',
        salvageValue: '',
      },
      workingCapital: {
        receivableDays: '',
        payableDays: '',
        inventoryDays: '',
      },
      capex: {
        initial: '',
        ongoing: '',
        contingency: '',
      }
    },
    // Macroeconomic Assumptions
    macro: {
      revenueInflation: '',
      costInflation: '',
      capexInflation: '',
      baseYear: '',
    },
    // Debt Financing
    debt: {
      amount: '',
      interestRate: '',
      term: '',
      drawdownSchedule: '',
      repaymentStructure: 'linear', // 'linear' | 'balloon' | 'custom'
      gracePeroid: '',
      upfrontFee: '',
      dsra: '', // Debt Service Reserve Account
    },
    // Model Parameters
    model: {
      discountRate: '',
      startDate: '',
      forecastPeriod: '',
      endDate: '',
      codDate: '', // Initialize empty COD date
      capexDate: '', // Initialize empty CAPEX date
      valuationDate: '', // Initialize empty valuation date
      terminalValue: {
        method: 'perpetuity',
        growthRate: '',
        multiple: '',
      },
    },
    // Sensitivity Analysis
    sensitivity: {
      enabled: false,
      variables: [],
    },
  });
  const [results, setResults] = useState<DCFResults | null>(null);
  const [sensitivityVariables, setSensitivityVariables] = useState<SensitivityVariable[]>([]);
  const [valuationBridge, setValuationBridge] = useState<ValuationBridgeStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [tourStep, setTourStep] = useState(0);
  const [runTour, setRunTour] = useState(false);
  const [guideComplete, setGuideComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [quickGuideDialogOpen, setQuickGuideDialogOpen] = useState(false);
  const location = useLocation();
  const assetData = location.state?.assetData;

  // Add new state variables for batch processing
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchTemplates, setBatchTemplates] = useState<Array<{id: string, name: string, description: string}>>([
    { id: 'solar-standard', name: 'Solar Standard', description: 'Standard DCF template for solar assets' },
    { id: 'wind-standard', name: 'Wind Standard', description: 'Standard DCF template for wind assets' },
    { id: 'hydro-standard', name: 'Hydro Standard', description: 'Standard DCF template for hydro assets' },
  ]);
  const [selectedBatchTemplate, setSelectedBatchTemplate] = useState<string>('');
  const [batchAssets, setBatchAssets] = useState<Array<{id: string, name: string, type: string, selected: boolean}>>([
    { id: '1', name: 'Solar Farm Alpha', type: 'solar', selected: false },
    { id: '2', name: 'Wind Park Beta', type: 'wind', selected: false },
    { id: '3', name: 'Hydro Plant Gamma', type: 'hydro', selected: false },
    { id: '4', name: 'Solar Farm Delta', type: 'solar', selected: false },
  ]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{assetId: string, assetName: string, status: 'pending' | 'processing' | 'complete' | 'error', results: DCFResults | null}>>([]);

  // Add a state for toggling batch mode
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Add a state variable for errorGroups
  const [errorGroups, setErrorGroups] = useState<Record<string, string[]>>({
    'Asset': [],
    'Production': [],
    'Pricing': [],
    'Financial': [],
    'Tax': [], // Add Tax section
    'Model': []
  });

  // Add the snackbar state near the other state declarations (around line 352)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Add new state for bridge variables
  const [bridgeVariables, setBridgeVariables] = useState<Array<{
    name: string;
    path: string;
    currentValue: string | number;
    newValue: string | number;
  }>>([]);

  // Add state for showing/hiding tooltips
  const [showTooltips, setShowTooltips] = useState<boolean>(true);

  // First add a new state for multiple debt instruments
  const [debtInstruments, setDebtInstruments] = useState<Array<{
    id: string;
    name: string;
    amount: string;
    interestRate: string;
    term: string;
    repaymentStructure: 'linear' | 'balloon' | 'custom';
  }>>([]);

  // Add function to handle adding a new debt instrument
  const handleAddDebtInstrument = () => {
    const newDebt = {
      id: `debt-${Date.now()}`,
      name: `Debt ${debtInstruments.length + 1}`,
      amount: '',
      interestRate: '',
      term: '',
      repaymentStructure: 'linear' as const,
    };
    setDebtInstruments([...debtInstruments, newDebt]);
  };

  // Add function to handle removing a debt instrument
  const handleRemoveDebtInstrument = (id: string) => {
    setDebtInstruments(debtInstruments.filter(debt => debt.id !== id));
  };

  // Add helper functions for calculating debt metrics
  const calculateMinDSCR = (results: any) => {
    // Implementation based on your results data structure
    return 1.5; // Example value
  };

  const calculateAverageDSCR = (results: any) => {
    return 1.8; // Example value
  };

  const calculateCurrentDSCR = (results: any) => {
    return 1.6; // Example value
  };

  const calculateMinLLCR = (results: any) => {
    return 1.4; // Example value
  };

  const calculateAverageLLCR = (results: any) => {
    return 1.6; // Example value
  };

  const calculateCurrentLLCR = (results: any) => {
    return 1.5; // Example value
  };

  const calculateMinPLCR = (results: any) => {
    return 1.3; // Example value
  };

  const calculateAveragePLCR = (results: any) => {
    return 1.5; // Example value
  };

  const calculateCurrentPLCR = (results: any) => {
    return 1.4; // Example value
  };

  const calculateYearlyDebtServiceCoverage = (results: any) => {
    // Example implementation
    return [
      { year: 2024, dscr: 1.5, llcr: 1.4, plcr: 1.3 },
      { year: 2025, dscr: 1.6, llcr: 1.5, plcr: 1.4 },
      { year: 2026, dscr: 1.7, llcr: 1.6, plcr: 1.5 },
      { year: 2027, dscr: 1.8, llcr: 1.7, plcr: 1.6 },
      { year: 2028, dscr: 1.9, llcr: 1.8, plcr: 1.7 },
    ];
  };

  const calculateLeverageRatio = (results: any) => {
    return 0.65; // Example value
  };

  const calculateInterestCoverage = (results: any) => {
    return 3.5; // Example value
  };

  const calculateDebtToEBITDA = (results: any) => {
    return 4.2; // Example value
  };

  // Add a function to handle discount rate changes
  const handleDiscountRateChange = (newRate: number) => {
    setFormData({
      ...formData,
      model: {
        ...formData.model,
        discountRate: newRate.toString(),
      },
    });
  };

  // Add a function to extract NPV from results for the discount rate component
  const getCurrentNPV = (): number => {
    if (results && results.npv) {
      return results.npv;
    }
    return 1000000; // Default value if no results available
  };

  // Quick Guide tour steps
  const tourSteps: Step[] = [
    {
      target: '#dcf-header',
      content: 'Welcome to the DCF Calculator. This tool helps you perform discounted cash flow analysis for renewable energy assets.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#asset-section',
      content: 'Start by entering basic information about your asset, such as name, type, and location.',
      placement: 'bottom',
    },
    {
      target: '#production-section',
      content: 'Enter production data. You can use either a simplified approach with annual production or a bottom-up calculation based on capacity.',
      placement: 'bottom',
    },
    {
      target: '#pricing-section',
      content: 'Enter pricing information for contracted and merchant sales, including prices and percentage allocations.',
      placement: 'bottom',
    },
    {
      target: '#costs-section',
      content: 'Enter operational costs, maintenance costs, and other expenses. You can use manual entry, per MW costs, or percentage of revenue.',
      placement: 'bottom',
    },
    {
      target: '#financial-section',
      content: 'Enter financial parameters like tax rate, depreciation method, working capital requirements, and capital expenditures.',
      placement: 'bottom',
    },
    {
      target: '#macro-section',
      content: 'Enter macroeconomic assumptions such as inflation rates for revenue, costs, and capital expenditures.',
      placement: 'bottom',
    },
    {
      target: '#debt-section',
      content: 'Enter details about debt financing, including amount, interest rate, term, and repayment structure.',
      placement: 'bottom',
    },
    {
      target: '#model-section',
      content: 'Enter model parameters like discount rate, forecast period, and terminal value method.',
      placement: 'bottom',
    },
    {
      target: '#calculate-button',
      content: 'After entering all required inputs, click Calculate DCF to run the analysis.',
      placement: 'top',
    },
    {
      target: '#sample-data-button',
      content: 'To quickly test the calculator, click Load Sample Data to fill the form with example data.',
      placement: 'bottom',
    },
    {
      target: '#save-scenario-button',
      content: 'You can save your scenarios for later use with the Save Scenario button.',
      placement: 'left',
    },
  ];

  // Add new handlers for the bridge variables
  const handleAddBridgeVariable = (variable: {
    name: string;
    path: string;
    currentValue: string | number;
    newValue: string | number;
  }) => {
    // Look up the current value from formData
    const currentValue = getValueByPath(formData, variable.path);
    
    // Create the complete variable with current value
    const completeVariable = {
      ...variable,
      currentValue: currentValue || 0
    };
    
    setBridgeVariables([...bridgeVariables, completeVariable]);
  };

  const handleRemoveBridgeVariable = (index: number) => {
    setBridgeVariables(prev => prev.filter((_, i) => i !== index));
  };

  // Add a handler to generate the valuation bridge
  const handleGenerateValuationBridge = async () => {
    if (bridgeVariables.length === 0) {
      setError('Please add at least one variable to the valuation bridge');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Start with current NPV as base value
      const baseValue = getCurrentNPV();
      
      // Initialize the bridge with base value
      let newValuationBridge: BridgeStep[] = [
        {
          label: 'Base Value',
          impact: 0,
          cumulativeValue: baseValue
        }
      ];
      
      let cumulativeValue = baseValue;
      
      // Process each variable in sequence
      for (const variable of bridgeVariables) {
        // Create a copy of form data
        const modifiedForm = JSON.parse(JSON.stringify(formData));
        
        // Set the new value
        setValueByPath(modifiedForm, variable.path, variable.newValue);
        
        // Special handling for certain variable types
        // Ensure tax rate is consistently set 
        if (variable.path === 'tax.corporateRate') {
          modifiedForm.financial.taxRate = variable.newValue;
        }
        
        // For capacity market enabled/disabled toggle
        if (variable.path === 'pricing.capacityMarket.enabled') {
          // If enabling capacity market, ensure revenue is non-zero
          if (String(variable.newValue).toLowerCase() === 'true') {
            if (!modifiedForm.pricing.capacityMarket.revenue || 
                parseFloat(modifiedForm.pricing.capacityMarket.revenue as string) === 0) {
              modifiedForm.pricing.capacityMarket.revenue = '100000'; // Set a default value
            }
          }
        }
        
        // For tax loss carry forward toggle
        if (variable.path === 'tax.carryForwardLosses.enabled') {
          // If enabling tax loss carry forward, ensure opening balance is non-zero
          if (String(variable.newValue).toLowerCase() === 'true') {
            if (!modifiedForm.tax.carryForwardLosses.openingBalance || 
                parseFloat(modifiedForm.tax.carryForwardLosses.openingBalance as string) === 0) {
              modifiedForm.tax.carryForwardLosses.openingBalance = '500000'; // Set a default value
            }
          }
        }
        
        // Always ensure financial.taxRate is consistent with tax.corporateRate
        modifiedForm.financial.taxRate = modifiedForm.tax.corporateRate;
        
        // Calculate the NPV with this change
        const result = await calculateNPVWithForm(modifiedForm);
        
        // Calculate the impact
        const impact = result - cumulativeValue;
        cumulativeValue = result;
        
        // Add to the bridge
        newValuationBridge.push({
          label: variable.name,
          impact,
          cumulativeValue
        });
      }
      
      // Add final value
      newValuationBridge.push({
        label: 'Final Value',
        impact: 0,
        cumulativeValue
      });
      
      // Update the state
      setValuationBridge(newValuationBridge);
      
    } catch (error: any) {
      console.error('Error generating valuation bridge:', error);
      setError(error.response?.data?.message || 'Error generating valuation bridge');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect after the other useEffect hooks (before the loadScenarios function)
  useEffect(() => {
    // Calculate end date based on start date and forecast period
    const startDateString = formData.model.startDate;
    const forecastPeriod = formData.model.forecastPeriod;
    
    if (startDateString && forecastPeriod) {
      try {
        // Parse start date
        const startDate = new Date(startDateString);
        // Calculate end date by adding forecast period in years
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + parseInt(forecastPeriod));
        
        // Format the end date using our helper function
        const formattedEndDate = formatDateForInput(endDate.toISOString());
        
        // Only update if the end date is different from current value
        if (formData.model.endDate !== formattedEndDate) {
          setFormData((prevFormData: FormData) => ({
            ...prevFormData,
            model: {
              ...prevFormData.model,
              endDate: formattedEndDate
            }
          }));
        }
      } catch (error) {
        console.error('Error calculating end date:', error);
      }
    }
  }, [formData.model.startDate, formData.model.forecastPeriod]);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    // If asset data is passed, populate the form with that data
    if (assetData) {
      setFormData(prevFormData => {
        const newFormData = { ...prevFormData };
        
        // Asset information
        newFormData.asset = {
          ...newFormData.asset,
          name: assetData.name || '',
          type: (assetData.type?.toLowerCase() as 'solar' | 'wind' | 'hydro' | 'other') || 'other',
          location: assetData.location || '',
          status: (assetData.status?.toLowerCase().replace(' ', '_') as 'operational' | 'under_construction') || 'operational',
          description: `Asset imported from portfolio with ID ${assetData.id}`
        };
        
        // Production inputs - set some reasonable defaults based on capacity
        if (assetData.capacity) {
          newFormData.production.bottomUp = {
            ...newFormData.production.bottomUp,
            capacity: assetData.capacity.toString()
          };
          
          // Also update simplified view with estimated annual production
          // Assuming capacity factor: solar = 0.25, wind = 0.35, other = 0.3
          let capacityFactor = 0.3;
          if (assetData.type?.toLowerCase() === 'solar') capacityFactor = 0.25;
          if (assetData.type?.toLowerCase() === 'wind') capacityFactor = 0.35;
          
          const estimatedAnnualProduction = Math.round(assetData.capacity * 8760 * capacityFactor);
          newFormData.production.simplified = {
            ...newFormData.production.simplified,
            annualProduction: estimatedAnnualProduction.toString()
          };
        }
        
        // Pricing inputs - use PPA information if available
        if (assetData.ppaRate) {
          newFormData.pricing.contracted = {
            ...newFormData.pricing.contracted,
            price: assetData.ppaRate.toString(),
            contractLength: (assetData.ppaTerm || 15).toString(),
            percentage: '100',
            escalationRate: '2'
          };
          
          // Set merchant price as backup after contract ends
          newFormData.pricing.merchant = {
            ...newFormData.pricing.merchant,
            price: (assetData.ppaRate * 0.9).toString(), // 90% of contract price
            percentage: '0',
            priceGrowth: '1.5'
          };
        }
        
        // Cost inputs - use operational costs if available
        if (assetData.operatingCosts) {
          const annualCosts = assetData.operatingCosts;
          newFormData.costs = {
            ...newFormData.costs,
            method: 'manual',
            operationalCosts: Math.round(annualCosts * 0.4).toString(), // 40% operational
            maintenanceCosts: Math.round(annualCosts * 0.3).toString(), // 30% maintenance
            landLeaseCosts: Math.round(annualCosts * 0.15).toString(), // 15% land lease
            insuranceCosts: Math.round(annualCosts * 0.1).toString(), // 10% insurance
            administrativeCosts: Math.round(annualCosts * 0.05).toString(), // 5% admin
            otherCosts: '0',
            costEscalation: '2.5'
          };
        }
        
        // Financial inputs - use initial investment if available
        if (assetData.initialInvestment) {
          newFormData.financial.capex = {
            ...newFormData.financial.capex,
            initial: assetData.initialInvestment.toString(),
            ongoing: (assetData.initialInvestment * 0.005).toString(), // 0.5% ongoing capex
            contingency: (assetData.initialInvestment * 0.03).toString() // 3% contingency
          };
        }
        
        return newFormData;
      });
      
      // Set active tab to first tab when loading asset data
      setActiveTab(0);
      
      // Show a success notification
      setSuccessMessage(`Loaded data for ${assetData.name}`);
    }
  }, [assetData]);

  useEffect(() => {
    const groups: Record<string, string[]> = {
      'Asset': [],
      'Production': [],
      'Pricing': [],
      'Financial': [],
      'Tax': [], // Add Tax section
      'Model': []
    };
    
    Object.entries(validationErrors).forEach(([field, message]) => {
      if (field.startsWith('asset.')) {
        groups['Asset'].push(message);
      } else if (field.startsWith('production.')) {
        groups['Production'].push(message);
      } else if (field.startsWith('pricing.')) {
        groups['Pricing'].push(message);
      } else if (field.startsWith('financial.')) {
        groups['Financial'].push(message);
      } else if (field.startsWith('tax.')) {
        groups['Tax'].push(message); // Handle Tax section errors
      } else if (field.startsWith('model.')) {
        groups['Model'].push(message);
      }
    });
    
    setErrorGroups(groups);
  }, [validationErrors]);

  const loadScenarios = () => {
    try {
      const savedScenarios = localStorage.getItem('dcfScenarios');
      if (savedScenarios) {
        setScenarios(JSON.parse(savedScenarios));
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const handleSaveScenario = async () => {
    if (!scenarioName) {
      setError('Please enter a scenario name');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare the scenario data
      const scenarioData = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        description: scenarioDescription,
        formData,
        results,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save locally
      const existingScenarios = localStorage.getItem('dcfScenarios');
      let scenarios = existingScenarios ? JSON.parse(existingScenarios) : [];
      scenarios.push(scenarioData);
      localStorage.setItem('dcfScenarios', JSON.stringify(scenarios));
      
      // Update state
      setScenarios(scenarios);
      
      // Close dialog and reset fields
      setSaveDialogOpen(false);
      setScenarioName('');
      setScenarioDescription('');
      
      // Show success message
      setSuccessMessage('Scenario saved successfully');
    } catch (error) {
      console.error('Error saving scenario:', error);
      setError('Failed to save scenario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadScenario = (scenario: {
    formData: FormData;
    results?: ExtendedDCFResults | null;
  }) => {
    try {
      setFormData(scenario.formData);
      if (scenario.results) {
        setResults(scenario.results);
      }
      setLoadDialogOpen(false);
      setSuccessMessage(`Loaded scenario: ${scenario.formData.asset.name}`);
    } catch (error) {
      console.error('Error loading scenario:', error);
      setError('Failed to load scenario');
    }
  };

  const handleDeleteScenario = (id: string) => {
    try {
      const updatedScenarios = scenarios.filter(s => s.id !== id);
      localStorage.setItem('dcfScenarios', JSON.stringify(updatedScenarios));
      setScenarios(updatedScenarios);
      setSuccessMessage('Scenario deleted successfully');
    } catch (error) {
      console.error('Error deleting scenario:', error);
      setError('Failed to delete scenario');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (section: keyof FormData, subsection: string, field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => {
      const sectionData = prev[section];
      if (subsection === '') {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: event.target.value
          }
        };
      }
      
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [subsection]: {
            ...(sectionData as any)[subsection],
            [field]: event.target.value
          }
        }
      };
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    console.log("Validating form data:", formData); // Debug log to see form data
    
    // Asset Information
    if (!formData.asset.name) errors['asset.name'] = 'Asset name is required';
    if (!formData.asset.type) errors['asset.type'] = 'Asset type is required';
    if (!formData.asset.location) errors['asset.location'] = 'Location is required';

    // Production Inputs
    if (isBottomUpProduction) {
      if (!formData.production.bottomUp.capacity) {
        errors['production.bottomUp.capacity'] = 'Capacity is required';
      }
      if (!formData.production.bottomUp.capacityYield) {
        errors['production.bottomUp.capacityYield'] = 'Capacity yield is required';
      }
      if (!formData.production.bottomUp.degradationRate) {
        errors['production.bottomUp.degradationRate'] = 'Degradation rate is required';
      }
      if (!formData.production.bottomUp.availability) {
        errors['production.bottomUp.availability'] = 'Availability is required';
      }
    } else {
      if (!formData.production.simplified.annualProduction) {
        errors['production.simplified.annualProduction'] = 'Annual production is required';
      }
    }

    // Pricing Inputs
    if (!formData.pricing.contracted.price) {
      errors['pricing.contracted.price'] = 'Contracted price is required';
    }
    if (!formData.pricing.contracted.percentage) {
      errors['pricing.contracted.percentage'] = 'Contracted percentage is required';
    }
    if (!formData.pricing.merchant.price) {
      errors['pricing.merchant.price'] = 'Merchant price is required';
    }

    // Financial Inputs - Remove tax rate validation
    if (!formData.financial.depreciation.period) {
      errors['financial.depreciation.period'] = 'Depreciation period is required';
    }
    if (!formData.financial.capex.initial) {
      errors['financial.capex.initial'] = 'Initial CAPEX is required';
    }

    // Model Parameters
    if (!formData.model.discountRate) {
      errors['model.discountRate'] = 'Discount rate is required';
    }
    if (!formData.model.startDate) {
      errors['model.startDate'] = 'Start date is required';
    }
    if (!formData.model.forecastPeriod) {
      errors['model.forecastPeriod'] = 'Forecast period is required';
    }
    if (!formData.model.codDate) {
      errors['model.codDate'] = 'Commercial Operation Date is required';
    }

    // Tax Inputs - Ensure corporate tax rate is required
    if (!formData.tax.corporateRate) {
      errors['tax.corporateRate'] = 'Corporate tax rate is required';
    }
    
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors); // Debug log to see which fields failed validation
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update getDetailedValidationErrors to use errorGroups state
  const getDetailedValidationErrors = () => {
    if (Object.keys(validationErrors).length === 0) {
      return null;
    }
    
    // Create a formatted message
    let errorMessage = 'Please fill in all required fields:\n';
    Object.entries(errorGroups).forEach(([group, errors]) => {
      if (errors.length > 0) {
        errorMessage += `\n${group} section: ${errors.join(', ')}`;
      }
    });
    
    return errorMessage;
  };

  // Update handleCalculate function to use the detailed error message
  const handleCalculate = async () => {
    console.log("Calculate button clicked"); // Debug log
    const isValid = validateForm();
    
    if (!isValid) {
      const detailedError = getDetailedValidationErrors();
      setError(detailedError || 'Please fill in all required fields');
      console.log("Validation failed. Current errors:", validationErrors);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Create a processed form data with any necessary transformations
      // Ensure all dates are properly formatted
      const processedFormData = {
        ...formData,
        // Ensure we're only using the tax rate from the tax section
        financial: {
          ...formData.financial,
          taxRate: formData.tax.corporateRate
        },
        // Ensure dates are valid
        model: {
          ...formData.model,
          startDate: formatDateForInput(formData.model.startDate),
          endDate: formatDateForInput(formData.model.endDate), 
          codDate: formatDateForInput(formData.model.codDate),
          valuationDate: formatDateForInput(formData.model.valuationDate),
          capexDate: formatDateForInput(formData.model.capexDate)
        }
      };

      // Log the form data being sent to the API for debugging
      console.log("Sending to API:", processedFormData);

      const response = await dcfApi.calculate(processedFormData);
      
      // Convert the API response type to the expected DCFResults type
      const convertedResults: DCFResults = {
        enterpriseValue: response.data.enterpriseValue,
        equityValue: response.data.equityValue,
        npv: response.data.npv,
        irr: response.data.irr,
        paybackPeriod: response.data.paybackPeriod,
        dscr: response.data.dscr,
        yearlyResults: response.data.yearlyResults,
        valuationDate: response.data.valuationDate,
        initialCapex: response.data.initialCapex,
        codDate: response.data.codDate
      };
      setResults(convertedResults);
      // Fix: Change to Results tab, which is index 5
      setActiveTab(5); 
      setSuccessMessage('DCF calculation completed successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error calculating DCF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSensitivityVariable = (variable: SensitivityVariable) => {
    const updatedVariables = [...sensitivityVariables, variable];
    setSensitivityVariables(updatedVariables);
    
    // Also update the formData to keep them in sync
    setFormData({
      ...formData,
      sensitivity: {
        ...formData.sensitivity,
        enabled: true,
        variables: updatedVariables
      }
    });
  };

  const handleRemoveSensitivityVariable = (index: number) => {
    const updatedVariables = sensitivityVariables.filter((_, i) => i !== index);
    setSensitivityVariables(updatedVariables);
    
    // Also update the formData to keep them in sync
    setFormData({
      ...formData,
      sensitivity: {
        ...formData.sensitivity,
        variables: updatedVariables
      }
    });
  };

  // Update the calculateNPVWithForm function to ensure capacity market revenue properly drives value
  const calculateNPVWithForm = async (form: FormData): Promise<number> => {
    try {
      // Deep copy to avoid side effects
      const requestData = JSON.parse(JSON.stringify(form));
      
      // Process form data to ensure all important fields are properly considered
      // Set financial.taxRate from tax.corporateRate to ensure proper calculation
      requestData.financial.taxRate = requestData.tax.corporateRate;
      
      // Ensure capacity market is properly processed
      // If capacity market is enabled but has no revenue, set a default value
      if (requestData.pricing.capacityMarket.enabled && 
          (!requestData.pricing.capacityMarket.revenue || 
           parseFloat(requestData.pricing.capacityMarket.revenue) === 0)) {
        requestData.pricing.capacityMarket.revenue = '100000';
      }
      
      // If capacity market is disabled, ensure revenue is zero to prevent it from affecting calculations
      if (!requestData.pricing.capacityMarket.enabled) {
        requestData.pricing.capacityMarket.revenue = '0';
      }
      
      // Call API to calculate
      console.log('Sending to API with capacity market details:', 
                  requestData.pricing.capacityMarket);
      const response = await dcfApi.calculate(requestData);
      
      if (response && response.data) {
        return response.data.npv || 0;
      }
      
      return 0;
    } catch (error) {
      console.error("Error calculating NPV with modified form", error);
      return 0;
    }
  };

  // Update the handleRunSensitivityAnalysis function similarly
  const handleRunSensitivityAnalysis = async () => {
    if (formData.sensitivity.variables.length === 0) {
      setError('Please add at least one sensitivity variable');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Create initial bridge step for base value
      const baseValue = getCurrentNPV();
      
      // Start with clean valuation bridge
      let newValuationBridge: BridgeStep[] = [
        {
          label: 'Base Value',
          impact: 0,
          cumulativeValue: baseValue
        }
      ];
      
      let cumulativeValue = baseValue;
      
      // Run analysis for each variable and track its impact
      for (const variable of formData.sensitivity.variables) {
        // Extract the variable path (e.g., "discount_rate", "capacity", "merchant_price", etc.)
        const variablePath = mapVariableNameToPath(variable.name);
        
        if (!variablePath) {
          console.warn(`Couldn't map ${variable.name} to a path`);
          continue;
        }
        
        // Get current value from formData
        const currentValue = getValueByPath(formData, variablePath);
        
        // Calculate the target value (can be a more sophisticated approach if needed)
        const targetValue = Number(variable.baseValue);
        
        // Skip if values are the same
        if (Number(currentValue) === targetValue) {
          continue;
        }
        
        // Create a copy of form data and modify the variable
        const modifiedForm = JSON.parse(JSON.stringify(formData));
        setValueByPath(modifiedForm, variablePath, targetValue);
        
        // Ensure financial.taxRate is set from tax.corporateRate for proper calculation
        modifiedForm.financial.taxRate = modifiedForm.tax.corporateRate;
        
        // Calculate NPV with the modified variable
        const result = await calculateNPVWithForm(modifiedForm);
        
        // Calculate impact on NPV
        const impact = result - cumulativeValue;
        cumulativeValue = result;
        
        // Add step to valuation bridge
        newValuationBridge.push({
          label: variable.name,
          impact: impact,
          cumulativeValue: cumulativeValue
        });
      }
      
      // Add final value step
      newValuationBridge.push({
        label: 'Final Value',
        impact: 0,
        cumulativeValue: cumulativeValue
      });
      
      // Update the valuation bridge state
      setValuationBridge(newValuationBridge);
      
      // Create a processed form for sensitivity analysis
      const processedFormData = {
        ...formData,
        financial: {
          ...formData.financial,
          taxRate: formData.tax.corporateRate
        }
      };
      
      // Perform actual sensitivity analysis
      const response = await dcfApi.sensitivity({
        formData: processedFormData,
        variables: formData.sensitivity.variables,
      });
      
      // Convert sensitivity results to the expected DCFResults type
      if (response.data && response.data.results) {
        // Use the last result as the final value
        const finalResult = response.data.results[response.data.results.length - 1];
        const convertedResults: DCFResults = {
          enterpriseValue: finalResult.enterpriseValue,
          equityValue: finalResult.equityValue,
          npv: finalResult.npv,
          irr: finalResult.irr,
          paybackPeriod: response.data.base.paybackPeriod, // Use base value for missing fields
          dscr: response.data.base.dscr,
          yearlyResults: response.data.base.yearlyResults,
          // Optional fields
          valuationDate: response.data.base.valuationDate,
          initialCapex: response.data.base.initialCapex,
          codDate: response.data.base.codDate
        };
        
        // Set the results and valuation bridge separately
        setResults(convertedResults);
        
        // Show success message
        setSuccessMessage('Sensitivity analysis completed successfully');
        
        // Stay on the current tab - fixed the issue where it was redirecting to Tax tab
        // setActiveTab(2); // This was causing the redirect to Tax tab
        // Instead, explicitly set to the Sensitivity tab (index 6)
        setActiveTab(6);
      }
      
    } catch (error: any) {
      console.error('Error running sensitivity analysis:', error);
      setError(error.response?.data?.message || 'Error running sensitivity analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for working with variable paths
  const mapVariableNameToPath = (variableName: string): string | null => {
    // Map from user-friendly names to actual form data paths
    const pathMap: Record<string, string> = {
      // Core variables
      "Discount Rate": "model.discountRate",
      "Electricity Price": "pricing.merchant.price",
      "Capacity Factor": "production.bottomUp.capacityYield",
      "Capacity": "production.bottomUp.capacity",
      
      // Tax variables (ensure these are properly mapped)
      "Tax Rate": "tax.corporateRate",
      "Corporate Tax Rate": "tax.corporateRate",
      
      // CAPEX variables
      "Initial CAPEX": "financial.capex.initial",
      "Ongoing CAPEX": "financial.capex.ongoing",
      
      // Price variables
      "Contracted Price": "pricing.contracted.price",
      "Merchant Price": "pricing.merchant.price",
      "Degradation Rate": "production.bottomUp.degradationRate",
      
      // Inflation and other rates
      "Inflation Rate": "macro.revenueInflation",
      "Interest Rate": "debt.interestRate",
      
      // Cost variables
      "O&M Costs": "costs.operationalCosts",
      "Maintenance Costs": "costs.maintenanceCosts",
      "Land Lease Costs": "costs.landLeaseCosts",
      "Insurance Costs": "costs.insuranceCosts",
      "Administrative Costs": "costs.administrativeCosts",
      
      // Capacity market variables (ensure these are properly identified)
      "Capacity Market Revenue": "pricing.capacityMarket.revenue",
      "Capacity Market Escalation": "pricing.capacityMarket.escalationRate",
      "Capacity Market Term": "pricing.capacityMarket.term",
      "Capacity Market Enabled": "pricing.capacityMarket.enabled",
      
      // Tax loss carry forward variables (ensure these are properly identified)
      "Tax Loss Opening Balance": "tax.carryForwardLosses.openingBalance",
      "Tax Loss Expiry Period": "tax.carryForwardLosses.expiryPeriod",
      "Tax Loss Carry Forward Enabled": "tax.carryForwardLosses.enabled",
      
      // Capital allowances
      "Capital Allowance Rate": "tax.capitalAllowances.rate",
      "Capital Allowance Method": "tax.capitalAllowances.method",
    };
    
    return pathMap[variableName] || null;
  };

  const getValueByPath = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  };

  const setValueByPath = (obj: any, path: string, value: any): void => {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  };

  const getHelperText = (path: string) => {
    return validationErrors[path] || '';
  };

  const hasError = (path: string) => {
    return !!validationErrors[path];
  };

  // Add a handler for opening the batch processing dialog
  const handleOpenBatchDialog = () => {
    setBatchDialogOpen(true);
  };

  // Add a handler for closing the batch processing dialog
  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
  };

  // Add a handler for toggling asset selection in batch processing
  const handleToggleAssetSelection = (assetId: string) => {
    setBatchAssets(prevAssets => 
      prevAssets.map(asset => 
        asset.id === assetId ? { ...asset, selected: !asset.selected } : asset
      )
    );
  };

  // Add a handler for running batch processing
  const handleRunBatchProcess = async () => {
    // Get selected assets from batchAssets
    const selectedAssets = batchAssets.filter(asset => asset.selected);
    
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to process');
      return;
    }

    if (!selectedBatchTemplate) {
      alert('Please select a template to apply');
      return;
    }

    // Update to initialize with the selected assets
    setBatchResults(
      selectedAssets.map((asset: {id: string, name: string, type: string, selected: boolean}) => ({
        assetId: asset.id,
        assetName: asset.name,
        status: 'pending' as const,
        results: null
      }))
    );

    setIsBatchProcessing(true);
    
    // Process assets in parallel
    const processPromises = selectedAssets.map(async (asset: {id: string, name: string, type: string, selected: boolean}, index: number) => {
      try {
        // Update status to processing
        setBatchResults(prev => 
          prev.map((result, idx) => 
            idx === index ? { ...result, status: 'processing' as const } : result
          )
        );
        
        // Simulate API call with the selected template and asset
        let templateData;
        try {
          templateData = await dcfApi.getTemplateData(selectedBatchTemplate);
        } catch (error) {
          console.error('Error fetching template data:', error);
          // Create empty template data if API call fails
          templateData = {} as DCFFormData;
        }
        
        // Ensure templateData is treated as DCFFormData
        const typedTemplateData = templateData as DCFFormData;
        
        // Merge template data with asset-specific data
        const mergedData = {
          ...typedTemplateData,
          asset: {
            ...typedTemplateData.asset,
            name: asset.name,
            type: asset.type as 'solar' | 'wind' | 'hydro' | 'other',
          }
        };
        
        // Calculate DCF based on merged data
        const apiResponse = await dcfApi.calculateDCF(mergedData);
        
        // Extract the actual DCFResults from the response
        const results = apiResponse.data;
        
        // Update results
        setBatchResults(prev => 
          prev.map((result, idx) => 
            idx === index ? { ...result, status: 'complete' as const, results } : result
          )
        );
        
        return { success: true, assetId: asset.id };
      } catch (error) {
        // Update status to error
        setBatchResults(prev => 
          prev.map((result, idx) => 
            idx === index ? { ...result, status: 'error' as const } : result
          )
        );
        
        return { success: false, assetId: asset.id, error };
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(processPromises);
    
    setIsBatchProcessing(false);
    
    // Show summary alert
    const completedCount = batchResults.filter(result => result.status === 'complete').length;
    const errorCount = batchResults.filter(result => result.status === 'error').length;
    
    alert(`Batch processing complete: ${completedCount} successful, ${errorCount} failed`);
  };

  // Sample data for quick loading
  const sampleData: FormData = {
    asset: {
      name: 'Sample Solar Farm',
      type: 'solar',
      location: 'Arizona, USA',
      status: 'operational',
      description: 'A 50 MW solar farm in Arizona',
    },
    production: {
      simplified: {
        annualProduction: '120000',
      },
      bottomUp: {
        capacity: '50',
        capacityYield: '85',
        degradationRate: '0.5',
        plannedOutageHours: '120',
        unplannedOutageHours: '72',
        availability: '98',
      }
    },
    pricing: {
      contracted: {
        price: '65',
        percentage: '70',
        escalationRate: '2.5',
        contractLength: '15',
      },
      merchant: {
        price: '45',
        percentage: '30',
        priceGrowth: '1.5',
      },
      regulatory: {
        price: '0',
        percentage: '0',
        regulatoryPeriod: '0',
      },
      capacityMarket: {
        enabled: false,
        revenue: '0',
        escalationRate: '2.0',
        term: '15',
      },
    },
    tax: {
      corporateRate: '21',
      carryForwardLosses: {
        enabled: false,
        openingBalance: '0',
        expiryPeriod: '5',
      },
      capitalAllowances: {
        method: 'straightLine',
        rate: '4',
        openingBalance: '0', // Add the missing required property
        pools: [],
      },
    },
    costs: {
      method: 'manual',
      operationalCosts: '350000',
      maintenanceCosts: '250000',
      landLeaseCosts: '75000',
      insuranceCosts: '120000',
      administrativeCosts: '80000',
      otherCosts: '50000',
      costEscalation: '2.0',
    },
    financial: {
      taxRate: '21', // Changed from optional (taxRate?) to required
      depreciation: {
        method: 'straightLine',
        period: '25',
        salvageValue: '10',
      },
      workingCapital: {
        receivableDays: '45',
        payableDays: '30',
        inventoryDays: '15',
      },
      capex: {
        initial: '75000000',
        ongoing: '250000',
        contingency: '5',
      }
    },
    macro: {
      revenueInflation: '2.0',
      costInflation: '2.5',
      capexInflation: '1.8',
      baseYear: '2023',
    },
    debt: {
      amount: '50000000',
      interestRate: '5.5',
      term: '15',
      drawdownSchedule: '50, 30, 20',
      repaymentStructure: 'linear',
      gracePeroid: '1',
      upfrontFee: '1.5',
      dsra: '6',
    },
    model: {
      discountRate: '8.5',
      startDate: '2023-01-01',
      forecastPeriod: '25',
      endDate: '2048-01-01',
      codDate: '2024-01-01', // Default to 1 year after start date
      terminalValue: {
        method: 'perpetuity',
        growthRate: '1.5',
        multiple: '10',
      },
      valuationDate: '2023-01-01', // Set a default valuation date
      capexDate: '2023-01-01', // Set a default initial CAPEX date
    },
    sensitivity: {
      enabled: true,
      variables: [],
    },
  };

  // Sample sensitivity variables
  const sampleSensitivityVariables: SensitivityVariable[] = [
    {
      name: 'Discount Rate',
      baseValue: '8.5',
      range: {
        low: '7.0',
        high: '10.0',
        step: '0.5',
      }
    },
    {
      name: 'Electricity Price',
      baseValue: '65',
      range: {
        low: '55',
        high: '75',
        step: '5',
      }
    },
    {
      name: 'Capacity Factor',
      baseValue: '85',
      range: {
        low: '80',
        high: '90',
        step: '2',
      }
    }
  ];

  // Modify the handleLoadSampleData function to use the proper form handling approach
  const handleLoadSampleData = async () => {
    try {
      // Set the form with sample data
      console.log('Loading sample data into form...');
      setFormData(sampleData);
      setIsBottomUpProduction(true);
      
      // Submit the form to get calculations from backend
      console.log('Calculating DCF with sample data...');
      const result = await dcfApi.calculate(sampleData);
      
      // Display the results
      console.log('Sample data calculation results:', result.data);
      setResults(result.data);
      
      // Navigate to the results tab (using numeric index instead of string)
      setActiveTab(3); // Assuming 3 is the index for the results tab
      toast.success('Sample data loaded and calculated');
    } catch (error: any) {
      console.error('Error loading sample data:', error);
      toast.error(`Failed to calculate sample data: ${error.message}`);
    }
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;
    
    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      setGuideComplete(true);
      return;
    }
    
    // Only update the step when explicitly moving to the next or previous step
    // This prevents flickering and automatic advancement
    if (type === 'step:after' && action === 'next') {
      // Use setTimeout to avoid React state batching issues
      setTimeout(() => {
        setTourStep(prevStep => prevStep + 1);
      }, 100);
    } else if (type === 'step:after' && action === 'prev') {
      setTimeout(() => {
        setTourStep(prevStep => Math.max(0, prevStep - 1));
      }, 100);
    }
  };

  const startTour = () => {
    setQuickGuideDialogOpen(true);
  };

  const handleStartTourFromDialog = () => {
    setQuickGuideDialogOpen(false);
    setTourStep(0);
    setTimeout(() => {
      setRunTour(true);
    }, 400);
  };

  // Add a toggle function for batch mode
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
  };

  // Add a utility function for formatting dates consistently
  // Add this near the top of the component, with other utility functions

  // Add a helper function to format dates for input fields
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD for input[type="date"]
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Add this useEffect to initialize dates properly when the component loads
  // Add after other useEffect hooks

  useEffect(() => {
    // Initialize dates with proper format if they're empty
    const today = new Date();
    const todayFormatted = formatDateForInput(today.toISOString());
    
    // Create a copy to avoid unnecessary re-renders
    const needsUpdate = 
      !formData.model.startDate || 
      !formData.model.valuationDate || 
      !formData.model.codDate || 
      !formData.model.capexDate;
    
    if (needsUpdate) {
      setFormData(prevFormData => {
        const newModel = { ...prevFormData.model };
        
        // Set default dates if not already set
        if (!newModel.startDate) newModel.startDate = todayFormatted;
        
        // Default valuation date to start date
        if (!newModel.valuationDate) {
          newModel.valuationDate = newModel.startDate;
        }
        
        // Default COD date to start date + 1 year
        if (!newModel.codDate) {
          const codDate = new Date(newModel.startDate);
          codDate.setFullYear(codDate.getFullYear() + 1);
          newModel.codDate = formatDateForInput(codDate.toISOString());
        }
        
        // Default CAPEX date to start date
        if (!newModel.capexDate) {
          newModel.capexDate = newModel.startDate;
        }
        
        // Only update if needed
        return {
          ...prevFormData,
          model: newModel
        };
      });
    }
  }, []);

  const smallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  // Add these new state variables at the top with other state declarations
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [openAIKey, setOpenAIKey] = useState<string>(
    process.env.REACT_APP_OPENAI_API_KEY || ''
  );

  // Add useEffect to show the mode dialog when component mounts
  useEffect(() => {
    // Show mode selection dialog when component first loads
    const hasShownDialog = localStorage.getItem('hasShownDCFModeDialog');
    if (!hasShownDialog) {
      setModeDialogOpen(true);
      // Set flag to not show on future visits unless explicitly triggered
      localStorage.setItem('hasShownDCFModeDialog', 'true');
    }
  }, []);

  // Add handlers for mode selection
  const handleOpenModeDialog = () => {
    setModeDialogOpen(true);
  };

  const handleCloseModeDialog = () => {
    setModeDialogOpen(false);
  };

  const handleSelectStandardMode = () => {
    setIsAIMode(false);
    setModeDialogOpen(false);
  };

  const handleSelectAIMode = () => {
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      setError('OpenAI API key is not configured. Please check your environment variables.');
      return;
    }
    setIsAIMode(true);
    setModeDialogOpen(false);
  };

  const handleBackFromAIMode = () => {
    setIsAIMode(false);
  };

  return (
    <Container maxWidth="xl">
      <Joyride
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        run={runTour}
        scrollToFirstStep={true}
        stepIndex={tourStep}
        disableOverlayClose={true}
        disableCloseOnEsc={false}
        hideBackButton={false}
        spotlightClicks={false}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#E16813', // Using the first orange from the color palette
            arrowColor: '#fff',
            backgroundColor: '#fff',
            textColor: '#333',
            width: 400,
          },
          spotlight: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter overlay to avoid the harsh black box
          },
          tooltip: {
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
          buttonNext: {
            backgroundColor: '#E16813', // Using the first orange from the color palette
            borderRadius: 4,
            color: '#fff',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#333',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#666',
          }
        }}
        steps={tourSteps}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {isBatchMode ? (
        <BatchProcessing onBack={() => setIsBatchMode(false)} />
      ) : isAIMode ? (
        <AIValuation apiKey={openAIKey} onBack={handleBackFromAIMode} />
      ) : (
        <>
          <Box sx={{ mb: 4 }} id="dcf-header">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  mr: 2,
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                  width: 54,
                  height: 54,
                  justifyContent: 'center'
                }}
              >
                <LeafIcon sx={{ fontSize: 32, color: 'white' }} />
                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 'bold', mt: -0.5 }}>
                  ABC
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" gutterBottom>
                  ABC Renew DCF Calculator
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Discounted Cash Flow analysis tool for renewable energy assets
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
                  <Button
                    startIcon={<HelpOutlineIcon />}
                    onClick={startTour}
                    id="quick-guide-button"
                    sx={{ ml: 1 }}
                  >
                    Quick Guide
                  </Button>
                  <Button
                    startIcon={<DatasetIcon />}
                    onClick={handleLoadSampleData}
                    id="sample-data-button"
                  >
                    Load Sample Data
                  </Button>
                  <Button
                    startIcon={<AIIcon />}
                    onClick={handleOpenModeDialog}
                    id="ai-mode-button"
                  >
                    AI Valuation
                  </Button>
                </ButtonGroup>
                <Button
                  startIcon={<LoadIcon />}
                  onClick={() => setLoadDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Load Scenario
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!formData.asset.name}
                  id="save-scenario-button"
                >
                  Save Scenario
                </Button>
                <Button
                  startIcon={<QueuePlayNextIcon />}
                  onClick={handleOpenBatchDialog}
                  sx={{ mr: 1 }}
                >
                  Batch Process
                </Button>
                <Button
                  startIcon={showTooltips ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setShowTooltips(!showTooltips)}
                  color="secondary"
                  variant="outlined"
                  sx={{ ml: 2 }}
                >
                  {showTooltips ? "Hide Tooltips" : "Show Tooltips"}
                </Button>
              </Box>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={toggleBatchMode}
                startIcon={<LayersIcon />}
              >
                Batch Processing
              </Button>
            </Box>
          </Box>

          <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="DCF calculator tabs"
              >
                <Tab label="Production & Revenue" />
                <Tab label="Costs & Financial" />
                <Tab label="Tax" />
                <Tab label="Macro & Debt" />
                <Tab label="Discount Rate" />
                <Tab label="Results" className="results-tab" />
                <Tab label="Sensitivity Analysis" className="sensitivity-tab" />
                <Tab label="Valuation Bridge" className="valuation-bridge-tab" />
              </Tabs>
            </Box>

            {/* Keep each TabPanel as it was originally */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} id="asset-section">
                  <Typography variant="h6" gutterBottom>
                    Asset Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Asset Name"
                        fullWidth
                        variant="outlined"
                        value={formData.asset.name}
                        onChange={handleInputChange('asset', '', 'name')}
                        error={hasError('asset.name')}
                        helperText={getHelperText('asset.name')}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Asset Type"
                        fullWidth
                        variant="outlined"
                        value={formData.asset.type}
                        onChange={handleInputChange('asset', '', 'type')}
                        error={hasError('asset.type')}
                        helperText={getHelperText('asset.type')}
                      >
                        <MenuItem value="solar">Solar</MenuItem>
                        <MenuItem value="wind">Wind</MenuItem>
                        <MenuItem value="hydro">Hydro</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Location"
                        fullWidth
                        variant="outlined"
                        value={formData.asset.location}
                        onChange={handleInputChange('asset', '', 'location')}
                        error={hasError('asset.location')}
                        helperText={getHelperText('asset.location') || "Required - Enter the asset's geographic location"}
                        required
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} id="production-section">
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Production Inputs
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isBottomUpProduction}
                        onChange={(e) => setIsBottomUpProduction(e.target.checked)}
                      />
                    }
                    label="Use Bottom-up Calculation"
                  />
                  
                  {!isBottomUpProduction ? (
                    <TextField
                      fullWidth
                      label="Annual Production (MWh)"
                      value={formData.production.simplified.annualProduction}
                      onChange={handleInputChange('production', 'simplified', 'annualProduction')}
                      sx={{ mt: 2 }}
                      error={hasError('production.simplified.annualProduction')}
                      helperText={getHelperText('production.simplified.annualProduction')}
                    />
                  ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Capacity (MW)"
                          value={formData.production.bottomUp.capacity}
                          onChange={handleInputChange('production', 'bottomUp', 'capacity')}
                          error={hasError('production.bottomUp.capacity')}
                          helperText={getHelperText('production.bottomUp.capacity')}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Capacity Yield (%)"
                          value={formData.production.bottomUp.capacityYield}
                          onChange={handleInputChange('production', 'bottomUp', 'capacityYield')}
                          error={hasError('production.bottomUp.capacityYield')}
                          helperText={getHelperText('production.bottomUp.capacityYield')}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Degradation Rate (%)"
                          value={formData.production.bottomUp.degradationRate}
                          onChange={handleInputChange('production', 'bottomUp', 'degradationRate')}
                          error={hasError('production.bottomUp.degradationRate')}
                          helperText={getHelperText('production.bottomUp.degradationRate')}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Planned Outage Hours"
                          value={formData.production.bottomUp.plannedOutageHours}
                          onChange={handleInputChange('production', 'bottomUp', 'plannedOutageHours')}
                          error={hasError('production.bottomUp.plannedOutageHours')}
                          helperText={getHelperText('production.bottomUp.plannedOutageHours')}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Unplanned Outage Hours"
                          value={formData.production.bottomUp.unplannedOutageHours}
                          onChange={handleInputChange('production', 'bottomUp', 'unplannedOutageHours')}
                          error={hasError('production.bottomUp.unplannedOutageHours')}
                          helperText={getHelperText('production.bottomUp.unplannedOutageHours')}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Availability (%)"
                          type="number"
                          InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                          value={formData.production.bottomUp.availability}
                          onChange={handleInputChange('production', 'bottomUp', 'availability')}
                          error={hasError('production.bottomUp.availability')}
                          helperText={getHelperText('production.bottomUp.availability') || "Required - Typically 95-99%"}
                          required
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>

                <Grid item xs={12} id="pricing-section">
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Pricing Inputs
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contracted Price ($/MWh)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        value={formData.pricing.contracted.price}
                        onChange={handleInputChange('pricing', 'contracted', 'price')}
                        error={hasError('pricing.contracted.price')}
                        helperText={getHelperText('pricing.contracted.price')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Merchant Price ($/MWh)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        value={formData.pricing.merchant.price}
                        onChange={handleInputChange('pricing', 'merchant', 'price')}
                        error={hasError('pricing.merchant.price')}
                        helperText={getHelperText('pricing.merchant.price')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contracted Percentage (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                        value={formData.pricing.contracted.percentage}
                        onChange={handleInputChange('pricing', 'contracted', 'percentage')}
                        error={hasError('pricing.contracted.percentage')}
                        helperText={getHelperText('pricing.contracted.percentage')}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contract Length (years)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.pricing.contracted.contractLength}
                        onChange={handleInputChange('pricing', 'contracted', 'contractLength')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Price Escalation (%/year)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.pricing.contracted.escalationRate}
                        onChange={handleInputChange('pricing', 'contracted', 'escalationRate')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Merchant Price Growth (%/year)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.pricing.merchant.priceGrowth}
                        onChange={handleInputChange('pricing', 'merchant', 'priceGrowth')}
                      />
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Capacity Market Revenue
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.pricing.capacityMarket.enabled}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              pricing: {
                                ...formData.pricing,
                                capacityMarket: {
                                  ...formData.pricing.capacityMarket,
                                  enabled: e.target.checked
                                }
                              }
                            });
                          }}
                        />
                      }
                      label="Include Capacity Market Revenue"
                    />
                    
                    {formData.pricing.capacityMarket.enabled && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Annual Revenue ($)"
                            fullWidth
                            variant="outlined"
                            type="number"
                            InputProps={{ inputProps: { min: 0, step: 1000 } }}
                            value={formData.pricing.capacityMarket.revenue}
                            onChange={handleInputChange('pricing', 'capacityMarket', 'revenue')}
                            helperText="Fixed annual payment"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Escalation Rate (%/year)"
                            fullWidth
                            variant="outlined"
                            type="number"
                            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                            value={formData.pricing.capacityMarket.escalationRate}
                            onChange={handleInputChange('pricing', 'capacityMarket', 'escalationRate')}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Term (years)"
                            fullWidth
                            variant="outlined"
                            type="number"
                            InputProps={{ inputProps: { min: 1, step: 1 } }}
                            value={formData.pricing.capacityMarket.term}
                            onChange={handleInputChange('pricing', 'capacityMarket', 'term')}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} id="costs-section">
                  <Typography variant="h6" gutterBottom>
                    Cost Inputs
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="Cost Method"
                        fullWidth
                        variant="outlined"
                        value={formData.costs.method}
                        onChange={handleInputChange('costs', '', 'method')}
                      >
                        <MenuItem value="manual">Manual Entry</MenuItem>
                        <MenuItem value="perMW">Per MW</MenuItem>
                        <MenuItem value="percentage">Percentage of Revenue</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Cost Escalation (%/year)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.costs.costEscalation}
                        onChange={handleInputChange('costs', '', 'costEscalation')}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Operational Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.operationalCosts}
                        onChange={handleInputChange('costs', '', 'operationalCosts')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Maintenance Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.maintenanceCosts}
                        onChange={handleInputChange('costs', '', 'maintenanceCosts')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Land Lease Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.landLeaseCosts}
                        onChange={handleInputChange('costs', '', 'landLeaseCosts')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Insurance Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.insuranceCosts}
                        onChange={handleInputChange('costs', '', 'insuranceCosts')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Administrative Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.administrativeCosts}
                        onChange={handleInputChange('costs', '', 'administrativeCosts')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Other Costs"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.costs.otherCosts}
                        onChange={handleInputChange('costs', '', 'otherCosts')}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} id="financial-section">
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Financial Inputs
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Removing this tax rate field
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Tax Rate (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.financial.taxRate}
                        onChange={handleInputChange('financial', '', 'taxRate')}
                        error={hasError('financial.taxRate')}
                        helperText={getHelperText('financial.taxRate')}
                      />
                    </Grid>
                    */}
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Depreciation
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="Depreciation Method"
                        fullWidth
                        variant="outlined"
                        value={formData.financial.depreciation.method}
                        onChange={handleInputChange('financial', 'depreciation', 'method')}
                      >
                        <MenuItem value="straightLine">Straight Line</MenuItem>
                        <MenuItem value="decliningBalance">Declining Balance</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Depreciation Period (years)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
                        value={formData.financial.depreciation.period}
                        onChange={handleInputChange('financial', 'depreciation', 'period')}
                        error={hasError('financial.depreciation.period')}
                        helperText={getHelperText('financial.depreciation.period')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Salvage Value (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.financial.depreciation.salvageValue}
                        onChange={handleInputChange('financial', 'depreciation', 'salvageValue')}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    CAPEX
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Initial CAPEX ($)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 10000 } }}
                        value={formData.financial.capex.initial}
                        onChange={handleInputChange('financial', 'capex', 'initial')}
                        error={hasError('financial.capex.initial')}
                        helperText={getHelperText('financial.capex.initial')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Ongoing CAPEX ($/year)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.financial.capex.ongoing}
                        onChange={handleInputChange('financial', 'capex', 'ongoing')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contingency (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.financial.capex.contingency}
                        onChange={handleInputChange('financial', 'capex', 'contingency')}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Working Capital
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Receivable Days"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.financial.workingCapital.receivableDays}
                        onChange={handleInputChange('financial', 'workingCapital', 'receivableDays')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Payable Days"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.financial.workingCapital.payableDays}
                        onChange={handleInputChange('financial', 'workingCapital', 'payableDays')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Inventory Days"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.financial.workingCapital.inventoryDays}
                        onChange={handleInputChange('financial', 'workingCapital', 'inventoryDays')}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} id="tax-section">
                  <Typography variant="h6" gutterBottom>
                    Tax Inputs
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Corporate Tax Rate (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.tax.corporateRate}
                        onChange={handleInputChange('tax', '', 'corporateRate')}
                        error={hasError('tax.corporateRate')}
                        helperText={getHelperText('tax.corporateRate')}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Tax Loss Carry Forward
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.tax.carryForwardLosses.enabled}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                tax: {
                                  ...formData.tax,
                                  carryForwardLosses: {
                                    ...formData.tax.carryForwardLosses,
                                    enabled: e.target.checked
                                  }
                                }
                              });
                            }}
                          />
                        }
                        label="Enable Tax Loss Carry Forward"
                      />
                    </Grid>
                    {formData.tax.carryForwardLosses.enabled && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Opening Balance ($)"
                            fullWidth
                            variant="outlined"
                            type="number"
                            InputProps={{ inputProps: { min: 0, step: 1000 } }}
                            value={formData.tax.carryForwardLosses.openingBalance}
                            onChange={handleInputChange('tax', 'carryForwardLosses', 'openingBalance')}
                            helperText="Starting tax loss balance"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Expiry Period (years)"
                            fullWidth
                            variant="outlined"
                            type="number"
                            InputProps={{ inputProps: { min: 0, step: 1 } }}
                            value={formData.tax.carryForwardLosses.expiryPeriod}
                            onChange={handleInputChange('tax', 'carryForwardLosses', 'expiryPeriod')}
                            helperText="0 for indefinite carry forward"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Capital Allowances
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Method"
                        fullWidth
                        variant="outlined"
                        value={formData.tax.capitalAllowances.method}
                        onChange={handleInputChange('tax', 'capitalAllowances', 'method')}
                      >
                        <MenuItem value="straightLine">Straight Line</MenuItem>
                        <MenuItem value="decliningBalance">Declining Balance</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Rate (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.tax.capitalAllowances.rate}
                        onChange={handleInputChange('tax', 'capitalAllowances', 'rate')}
                        helperText="Annual allowance rate"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Opening Balance ($)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        value={formData.tax.capitalAllowances.openingBalance}
                        onChange={handleInputChange('tax', 'capitalAllowances', 'openingBalance')}
                        helperText="Starting capital allowance balance"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} id="macro-section">
                  <Typography variant="h6" gutterBottom>
                    Macroeconomic Assumptions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Revenue Inflation (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.macro.revenueInflation}
                        onChange={handleInputChange('macro', '', 'revenueInflation')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Cost Inflation (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.macro.costInflation}
                        onChange={handleInputChange('macro', '', 'costInflation')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="CAPEX Inflation (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        value={formData.macro.capexInflation}
                        onChange={handleInputChange('macro', '', 'capexInflation')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Base Year"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 2020, max: 2050, step: 1 } }}
                        value={formData.macro.baseYear}
                        onChange={handleInputChange('macro', '', 'baseYear')}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} id="debt-section">
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Debt Financing
                    </Typography>
                    <Button 
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                      onClick={handleAddDebtInstrument}
                    >
                      Add Debt Instrument
                    </Button>
                  </Box>
                  
                  {/* Show the list of debt instruments if any */}
                  {debtInstruments.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Additional Debt Instruments
                      </Typography>
                      {debtInstruments.map((debt) => (
                        <Paper key={debt.id} sx={{ p: 2, mb: 2, position: 'relative' }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleRemoveDebtInstrument(debt.id)}
                            sx={{ position: 'absolute', top: 10, right: 10 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                label="Debt Name"
                                fullWidth
                                value={debt.name}
                                onChange={(e) => {
                                  const updated = debtInstruments.map(d => 
                                    d.id === debt.id ? { ...d, name: e.target.value } : d
                                  );
                                  setDebtInstruments(updated);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                label="Amount ($)"
                                fullWidth
                                type="number"
                                InputProps={{ inputProps: { min: 0, step: 10000 } }}
                                value={debt.amount}
                                onChange={(e) => {
                                  const updated = debtInstruments.map(d => 
                                    d.id === debt.id ? { ...d, amount: e.target.value } : d
                                  );
                                  setDebtInstruments(updated);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Interest Rate (%)"
                                fullWidth
                                type="number"
                                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                                value={debt.interestRate}
                                onChange={(e) => {
                                  const updated = debtInstruments.map(d => 
                                    d.id === debt.id ? { ...d, interestRate: e.target.value } : d
                                  );
                                  setDebtInstruments(updated);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Term (years)"
                                fullWidth
                                type="number"
                                InputProps={{ inputProps: { min: 1, step: 1 } }}
                                value={debt.term}
                                onChange={(e) => {
                                  const updated = debtInstruments.map(d => 
                                    d.id === debt.id ? { ...d, term: e.target.value } : d
                                  );
                                  setDebtInstruments(updated);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                select
                                label="Repayment Structure"
                                fullWidth
                                value={debt.repaymentStructure}
                                onChange={(e) => {
                                  const updated = debtInstruments.map(d => 
                                    d.id === debt.id ? { ...d, repaymentStructure: e.target.value as 'linear' | 'balloon' | 'custom' } : d
                                  );
                                  setDebtInstruments(updated);
                                }}
                              >
                                <MenuItem value="linear">Linear</MenuItem>
                                <MenuItem value="balloon">Balloon</MenuItem>
                                <MenuItem value="custom">Custom</MenuItem>
                              </TextField>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                  
                  {/* Original debt inputs */}
                  <Grid container spacing={2}>
                    {/* Primary debt fields remain the same */}
                    
                    {/* Add a tooltip explanation for DSRA */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="DSRA (months of debt service)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.debt.dsra}
                        onChange={handleInputChange('debt', '', 'dsra')}
                        helperText={showTooltips ? "Debt Service Reserve Account - Cash reserve maintained to cover debt payments" : ""}
                      />
                    </Grid>
                    
                    {/* Other debt fields remain the same */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Debt Amount ($)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 10000 } }}
                        value={formData.debt.amount}
                        onChange={handleInputChange('debt', '', 'amount')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Interest Rate (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.debt.interestRate}
                        onChange={handleInputChange('debt', '', 'interestRate')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Term (years)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
                        value={formData.debt.term}
                        onChange={handleInputChange('debt', '', 'term')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="Repayment Structure"
                        fullWidth
                        value={formData.debt.repaymentStructure}
                        onChange={handleInputChange('debt', '', 'repaymentStructure')}
                      >
                        <MenuItem value="linear">Linear</MenuItem>
                        <MenuItem value="balloon">Balloon</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Grace Period (years)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, step: 1 } }}
                        value={formData.debt.gracePeroid}
                        onChange={handleInputChange('debt', '', 'gracePeroid')}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Upfront Fee (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 10, step: 0.1 } }}
                        value={formData.debt.upfrontFee}
                        onChange={handleInputChange('debt', '', 'upfrontFee')}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="Drawdown Schedule (comma-separated percentages)"
                        fullWidth
                        variant="outlined"
                        placeholder="e.g. 30, 40, 30"
                        value={formData.debt.drawdownSchedule}
                        onChange={handleInputChange('debt', '', 'drawdownSchedule')}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} id="model-section">
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Model Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Discount Rate (%)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                        value={formData.model.discountRate}
                        onChange={handleInputChange('model', '', 'discountRate')}
                        error={hasError('model.discountRate')}
                        helperText={getHelperText('model.discountRate')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Start Date"
                        fullWidth
                        variant="outlined"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.model.startDate}
                        onChange={handleInputChange('model', '', 'startDate')}
                        error={hasError('model.startDate')}
                        helperText={getHelperText('model.startDate')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Valuation Date"
                        fullWidth
                        variant="outlined"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.model.valuationDate}
                        onChange={handleInputChange('model', '', 'valuationDate')}
                        error={hasError('model.valuationDate')}
                        helperText={showTooltips ? "Date to which all cash flows are discounted" : ""}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Forecast Period (years)"
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 1, max: 50, step: 1 } }}
                        value={formData.model.forecastPeriod}
                        onChange={handleInputChange('model', '', 'forecastPeriod')}
                        error={hasError('model.forecastPeriod')}
                        helperText={getHelperText('model.forecastPeriod')}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="End Date"
                        fullWidth
                        variant="outlined"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.model.endDate}
                        onChange={handleInputChange('model', '', 'endDate')}
                        disabled
                        helperText="Calculated automatically"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Commercial Operation Date (COD)"
                        type="date"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={formData.model.codDate}
                        onChange={handleInputChange('model', '', 'codDate')}
                        error={hasError('model.codDate')}
                        helperText={showTooltips ? "Date when the asset begins commercial operation" : ""}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Initial CAPEX Date"
                        type="date"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        value={formData.model.capexDate}
                        onChange={handleInputChange('model', '', 'capexDate')}
                        error={hasError('model.capexDate')}
                        helperText={showTooltips ? "Date when initial CAPEX is spent" : ""}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Terminal Value
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="Terminal Value Method"
                        fullWidth
                        variant="outlined"
                        value={formData.model.terminalValue.method}
                        onChange={handleInputChange('model', 'terminalValue', 'method')}
                      >
                        <MenuItem value="perpetuity">Perpetuity Growth</MenuItem>
                        <MenuItem value="exitMultiple">Exit Multiple</MenuItem>
                        <MenuItem value="none">None</MenuItem>
                      </TextField>
                    </Grid>
                    {formData.model.terminalValue.method === 'perpetuity' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Growth Rate (%)"
                          fullWidth
                          variant="outlined"
                          type="number"
                          InputProps={{ inputProps: { min: -10, max: 10, step: 0.1 } }}
                          value={formData.model.terminalValue.growthRate}
                          onChange={handleInputChange('model', 'terminalValue', 'growthRate')}
                        />
                      </Grid>
                    )}
                    {formData.model.terminalValue.method === 'exitMultiple' && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Multiple (x)"
                          fullWidth
                          variant="outlined"
                          type="number"
                          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                          value={formData.model.terminalValue.multiple}
                          onChange={handleInputChange('model', 'terminalValue', 'multiple')}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <DiscountRateCalculator
                discountRate={parseFloat(formData.model.discountRate) || 10}
                onDiscountRateChange={handleDiscountRateChange}
                npvAtCurrentRate={getCurrentNPV()}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={5}>
              <ResultsPanel results={results} isLoading={isLoading} />
              {!results && !isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCalculate}
                    disabled={isLoading}
                    id="calculate-button"
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Calculating...
                      </>
                    ) : (
                      'Calculate DCF'
                    )}
                  </Button>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={6}>
              <SensitivityPanel
                variables={sensitivityVariables}
                onAddVariable={handleAddSensitivityVariable}
                onRemoveVariable={handleRemoveSensitivityVariable}
                onRunAnalysis={handleRunSensitivityAnalysis}
                isLoading={isLoading}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={7}>
              <ValuationBridgePanel
                valuationBridge={valuationBridge}
                variables={bridgeVariables}
                currentNPV={getCurrentNPV()}
                onAddVariable={handleAddBridgeVariable}
                onRemoveVariable={handleRemoveBridgeVariable}
                onGenerateBridge={handleGenerateValuationBridge}
                isLoading={isLoading}
              />
            </TabPanel>
          </Paper>

          {/* Bottom button area */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 4 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isLoading ? <CircularProgress size={20} /> : <CalculateIcon />}
              onClick={handleCalculate}
              sx={{ minWidth: 150 }}
              disabled={isLoading}
            >
              {isLoading ? 'Calculating...' : 'Calculate DCF'}
            </Button>
          </Box>
        </>
      )}

      {/* Load Scenario Dialog */}
      <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} maxWidth="md" fullWidth>
        {/* Original dialog content */}
      </Dialog>

      {/* Save Scenario Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        {/* Original dialog content */}
      </Dialog>

      {/* Batch Processing Dialog */}
      <Dialog open={batchDialogOpen} onClose={handleCloseBatchDialog} maxWidth="md" fullWidth>
        {/* Original dialog content */}
      </Dialog>

      {/* Quick Guide Dialog */}
      <Dialog
        open={quickGuideDialogOpen}
        onClose={() => setQuickGuideDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quick Guide</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Welcome to the DCF Calculator! Would you like to take a quick tour of the main features?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This guide will walk you through the key components and help you get started.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickGuideDialogOpen(false)}>Skip</Button>
          <Button variant="contained" onClick={handleStartTourFromDialog}>
            Start Tour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add this error summary component right after the Tab controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2 }}>
        {Object.keys(validationErrors).length > 0 && (
          <Alert 
            severity="error" 
            sx={{ width: '100%' }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setValidationErrors({})}
              >
                CLEAR
              </Button>
            }
          >
            <Typography variant="subtitle1" gutterBottom>
              Please correct the following errors:
            </Typography>
            {Object.entries(errorGroups).map(([group, errors]) => {
              if (errors.length === 0) return null;
              return (
                <Box key={group} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {group} section:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {errors.map((error, i) => (
                      <li key={i}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              );
            })}
          </Alert>
        )}
      </Box>

      {/* Mode Selection Dialog */}
      <CalculatorModeDialog 
        open={modeDialogOpen}
        onClose={handleCloseModeDialog}
        onSelectStandard={handleSelectStandardMode}
        onSelectAI={handleSelectAIMode}
      />
    </Container>
  );
}

export default DCFCalculator;

// Empty export to ensure file is treated as a module
export {};