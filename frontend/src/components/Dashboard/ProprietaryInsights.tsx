import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { PALETTE } from '../../theme';

const insights = [
  {
    title: 'Market Trends',
    description: 'Renewable energy asset valuations have increased by 15% in the last quarter, driven by policy changes and increased demand.',
    impact: 'High',
    recommendation: 'Consider accelerating planned acquisitions to capture value.',
    icon: <TrendingUpIcon />,
    color: PALETTE.orange,
  },
  {
    title: 'Risk Analysis',
    description: 'New regulatory frameworks in key markets suggest potential changes in subsidy structures by 2024.',
    impact: 'Medium',
    recommendation: 'Review and adjust long-term revenue projections.',
    icon: <WarningIcon />,
    color: PALETTE.gold,
  },
  {
    title: 'Opportunity Alert',
    description: 'Emerging markets showing strong growth potential in wind energy sector, particularly in Southeast Asia.',
    impact: 'High',
    recommendation: 'Evaluate expansion opportunities in identified markets.',
    icon: <LightbulbIcon />,
    color: PALETTE.orange,
  },
];

const ProprietaryInsights: React.FC = () => {
  const theme = useTheme();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return PALETTE.orange;
      case 'Medium':
        return PALETTE.gold;
      case 'Low':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        mt: 3, 
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#fff',
        overflow: 'visible',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          pb: 1.5,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Avatar 
          sx={{ 
            backgroundColor: 'rgba(208, 74, 2, 0.1)', 
            color: PALETTE.orange,
            mr: 2,
          }}
        >
          <InsightsIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            ABC Proprietary Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exclusive market analysis and recommendations
          </Typography>
        </Box>
        <Tooltip title="Exclusive market insights powered by ABC's global renewable energy expertise">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent sx={{ p: 0 }}>
        <Grid container spacing={0}>
          {insights.map((insight, index) => (
            <Grid 
              item 
              xs={12} 
              md={4} 
              key={index} 
              sx={{ 
                borderRight: { 
                  xs: 'none', 
                  md: index < insights.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none' 
                },
                borderBottom: {
                  xs: index < insights.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                  md: 'none'
                },
              }}
            >
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: `${insight.color}10`,
                      color: insight.color,
                      mr: 1.5,
                    }}
                  >
                    {insight.icon}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {insight.title}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {insight.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    size="small"
                    label={`Impact: ${insight.impact}`}
                    sx={{
                      backgroundColor: `${getImpactColor(insight.impact)}15`,
                      color: getImpactColor(insight.impact),
                      fontWeight: 500,
                      mb: 1,
                    }}
                  />
                </Box>
                
                <Typography 
                  variant="body2" 
                  fontWeight={500}
                  color="text.primary"
                >
                  Recommendation:
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {insight.recommendation}
                </Typography>
                
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ 
                    mt: 1, 
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(208, 74, 2, 0.05)',
                    }
                  }}
                >
                  Learn more
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 2, 
            backgroundColor: 'rgba(208, 74, 2, 0.03)', 
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 500 }}
          >
            View All ABC Insights
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProprietaryInsights; 