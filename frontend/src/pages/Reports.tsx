import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Download as DownloadIcon, 
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Description as TemplateIcon,
  RemoveRedEye as ViewIcon,
} from '@mui/icons-material';
import ReportTemplate from '../components/Reports/ReportTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Mock data for reports
const mockReports = [
  {
    id: 1,
    title: 'Solar Farm Alpha Valuation',
    description: 'DCF valuation report for Solar Farm Alpha',
    source_type: 'dcf',
    source_id: 1,
    created_at: '2023-03-15T10:30:00Z',
    file_format: 'pdf',
  },
  {
    id: 2,
    title: 'Wind Park Beta Valuation',
    description: 'DCF valuation report for Wind Park Beta',
    source_type: 'dcf',
    source_id: 2,
    created_at: '2023-03-14T14:45:00Z',
    file_format: 'pdf',
  },
  {
    id: 3,
    title: 'Q1 2023 Portfolio Valuation',
    description: 'Portfolio-level valuation report for Q1 2023',
    source_type: 'portfolio',
    source_id: 1,
    created_at: '2023-03-10T09:15:00Z',
    file_format: 'pdf',
  },
];

// Sample report data
const sampleReportData = {
  assetName: 'Solar Farm Alpha',
  assetType: 'Solar',
  assetLocation: 'Arizona, USA',
  assetStatus: 'Operational',
  enterpriseValue: 25000000,
  equityValue: 15000000,
  npv: 8750000,
  irr: 0.142, // 14.2%
  paybackPeriod: 7.5,
  dscr: {
    min: 1.35,
    average: 1.85,
  },
  yearlyResults: [
    { year: 2023, revenue: 2800000, ebitda: 2240000, fcf: 1680000, dcf: 1470000 },
    { year: 2024, revenue: 2856000, ebitda: 2284800, fcf: 1713600, dcf: 1315845 },
    { year: 2025, revenue: 2913120, ebitda: 2330496, fcf: 1747872, dcf: 1176921 },
    { year: 2026, revenue: 2971382, ebitda: 2377106, fcf: 1782829, dcf: 1051678 },
    { year: 2027, revenue: 3030810, ebitda: 2424648, fcf: 1818486, dcf: 939127 },
    { year: 2028, revenue: 3091426, ebitda: 2473141, fcf: 1854856, dcf: 838386 },
    { year: 2029, revenue: 3153255, ebitda: 2522603, fcf: 1891953, dcf: 748649 },
    { year: 2030, revenue: 3216320, ebitda: 2573056, fcf: 1929792, dcf: 668187 },
    { year: 2031, revenue: 3280646, ebitda: 2624517, fcf: 1968388, dcf: 596341 },
    { year: 2032, revenue: 3346259, ebitda: 2677007, fcf: 2007755, dcf: 532511 },
  ],
  isSample: true, // Mark this as sample data
};

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [sourceType, setSourceType] = useState('dcf');
  const [sourceId, setSourceId] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const reportRef = React.useRef<HTMLDivElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleViewReport = () => {
    console.log('Opening report preview dialog');
    setViewReportOpen(false);
    setTimeout(() => {
      setViewReportOpen(true);
    }, 100);
  };

  const handleCloseViewReport = () => {
    setViewReportOpen(false);
  };

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    
    // Simulating report generation
    setTimeout(() => {
      setGeneratingReport(false);
      handleClose();
      handleViewReport();
    }, 1500);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) {
      console.error('Report ref is null');
      return;
    }
    
    console.log('Starting PDF export...');
    
    try {
      // Give the DOM a moment to fully render
      setTimeout(async () => {
        try {
          // Show some visual feedback
          setGeneratingReport(true);
          
          // Null check to satisfy TypeScript
          if (!reportRef.current) {
            console.error('Report ref is no longer available');
            setGeneratingReport(false);
            return;
          }
          
          const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });
          
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 295; // A4 height in mm
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
          
          const filename = `${reportTitle || 'renewable-asset-report'}-${new Date().toISOString().split('T')[0]}.pdf`;
          pdf.save(filename);
          console.log('PDF exported successfully as:', filename);
          
          // Hide the loading indicator
          setGeneratingReport(false);
        } catch (error) {
          console.error('Error in html2canvas or PDF generation:', error);
          setGeneratingReport(false);
          alert('Failed to generate PDF. See console for details.');
        }
      }, 500);
    } catch (error) {
      console.error('Error initiating PDF export:', error);
      alert('Failed to start PDF export process.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="Report List" />
          <Tab label="Templates" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Reports</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
            Generate New Report
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="reports table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Source Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Format</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockReports.map((report) => (
                <TableRow key={report.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {report.title}
                  </TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>
                    {report.source_type === 'dcf' ? 'DCF Analysis' : 'Portfolio Analysis'}
                  </TableCell>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>{report.file_format.toUpperCase()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Report">
                      <IconButton
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View icon clicked for report:', report.id);
                          handleViewReport();
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Report">
                      <IconButton
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          // Download functionality would go here
                          alert(`Download report ${report.id}`);
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Report">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => {
                          // Delete functionality would go here
                          alert(`Delete report ${report.id}`);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {mockReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No reports found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Report Templates
          </Typography>
          <Typography variant="body1" paragraph>
            Choose from a variety of professional report templates to present your renewable asset analysis.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedTemplate === 'default' ? '2px solid #1976d2' : 'none',
              }}
              onClick={() => setSelectedTemplate('default')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TemplateIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Default One-Pager</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                A professional single-page report with key metrics, charts, and asset information.
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => {
                  setSelectedTemplate('default');
                  handleViewReport();
                }}
              >
                Preview
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.7,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TemplateIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Detailed Analysis (Coming Soon)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                A multi-page detailed report with comprehensive analysis and recommendations.
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" size="small" disabled>
                Coming Soon
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0.7,
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TemplateIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Executive Summary (Coming Soon)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                A concise executive summary highlighting key findings and actionable insights.
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" size="small" disabled>
                Coming Soon
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Generate Report Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                label="Report Title"
                fullWidth
                variant="outlined"
                margin="normal"
                placeholder="Enter a title for the report"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
                placeholder="Enter a description for the report"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Source Type</InputLabel>
                <Select 
                  label="Source Type" 
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <MenuItem value="dcf">DCF Analysis</MenuItem>
                  <MenuItem value="portfolio">Portfolio Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Source</InputLabel>
                <Select 
                  label="Source" 
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  <MenuItem value="">Select a source</MenuItem>
                  <MenuItem value="1">Solar Farm Alpha</MenuItem>
                  <MenuItem value="2">Wind Park Beta</MenuItem>
                  <MenuItem value="3">Hydro Plant Gamma</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Template</InputLabel>
                <Select 
                  label="Template" 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <MenuItem value="default">Default One-Pager</MenuItem>
                  <MenuItem value="detailed" disabled>Detailed Analysis (Coming Soon)</MenuItem>
                  <MenuItem value="executive" disabled>Executive Summary (Coming Soon)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>File Format</InputLabel>
                <Select label="File Format" defaultValue="pdf">
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx" disabled>Word (DOCX) - Coming Soon</MenuItem>
                  <MenuItem value="xlsx" disabled>Excel (XLSX) - Coming Soon</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            startIcon={generatingReport ? <CircularProgress size={20} /> : <PdfIcon />}
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog 
        open={viewReportOpen} 
        onClose={handleCloseViewReport} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            maxHeight: '90vh',
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Report Preview</Typography>
            <Button
              variant="contained"
              startIcon={generatingReport ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
              onClick={handleExportPDF}
              disabled={generatingReport}
            >
              {generatingReport ? 'Exporting...' : 'Export PDF'}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box ref={reportRef} sx={{ pt: 1 }}>
            <ReportTemplate 
              data={sampleReportData} 
              reportDate={new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              title={reportTitle || "Renewable Asset Valuation Report"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewReport}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports; 