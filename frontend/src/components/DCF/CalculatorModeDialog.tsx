import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';

interface CalculatorModeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectStandard: () => void;
  onSelectAI: () => void;
}

const CalculatorModeDialog: React.FC<CalculatorModeDialogProps> = ({
  open,
  onClose,
  onSelectStandard,
  onSelectAI,
}) => {

  const handleSelectStandard = () => {
    onSelectStandard();
    onClose();
  };

  const handleSelectAI = () => {
    onSelectAI();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Choose Valuation Method
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 4 }}>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Select how you would like to value your renewable energy project
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardActionArea onClick={handleSelectStandard} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <CalculateIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom fontWeight="bold">
                    Standard DCF Calculator
                  </Typography>
                  <Divider sx={{ width: '50%', my: 2 }} />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Use the full DCF calculator with detailed inputs for production, pricing,
                    costs, debt, and model parameters.
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="primary" fontWeight="bold">
                      RECOMMENDED FOR DETAILED ANALYSIS
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                },
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  borderRadius: 5,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                }}
              >
                NEW
              </Box>
              <CardActionArea onClick={handleSelectAI} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: 'secondary.main',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <AIIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom fontWeight="bold">
                    AI Valuation Assistant
                  </Typography>
                  <Divider sx={{ width: '50%', my: 2 }} />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Describe your renewable energy project in natural language and get
                    an AI-powered valuation analysis instantly.
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="secondary" fontWeight="bold">
                      POWERED BY OPENAI O3-MINI
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorModeDialog;