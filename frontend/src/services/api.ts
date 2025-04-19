import axios from 'axios';
import { DCFResults } from '../components/DCF/ResultsPanel';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Define interfaces for the DCF calculation
export interface DCFFormData {
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
      revenue: string;
      escalationRate: string;
      term: string;
    };
  };
  // Tax section
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
    taxRate: string;
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
    valuationDate: string; // Add this property - Date to which cash flows are discounted 
    capexDate: string; // Add this property - Date when initial CAPEX is spent
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

interface DCFResult {
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
    fcf: number;
    dcf: number;
  }>;
}

interface SensitivityVariable {
  name: string;
  range: {
    low: string;
    high: string;
    step: string;
  };
}

interface SensitivityResult {
  variable: string;
  value: number;
  enterpriseValue: number;
  equityValue: number;
  npv: number;
  irr: number;
}

// Define the Scenario interface needed for the scenarios API
interface Scenario {
  id: string;
  name: string;
  description: string;
  formData: DCFFormData;
  results: ExtendedDCFResults | null;
  createdAt: string;
  updatedAt: string;
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Update the ExtendedDCFResults interface to include all calculated fields
export interface ExtendedDCFResults {
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
    revenue: number;
    ebitda: number;
    fcf: number;
    dcf: number;
    production: number;
    operationalCosts: number;
    maintenanceCosts: number;
    landLeaseCosts: number;
    insuranceCosts: number;
    administrativeCosts: number;
    otherCosts: number;
    totalCosts: number;
    depreciation: number;
    taxes: number;
    contractedRevenue: number;
    merchantRevenue: number;
    capacityMarketRevenue: number;
    contractedPrice: number;
    merchantPrice: number;
    availability: number;
    degradation: number;
    capacityFactor: number;
  }>;
  valuationDate: string;
  initialCapex?: number;
  codDate?: string;
}

// DCF Calculator endpoints with fallback implementation
export const dcfApi = {
  calculate: async (data: DCFFormData) => {
    try {
      console.log('Sending DCF calculation to C# backend API:', data);
      
      // Transform the frontend data model to match the C# backend model
      const backendData = {
        modelStartDate: new Date(data.model.startDate),
        valuationDate: new Date(data.model.valuationDate),
        commercialOperationDate: new Date(data.model.codDate),
        forecastLength: parseInt(data.model.forecastPeriod),
        discountRate: parseFloat(data.model.discountRate) / 100,
        
        // Production Parameters
        productionMethod: data.production.bottomUp.capacity ? "bottom-up" : "manual",
        capacity: parseFloat(data.production.bottomUp.capacity),
        capacityYield: parseFloat(data.production.bottomUp.capacityYield) / 100,
        degradationRate: parseFloat(data.production.bottomUp.degradationRate) / 100,
        availability: parseFloat(data.production.bottomUp.availability) / 100,
        
        // Pricing Parameters
        contractedPrice: parseFloat(data.pricing.contracted.price),
        contractedEscalationRate: parseFloat(data.pricing.contracted.escalationRate) / 100,
        merchantPrice: parseFloat(data.pricing.merchant.price),
        merchantEscalationRate: parseFloat(data.pricing.merchant.priceGrowth) / 100,
        contractedPercentage: parseFloat(data.pricing.contracted.percentage) / 100,
        regulatoryPrice: parseFloat(data.pricing.regulatory.price) || 0,
        
        // Cost Parameters
        costMethod: data.costs.method === 'perMW' ? 'per_mw' : data.costs.method,
        operatingCost: parseFloat(data.costs.operationalCosts) + parseFloat(data.costs.maintenanceCosts || '0'),
        costInflationRate: parseFloat(data.macro.costInflation) / 100,
        
        // Financial Parameters
        taxRate: parseFloat(data.tax.corporateRate) / 100,
        
        // Depreciation
        depreciationMethod: data.financial.depreciation.method === 'straightLine' ? 'straight_line' : 'declining_balance',
        depreciationYears: parseInt(data.financial.depreciation.period),
        
        // Working Capital
        receivableDays: parseInt(data.financial.workingCapital.receivableDays),
        payableDays: parseInt(data.financial.workingCapital.payableDays),
        inventoryDays: parseInt(data.financial.workingCapital.inventoryDays),
        
        // Capex
        capex: { 
          // Place initial capex in the capexDate year, not COD year
          [new Date(data.model.capexDate).getFullYear().toString()]: parseFloat(data.financial.capex.initial) 
        },
        capexInflationRate: parseFloat(data.macro.capexInflation) / 100,
        
        // Debt Parameters
        debtAmount: parseFloat(data.debt.amount),
        interestRate: parseFloat(data.debt.interestRate) / 100,
        
        // Terminal Value Parameters
        terminalValueMethod: data.model.terminalValue.method === 'perpetuity' ? 'perpetuity' : 
                            data.model.terminalValue.method === 'exitMultiple' ? 'exit_multiple' : 'none',
        terminalGrowthRate: parseFloat(data.model.terminalValue.growthRate) / 100,
        terminalMultiple: parseFloat(data.model.terminalValue.multiple)
      };
      
      // Make actual API call to C# backend
      const response = await api.post('http://localhost:5000/api/DCF/calculate', backendData);
      console.log('C# backend response:', response.data);
      
      // Convert the C# backend response to the frontend model
      return {
        data: {
          enterpriseValue: response.data.npv,
          equityValue: response.data.npv - parseFloat(data.debt.amount),
          npv: response.data.npv,
          irr: response.data.irr !== -999 ? response.data.irr : -999,
          paybackPeriod: response.data.paybackPeriod === parseInt(data.model.forecastPeriod) ? 
                         parseInt(data.model.forecastPeriod) : // Return forecast length if cashflows never become positive
                         response.data.paybackPeriod || 0, // Otherwise use the calculated value or fallback to 0
          dscr: { min: 0, average: 0 },
          yearlyResults: response.data.annualCashFlows.map((cf: number, i: number) => {
            // Calculate yearly production for the table
            const hoursPerYear = 8760;
            const yearlyDegradation = Math.pow(1 - parseFloat(data.production.bottomUp.degradationRate)/100, i);
            const yearlyProduction = parseFloat(data.production.bottomUp.capacity) * 
                                  hoursPerYear * 
                                  parseFloat(data.production.bottomUp.capacityYield)/100 * 
                                  parseFloat(data.production.bottomUp.availability)/100 * 
                                  yearlyDegradation;
            
            // Calculate revenue for this year 
            const contractedEscalation = Math.pow(1 + parseFloat(data.pricing.contracted.escalationRate)/100, i);
            const merchantEscalation = Math.pow(1 + parseFloat(data.pricing.merchant.priceGrowth)/100, i);
            const contractedPrice = parseFloat(data.pricing.contracted.price) * contractedEscalation;
            const merchantPrice = parseFloat(data.pricing.merchant.price) * merchantEscalation;
            const contractedRevenue = yearlyProduction * contractedPrice * parseFloat(data.pricing.contracted.percentage)/100;
            const merchantRevenue = yearlyProduction * merchantPrice * (1 - parseFloat(data.pricing.contracted.percentage)/100);
            const totalRevenue = contractedRevenue + merchantRevenue;
            
            // Calculate operating costs
            const operationalCosts = parseFloat(data.costs.operationalCosts) * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i);
            const maintenanceCosts = parseFloat(data.costs.maintenanceCosts || '0') * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i);
            const totalCosts = operationalCosts + maintenanceCosts;
            
            // Calculate EBITDA
            const ebitda = totalRevenue - totalCosts;
            
            return {
              year: new Date(data.model.startDate).getFullYear() + i,
              revenue: totalRevenue,
              ebitda: ebitda,
              fcf: cf,
              dcf: cf / Math.pow(1 + parseFloat(data.model.discountRate)/100, i),
              production: yearlyProduction,
              operationalCosts: operationalCosts,
              maintenanceCosts: maintenanceCosts,
              landLeaseCosts: parseFloat(data.costs.landLeaseCosts || '0') * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i),
              insuranceCosts: parseFloat(data.costs.insuranceCosts || '0') * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i),
              administrativeCosts: parseFloat(data.costs.administrativeCosts || '0') * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i),
              otherCosts: parseFloat(data.costs.otherCosts || '0') * Math.pow(1 + parseFloat(data.macro.costInflation)/100, i),
              totalCosts: totalCosts,
              depreciation: 0, // Could calculate but not essential for this fix
              taxes: 0, // Could calculate but not essential for this fix
              contractedRevenue: contractedRevenue,
              merchantRevenue: merchantRevenue,
              capacityMarketRevenue: 0, // Add if needed
              contractedPrice: contractedPrice,
              merchantPrice: merchantPrice,
              availability: parseFloat(data.production.bottomUp.availability)/100,
              degradation: yearlyDegradation,
              capacityFactor: parseFloat(data.production.bottomUp.capacityYield)/100
            };
          }),
          valuationDate: data.model.valuationDate,
          initialCapex: parseFloat(data.financial.capex.initial),
          codDate: data.model.codDate
        }
      };
    } catch (error: any) {
      console.error('Error calling C# backend:', error);
      throw new Error(`Failed to connect to C# backend: ${error.message || 'Unknown error'}`);
    }
  },
  sensitivity: async (data: { formData: DCFFormData, variables: SensitivityVariable[] }) => {
    try {
      console.log('Running sensitivity analysis with C# backend:', data);
      
      // Transform the frontend data model to match the C# backend model - similar to calculate method
      const backendData = {
        // Base input data - same as in calculate method
        modelStartDate: new Date(data.formData.model.startDate),
        valuationDate: new Date(data.formData.model.valuationDate),
        commercialOperationDate: new Date(data.formData.model.codDate),
        forecastLength: parseInt(data.formData.model.forecastPeriod),
        discountRate: parseFloat(data.formData.model.discountRate) / 100,
        
        // Production Parameters
        productionMethod: data.formData.production.bottomUp.capacity ? "bottom-up" : "manual",
        capacity: parseFloat(data.formData.production.bottomUp.capacity),
        capacityYield: parseFloat(data.formData.production.bottomUp.capacityYield) / 100,
        degradationRate: parseFloat(data.formData.production.bottomUp.degradationRate) / 100,
        availability: parseFloat(data.formData.production.bottomUp.availability) / 100,
        
        // Pricing Parameters
        contractedPrice: parseFloat(data.formData.pricing.contracted.price),
        contractedEscalationRate: parseFloat(data.formData.pricing.contracted.escalationRate) / 100,
        merchantPrice: parseFloat(data.formData.pricing.merchant.price),
        merchantEscalationRate: parseFloat(data.formData.pricing.merchant.priceGrowth) / 100,
        contractedPercentage: parseFloat(data.formData.pricing.contracted.percentage) / 100,
        regulatoryPrice: parseFloat(data.formData.pricing.regulatory.price) || 0,
        
        // Cost Parameters
        costMethod: data.formData.costs.method === 'perMW' ? 'per_mw' : data.formData.costs.method,
        operatingCost: parseFloat(data.formData.costs.operationalCosts) + 
                     parseFloat(data.formData.costs.maintenanceCosts || '0'),
        costInflationRate: parseFloat(data.formData.macro.costInflation) / 100,
        
        // Financial Parameters
        taxRate: parseFloat(data.formData.tax.corporateRate) / 100,
        
        // Depreciation
        depreciationMethod: data.formData.financial.depreciation.method === 'straightLine' ? 
                           'straight_line' : 'declining_balance',
        depreciationYears: parseInt(data.formData.financial.depreciation.period),
        
        // Working Capital
        receivableDays: parseInt(data.formData.financial.workingCapital.receivableDays),
        payableDays: parseInt(data.formData.financial.workingCapital.payableDays),
        inventoryDays: parseInt(data.formData.financial.workingCapital.inventoryDays),
        
        // Capex
        capex: { 
          // Place initial capex in the capexDate year, not COD year
          [new Date(data.formData.model.capexDate).getFullYear().toString()]: parseFloat(data.formData.financial.capex.initial) 
        },
        capexInflationRate: parseFloat(data.formData.macro.capexInflation) / 100,
        
        // Debt Parameters
        debtAmount: parseFloat(data.formData.debt.amount),
        interestRate: parseFloat(data.formData.debt.interestRate) / 100,
        
        // Terminal Value Parameters
        terminalValueMethod: data.formData.model.terminalValue.method === 'perpetuity' ? 'perpetuity' : 
                           data.formData.model.terminalValue.method === 'exitMultiple' ? 'exit_multiple' : 'none',
        terminalGrowthRate: parseFloat(data.formData.model.terminalValue.growthRate) / 100,
        terminalMultiple: parseFloat(data.formData.model.terminalValue.multiple)
      };
      
      // Get the first variable's information for sensitivity analysis
      const firstVariable = data.variables[0];
      const variableName = firstVariable.name === 'Discount Rate' ? 'DiscountRate' :
                         firstVariable.name === 'Production' ? 'Capacity' :
                         firstVariable.name === 'Price' ? 'ContractedPrice' : 'OperatingCost';
      
      const lowerBound = parseFloat(firstVariable.range.low);
      const upperBound = parseFloat(firstVariable.range.high);
      const steps = Math.ceil((upperBound - lowerBound) / parseFloat(firstVariable.range.step)) + 1;
      
      // Make sensitivity API call
      const response = await api.post(
        `http://localhost:5000/api/DCF/sensitivity?variable=${variableName}&lowerBound=${lowerBound}&upperBound=${upperBound}&steps=${steps}`, 
        backendData
      );
      
      console.log('C# backend sensitivity response:', response.data);
      
      // Get base calculation for comparison
      const baseCalcResponse = await api.post('http://localhost:5000/api/DCF/calculate', backendData);
      
      // Format the results for the frontend
      const results: SensitivityResult[] = Object.entries(response.data).map(([value, npv]) => ({
        variable: firstVariable.name,
        value: parseFloat(value),
        enterpriseValue: npv as number,
        equityValue: (npv as number) - parseFloat(data.formData.debt.amount),
        npv: npv as number,
        irr: baseCalcResponse.data.irr !== -999 ? baseCalcResponse.data.irr : -999 // Use base IRR or preserve error code
      }));
      
      // Get base results directly from the calculation endpoint
      const baseResults = await dcfApi.calculate(data.formData);
      
      return {
        data: {
          results,
          base: baseResults.data
        }
      };
    } catch (error: any) {
      console.error('Error calling C# backend for sensitivity analysis:', error);
      throw new Error(`Failed to connect to C# backend for sensitivity analysis: ${error.message || 'Unknown error'}`);
    }
  },
  scenarios: {
    list: async () => {
      try {
        // Call the C# backend's scenario listing endpoint
        const response = await api.get('http://localhost:5000/api/DCF/scenarios');
        return { data: response.data || [] };
      } catch (error: any) {
        console.error('Error fetching scenarios from C# backend:', error);
        throw new Error(`Failed to fetch scenarios: ${error.message || 'Unknown error'}`);
      }
    },
    save: async (scenario: Scenario) => {
      try {
        // Call the C# backend's scenario saving endpoint
        const response = await api.post('http://localhost:5000/api/DCF/scenarios', scenario);
        return { success: true, id: response.data?.id || scenario.id || Date.now().toString() };
      } catch (error: any) {
        console.error('Error saving scenario to C# backend:', error);
        throw new Error(`Failed to save scenario: ${error.message || 'Unknown error'}`);
      }
    },
    delete: async (id: string) => {
      try {
        // Call the C# backend's scenario deletion endpoint
        await api.delete(`http://localhost:5000/api/DCF/scenarios/${id}`);
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting scenario from C# backend:', error);
        throw new Error(`Failed to delete scenario: ${error.message || 'Unknown error'}`);
      }
    },
  },
  // Template methods for batch processing
  getTemplateData: async (templateId: string): Promise<DCFFormData> => {
    try {
      // Call the C# backend's template retrieval endpoint
      const response = await api.get(`http://localhost:5000/api/DCF/templates/${templateId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching template data from backend:', error);
      throw new Error(`Template retrieval failed: ${error.message || 'Unknown error'}`);
    }
  },
  calculateDCF: async (data: DCFFormData) => {
    // Alias for calculate for more explicit naming
    return dcfApi.calculate(data);
  },
  /**
   * Load sample data for DCF calculation
   */
  getSampleData: async (): Promise<DCFFormData> => {
    try {
      const response = await axios.get(`${baseURL}/api/dcf/sample-data`);
      return response.data;
    } catch (error) {
      console.error('Error loading sample data:', error);
      throw error;
    }
  },
  /**
   * Process a batch of DCF calculations
   * @param items Array of DCF form data objects to process
   */
  batchCalculate: async (items: DCFFormData[]): Promise<Array<{data: DCFResults}>> => {
    try {
      const response = await axios.post(`${baseURL}/api/dcf/batch-calculate`, { items });
      return response.data;
    } catch (error) {
      console.error('Error processing batch calculation:', error);
      throw error;
    }
  },
  /**
   * Get a template CSV for batch processing
   */
  getBatchTemplate: async (): Promise<string> => {
    try {
      const response = await axios.get(`${baseURL}/api/dcf/batch-template`, { responseType: 'blob' });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error getting batch template:', error);
      throw error;
    }
  },
};

// Asset Management endpoints
export const assetApi = {
  list: () => api.get('/api/v1/assets'),
  get: (id: string) => api.get(`/api/v1/assets/${id}`),
  create: (data: any) => api.post('/api/v1/assets', data),
  update: (id: string, data: any) => api.put(`/api/v1/assets/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/assets/${id}`),
};

// Report Generation endpoints
export const reportApi = {
  generate: (data: any) => api.post('/api/v1/reports/generate', data),
  list: () => api.get('/api/v1/reports'),
  get: (id: string) => api.get(`/api/v1/reports/${id}`),
  delete: (id: string) => api.delete(`/api/v1/reports/${id}`),
};

export default api; 