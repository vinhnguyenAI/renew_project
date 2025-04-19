import { createTheme } from '@mui/material/styles';

// ABC Color Palette
export const PALETTE = {
  // Primary
  orange: '#d04a02', // ABC Orange
  // Secondary
  darkGray: '#2d2d2d', // ABC Charcoal
  // Supporting
  lightGray: '#f2f2f2',
  mediumGray: '#757575',
  gold: '#ffb600',
  // Additional 
  white: '#ffffff',
  black: '#000000',
  // Legacy colors (keeping for backward compatibility)
  amber: '#ffb600', // Same as gold
  red: '#e53935', // Using MUI error main color
  darkRed: '#ab000d', // Using MUI error dark color
  maroon: '#7f0000', // Darker red
  // Chart colors - tailored for data visualization
  chart: [
    '#d04a02', // ABC Orange
    '#2d2d2d', // ABC Charcoal
    '#ffb600', // Gold
    '#eb8c00', // Light Orange
    '#b54000', // Dark Orange
    '#464646', // Medium Gray
    '#757575', // Light Charcoal
    '#f2f2f2', // Light Gray
    '#ffe066', // Light Gold
    '#ffc94d', // Medium Gold
  ]
};

const theme = createTheme({
  palette: {
    primary: {
      main: PALETTE.orange,
      light: '#e67945',
      dark: '#a53a01',
      contrastText: '#ffffff',
    },
    secondary: {
      main: PALETTE.darkGray,
      light: '#575757',
      dark: '#1e1e1e',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e53935',
      light: '#ff6f60',
      dark: '#ab000d',
      contrastText: '#ffffff',
    },
    warning: {
      main: PALETTE.gold,
      light: '#ffde59',
      dark: '#c68400',
      contrastText: '#000000',
    },
    info: {
      main: '#0277bd',
      light: '#58a5f0',
      dark: '#004c8c',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d2d2d',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", "Helvetica", "Arial", sans-serif', // ABC typically uses Helvetica
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '0em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '0.00735em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.00714em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      letterSpacing: '0.00938em',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#bdbdbd',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#757575',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        containedPrimary: {
          backgroundColor: PALETTE.orange,
          '&:hover': {
            backgroundColor: '#b53e01',
          },
        },
        containedSecondary: {
          backgroundColor: PALETTE.darkGray,
          '&:hover': {
            backgroundColor: '#1e1e1e',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minWidth: 100,
          '&.Mui-selected': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: PALETTE.white,
          color: PALETTE.darkGray,
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: PALETTE.white,
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: PALETTE.lightGray,
        },
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(242, 242, 242, 0.4)',
          },
          '&:hover': {
            backgroundColor: 'rgba(242, 242, 242, 0.7) !important',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          lineHeight: 1.6,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: PALETTE.orange,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

export default theme; 