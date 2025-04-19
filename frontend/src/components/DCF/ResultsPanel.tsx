import React, { useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  ListAlt as ExcelIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PALETTE } from '../../theme';

export interface DCFResults {
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
  valuationDate?: string;
  initialCapex?: number;
  codDate?: string;
}

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
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ResultsPanelProps {
  results: DCFResults | null;
  isLoading: boolean;
}

interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  description?: string;
  format: 'currency' | 'percentage' | 'decimal' | 'years';
}

// Define the available column IDs
type ColumnId = keyof DCFResults['yearlyResults'][0];

// Add proper type for column format
interface TableColumn {
  id: ColumnId;
  label: string;
  format?: 'currency' | 'percentage' | 'decimal' | 'number';
  description?: string;
}

// Add available columns with proper typing
const availableColumns: TableColumn[] = [
  { id: 'year', label: 'Year', format: 'number' } as TableColumn,
  // Production related columns
  { id: 'production', label: 'Production (MWh)', format: 'number' } as TableColumn,
  { id: 'availability', label: 'Availability (%)', format: 'percentage' } as TableColumn,
  { id: 'capacityFactor', label: 'Capacity Factor (%)', format: 'percentage' } as TableColumn,
  { id: 'degradation', label: 'Degradation (%)', format: 'percentage' } as TableColumn,
  // Pricing related columns  
  { id: 'revenue', label: 'Revenue', format: 'currency' } as TableColumn,
  { id: 'contractedRevenue', label: 'Contracted Revenue', format: 'currency' } as TableColumn,
  { id: 'merchantRevenue', label: 'Merchant Revenue', format: 'currency' } as TableColumn,
  { id: 'capacityMarketRevenue', label: 'Capacity Market Revenue', format: 'currency' } as TableColumn,
  { id: 'contractedPrice', label: 'Contracted Price', format: 'currency' } as TableColumn,
  { id: 'merchantPrice', label: 'Merchant Price', format: 'currency' } as TableColumn,
  // Cost related columns
  { id: 'totalCosts', label: 'Total Costs', format: 'currency' } as TableColumn,
  { id: 'operationalCosts', label: 'Operational Costs', format: 'currency' } as TableColumn,
  { id: 'maintenanceCosts', label: 'Maintenance Costs', format: 'currency' } as TableColumn,
  { id: 'landLeaseCosts', label: 'Land Lease Costs', format: 'currency' } as TableColumn,
  { id: 'insuranceCosts', label: 'Insurance Costs', format: 'currency' } as TableColumn,
  { id: 'administrativeCosts', label: 'Administrative Costs', format: 'currency' } as TableColumn,
  { id: 'otherCosts', label: 'Other Costs', format: 'currency' } as TableColumn,
  // Financial metrics
  { id: 'ebitda', label: 'EBITDA', format: 'currency' } as TableColumn,
  { id: 'depreciation', label: 'Depreciation', format: 'currency' } as TableColumn,
  { id: 'taxes', label: 'Taxes', format: 'currency' } as TableColumn,
  { id: 'fcf', label: 'Free Cash Flow', format: 'currency' } as TableColumn,
  { id: 'dcf', label: 'Discounted Cash Flow', format: 'currency' } as TableColumn
];

// Define the initial columns to include all available columns
const initialColumns = [...availableColumns];

export default function ResultsPanel({ results, isLoading }: ResultsPanelProps) {
  const [tabValue, setTabValue] = useState(0);
  const [metricSelectorOpen, setMetricSelectorOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Define available metrics (only used if results exist)
  const availableMetrics: MetricCard[] = results
    ? [
        {
          id: 'enterpriseValue',
          title: 'Enterprise Value',
          value: results.enterpriseValue,
          format: 'currency',
          description: 'The total value of the business',
        },
        {
          id: 'equityValue',
          title: 'Equity Value',
          value: results.equityValue,
          format: 'currency',
          description: 'The value available to equity investors',
        },
        {
          id: 'npv',
          title: 'Net Present Value',
          value: results.npv,
          format: 'currency',
          description: 'NPV of all project cash flows',
        },
        {
          id: 'irr',
          title: 'IRR',
          value: results.irr,
          format: 'percentage',
          description: 'Internal Rate of Return',
        },
        {
          id: 'paybackPeriod',
          title: 'Payback Period',
          value: results.paybackPeriod,
          format: 'years',
          description: 'Years to recoup initial investment',
        },
        {
          id: 'dscrMin',
          title: 'DSCR (Min)',
          value: results.dscr.min,
          format: 'decimal',
          description: 'Minimum Debt Service Coverage Ratio',
        },
        {
          id: 'dscrAvg',
          title: 'DSCR (Avg)',
          value: results.dscr.average,
          format: 'decimal',
          description: 'Average Debt Service Coverage Ratio',
        },
        {
          id: 'averageRevenue',
          title: 'Avg. Annual Revenue',
          value: results.yearlyResults.reduce((sum, year) => sum + (year.revenue || 0), 0) / results.yearlyResults.length,
          format: 'currency',
          description: 'Average annual project revenue',
        },
        {
          id: 'averageEBITDA',
          title: 'Avg. Annual EBITDA',
          value: results.yearlyResults.reduce((sum, year) => sum + (year.ebitda || 0), 0) / results.yearlyResults.length,
          format: 'currency',
          description: 'Average annual EBITDA',
        },
        {
          id: 'averageFCF',
          title: 'Avg. Annual FCF',
          value: results.yearlyResults.reduce((sum, year) => sum + year.fcf, 0) / results.yearlyResults.length,
          format: 'currency',
          description: 'Average annual free cash flow',
        },
      ]
    : [];

  // Define displayed metrics with drag-and-drop capability
  const [displayedMetrics, setDisplayedMetrics] = useState<string[]>([
    'enterpriseValue',
    'equityValue',
    'irr',
    'paybackPeriod',
    'averageRevenue',
    'averageEBITDA',
  ]);

  // Use the typed initial columns
  const [tableColumns, setTableColumns] = useState<TableColumn[]>(initialColumns);

  // Add state for column selector
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatYears = (value: number) =>
    // If payback period is equal to the forecast length, it means the project never pays back
    value >= (results?.yearlyResults?.length || 0) ? 'Never' : `${formatDecimal(value)} years`;

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'decimal' | 'years') => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'years':
        return formatYears(value);
      default:
        return formatDecimal(value);
    }
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('dcf-results.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleExportExcel = () => {
    if (!results) return;
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add summary metrics
    csvContent += 'Summary Metrics\r\n';
    csvContent += `Enterprise Value,${results.enterpriseValue}\r\n`;
    csvContent += `Equity Value,${results.equityValue}\r\n`;
    csvContent += `NPV,${results.npv}\r\n`;
    csvContent += `IRR,${results.irr}\r\n`;
    csvContent += `Payback Period,${results.paybackPeriod}\r\n`;
    csvContent += `DSCR Min,${results.dscr.min}\r\n`;
    csvContent += `DSCR Average,${results.dscr.average}\r\n\r\n`;
    
    // Add yearly results header
    csvContent += 'Year,Revenue,EBITDA,Free Cash Flow,Discounted Cash Flow,Cumulative DCF\r\n';
    
    // Add yearly results data
    results.yearlyResults.forEach((row) => {
      const cumulativeDcf = results.yearlyResults
        .filter((r) => r.year <= row.year)
        .reduce((sum, r) => sum + r.dcf, 0);
      
      csvContent += `${row.year},${row.revenue || 0},${row.ebitda || 0},${row.fcf},${row.dcf},${cumulativeDcf}\r\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dcf-results.csv');
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(displayedMetrics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setDisplayedMetrics(items);
  };

  const handleAddMetric = (metricId: string) => {
    if (!displayedMetrics.includes(metricId)) {
      setDisplayedMetrics([...displayedMetrics, metricId]);
    }
    setMetricSelectorOpen(false);
  };

  const handleRemoveMetric = (metricId: string) => {
    setDisplayedMetrics(displayedMetrics.filter(id => id !== metricId));
  };

  // Add handler for column reordering
  const handleColumnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(tableColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTableColumns(items);
  };

  // Add handler to add columns
  const handleAddColumn = (columnId: string) => {
    const column = availableColumns.find(c => c.id === columnId);
    if (column && !tableColumns.some(c => c.id === columnId)) {
      setTableColumns([...tableColumns, column]);
    }
    setColumnSelectorOpen(false);
  };

  // Add handler to remove columns
  const handleRemoveColumn = (columnId: string) => {
    // Don't allow removing the Year column
    if (columnId === 'year') return;
    
    setTableColumns(tableColumns.filter(c => c.id !== columnId));
  };

  // Add a format function for numbers with controlled decimal places
  const formatNumber = (value: number, decimals: number = 0) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  if (!results) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          No results available
        </Typography>
        <Typography>
          Please fill in the required inputs and click Calculate to see the results.
        </Typography>
      </Box>
    );
  }

  // Update the cashFlowData calculation to use actual values
  const cashFlowData = results.yearlyResults.map((row, index, array) => {
    // Extract the valuation date from results (if available)
    const valuationDateStr = results.valuationDate || new Date().toISOString().split('T')[0];
    const valuationDate = new Date(valuationDateStr);
    const valuationYear = valuationDate.getFullYear();
    
    // Extract the COD date from results (if available), or default to start date
    const codDateStr = results.codDate || valuationDateStr;
    const codDate = new Date(codDateStr);
    const codYear = codDate.getFullYear();
    
    // Determine if this cash flow is before the valuation date
    const isBeforeValuationDate = row.year < valuationYear;
    
    // Determine if this is the COD year
    const isCodYear = row.year === codYear;
    
    // Determine if this cash flow is before the COD
    const isBeforeCod = row.year < codYear;
    
    // Set discounted cash flow to 0 for years before valuation date
    const adjustedDCF = isBeforeValuationDate ? 0 : row.dcf;
    
    // Handle initial CAPEX
    const initialCapex = results.initialCapex || 0;
    const capexForYear = isCodYear ? initialCapex : 0;
    
    // Return all values from the API response plus our calculated flags
    return {
      ...row,
      isBeforeValuationDate,
      isBeforeCod,
      isCodYear,
      dcf: adjustedDCF,
      initialCapex: capexForYear,
      capex: capexForYear,
    };
  });

  // Add cumulative DCF values to each row, respecting the valuation date
  let runningTotal = 0;
  cashFlowData.forEach(row => {
    runningTotal += row.dcf;
    (row as any).cumulativeDcf = runningTotal;
  });

  // Recalculate enterprise value and equity value based on adjusted DCF values
  // that respect the valuation date cutoff
  const recalculatedEnterpriseValue = cashFlowData.reduce((sum, row) => sum + row.dcf, 0);
  const recalculatedEquityValue = recalculatedEnterpriseValue - (results.enterpriseValue - results.equityValue);

  // Update metrics with recalculated values
  const updatedMetrics = availableMetrics.map(metric => {
    if (metric.id === 'enterpriseValue') {
      return { ...metric, value: recalculatedEnterpriseValue };
    }
    if (metric.id === 'equityValue') {
      return { ...metric, value: recalculatedEquityValue };
    }
    return metric;
  });

  // Update color definitions
  const CHART_COLORS = PALETTE.chart;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }} ref={resultsRef}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">DCF Results</Typography>
        <ButtonGroup variant="outlined" size="small">
          <Button
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
          <Button
            startIcon={<ExcelIcon />}
            onClick={handleExportExcel}
          >
            Export CSV
          </Button>
        </ButtonGroup>
      </Box>

      {/* Summary Metrics with Drag & Drop */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Summary Metrics</Typography>
          <Button 
            startIcon={<AddIcon />} 
            size="small" 
            variant="outlined" 
            onClick={() => setMetricSelectorOpen(!metricSelectorOpen)}
          >
            Add Metric
          </Button>
        </Box>
        
        {metricSelectorOpen && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Select metrics to display:</Typography>
            <Grid container spacing={1}>
              {updatedMetrics
                .filter(metric => !displayedMetrics.includes(metric.id))
                .map(metric => (
                  <Grid item key={metric.id}>
                    <Chip 
                      label={metric.title} 
                      onClick={() => handleAddMetric(metric.id)} 
                      clickable 
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                ))}
            </Grid>
          </Paper>
        )}
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="metrics" direction="horizontal">
            {(provided: DroppableProvided) => (
              <Grid
                container
                spacing={3}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {displayedMetrics.map((metricId, index) => {
                  const metric = updatedMetrics.find(m => m.id === metricId);
                  if (!metric) return null;
                  
                  return (
                    <Draggable key={metric.id} draggableId={metric.id} index={index}>
                      {(provided: DraggableProvided) => (
                        <Grid
                          item
                          xs={12}
                          md={4}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <Paper sx={{ p: 2, position: 'relative' }}>
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8, 
                                display: 'flex',
                                gap: 1
                              }}
                            >
                              <Box {...provided.dragHandleProps}>
                                <DragIcon fontSize="small" color="action" />
                              </Box>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveMetric(metric.id)}
                                sx={{ ml: 1 }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography variant="subtitle2" gutterBottom>
                              {metric.title}
                            </Typography>
                            <Typography variant="h4">
                              {formatValue(metric.value as number, metric.format)}
                            </Typography>
                            {metric.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {metric.description}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* Tabs for different visualizations */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Cash Flow Analysis" />
          <Tab label="Financial Metrics" />
          <Tab label="Detailed Table" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Cash Flow Projection
        </Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart
              data={cashFlowData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke={CHART_COLORS[0]}
                fill={CHART_COLORS[0]}
                name="Revenue"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="ebitda"
                stackId="2"
                stroke={CHART_COLORS[1]}
                fill={CHART_COLORS[1]}
                name="EBITDA"
                fillOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="fcf"
                stackId="3"
                stroke={CHART_COLORS[2]}
                fill={CHART_COLORS[2]}
                name="Free Cash Flow"
                fillOpacity={0.7}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Key Financial Metrics Over Time
        </Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <ResponsiveContainer>
            <LineChart
              data={cashFlowData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS[0]} />
              <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS[1]} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue' || name === 'EBITDA' || name === 'FCF' || name === 'Cumulative DCF') {
                    return formatCurrency(Number(value));
                  }
                  return value;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CHART_COLORS[0]}
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ebitda"
                name="EBITDA"
                stroke={CHART_COLORS[1]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fcf"
                name="FCF"
                stroke={CHART_COLORS[2]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeDcf"
                name="Cumulative DCF"
                stroke={CHART_COLORS[3]}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Yearly Results</Typography>
          <Button 
            startIcon={<AddIcon />} 
            size="small" 
            variant="outlined" 
            onClick={() => setColumnSelectorOpen(!columnSelectorOpen)}
          >
            Add Column
          </Button>
        </Box>
        
        {columnSelectorOpen && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Select columns to display:</Typography>
            <Grid container spacing={1}>
              {availableColumns
                .filter(col => !tableColumns.some(tc => tc.id === col.id))
                .map(column => (
                  <Grid item key={column.id}>
                    <Chip 
                      label={column.label} 
                      onClick={() => handleAddColumn(column.id)} 
                      clickable 
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                ))}
            </Grid>
          </Paper>
        )}
        
        <DragDropContext onDragEnd={handleColumnDragEnd}>
          <TableContainer component={Paper}>
            <Table>
              <Droppable droppableId="columns" direction="horizontal">
                {(provided) => (
                  <TableHead {...provided.droppableProps} ref={provided.innerRef}>
                    <TableRow>
                      {tableColumns.map((column, index) => (
                        <Draggable key={column.id} draggableId={column.id} index={index}>
                          {(provided) => (
                            <TableCell 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              align={column.id === 'year' ? 'left' : 'right'}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: column.id === 'year' ? 'flex-start' : 'flex-end' }}>
                                <Box {...provided.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                  <DragIcon fontSize="small" color="action" />
                                </Box>
                                {column.label}
                                {column.id !== 'year' && (
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleRemoveColumn(column.id)}
                                    sx={{ ml: 1 }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableRow>
                  </TableHead>
                )}
              </Droppable>
              <TableBody>
                {cashFlowData.map((row, index) => (
                  <TableRow key={row.year}>
                    {tableColumns.map(column => {
                      // Update the table cell rendering with proper TypeScript types
                      return (
                        <TableCell 
                          key={column.id} 
                          align={column.id === 'year' ? 'left' : 'right'}
                          sx={{
                            color: row.isBeforeValuationDate 
                              ? 'text.disabled' 
                              : row.isCodYear 
                                ? 'primary.main'
                                : 'inherit',
                            fontStyle: row.isBeforeValuationDate 
                              ? 'italic' 
                              : row.isCodYear 
                                ? 'normal' 
                                : 'normal',
                            fontWeight: row.isCodYear ? 'bold' : 'normal',
                            bgcolor: row.isCodYear ? 'rgba(0, 0, 255, 0.05)' : 'inherit',
                          }}
                        >
                          {column.id === 'year' && row.isCodYear ? `${row.year} (COD)` : 
                            column.format === 'currency' 
                              ? formatCurrency(Number(row[column.id as keyof typeof row] || 0)) 
                              : column.format === 'percentage' 
                                ? formatPercentage(Number(row[column.id as keyof typeof row] || 0)) 
                                : column.format === 'decimal' 
                                  ? formatDecimal(Number(row[column.id as keyof typeof row] || 0))
                                  : column.format === 'number'
                                    ? formatNumber(Number(row[column.id as keyof typeof row] || 0))
                                    : row[column.id as keyof typeof row] || 0}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DragDropContext>
      </TabPanel>
    </Box>
  );
} 