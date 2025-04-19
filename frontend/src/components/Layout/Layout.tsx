import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  List as ListIcon,
  Calculate,
  Assessment as ReportsIcon,
  Folder as PortfolioIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { PALETTE } from '../../theme';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawerExpand = () => {
    if (!isMobile) {
      setIsDrawerExpanded(!isDrawerExpanded);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Assets', icon: <ListIcon />, path: '/assets' },
    { text: 'DCF Calculator', icon: <Calculate />, path: '/dcf-calculator' },
    { text: 'Portfolio', icon: <PortfolioIcon />, path: '/portfolio' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Check if a menu item is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isDrawerExpanded ? 'space-between' : 'center',
          padding: isDrawerExpanded ? '16px 16px 8px' : '16px 8px 8px',
          backgroundColor: PALETTE.orange,
          color: 'white',
          height: 64,
        }}
      >
        {isDrawerExpanded ? (
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1.2rem',
              letterSpacing: '0.0075em',
            }}
          >
            <span style={{ fontWeight: 700 }}>ABC</span> Renew
          </Typography>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>ABC</Typography>
        )}
        
        {!isMobile && (
          <IconButton 
            color="inherit" 
            onClick={toggleDrawerExpand}
            size="small"
            sx={{ ml: 1 }}
          >
            <ChevronLeftIcon sx={{ transform: isDrawerExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }} />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      <Box sx={{ overflow: 'auto', flexGrow: 1, mt: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.text} 
              disablePadding
              sx={{ 
                mb: 0.5,
                display: 'block',
              }}
            >
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: isDrawerExpanded ? 'initial' : 'center',
                  px: 2.5,
                  py: 1,
                  mx: 1,
                  borderRadius: '4px',
                  backgroundColor: isActive(item.path) ? 'rgba(208, 74, 2, 0.08)' : 'transparent',
                  color: isActive(item.path) ? PALETTE.orange : 'inherit',
                  '&:hover': {
                    backgroundColor: isActive(item.path) 
                      ? 'rgba(208, 74, 2, 0.12)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isDrawerExpanded ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActive(item.path) ? PALETTE.orange : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isDrawerExpanded && (
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { 
                        fontWeight: isActive(item.path) ? 600 : 400
                      }
                    }}
                  />
                )}
                {!isDrawerExpanded && (
                  <Tooltip title={item.text} placement="right">
                    <span></span>
                  </Tooltip>
                )}
                
                {isActive(item.path) && isDrawerExpanded && (
                  <Box 
                    sx={{ 
                      width: '4px', 
                      height: '100%', 
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      backgroundColor: PALETTE.orange,
                      borderRadius: '4px 0 0 4px',
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<HelpIcon />}
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => {/* Help functionality */}}
          sx={{
            justifyContent: isDrawerExpanded ? 'flex-start' : 'center',
            minWidth: 0,
            px: isDrawerExpanded ? 2 : 1,
          }}
        >
          {isDrawerExpanded && 'Help & Support'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(isDrawerExpanded && !isMobile && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          ...(!isDrawerExpanded && !isMobile && {
            width: `calc(100% - ${theme.spacing(7)} - 1px)`,
            marginLeft: `calc(${theme.spacing(7)} + 1px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h6" noWrap component="div">
              {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label="Dev Environment" 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(208, 74, 2, 0.1)', 
                color: PALETTE.orange,
                mr: 2,
                fontWeight: 500,
              }} 
            />
            
            <Tooltip title="Notifications">
              <IconButton color="inherit" size="large" sx={{ mr: 1 }}>
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Account">
              <IconButton color="inherit" size="large">
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    backgroundColor: PALETTE.darkGray,
                    fontSize: '0.9rem',
                  }}
                >
                  ABC
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ 
          width: { sm: isDrawerExpanded ? drawerWidth : `calc(${theme.spacing(7)} + 1px)` }, 
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isDrawerExpanded ? drawerWidth : `calc(${theme.spacing(7)} + 1px)`,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            sm: isDrawerExpanded 
              ? `calc(100% - ${drawerWidth}px)` 
              : `calc(100% - ${theme.spacing(7)} - 1px)` 
          },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          minHeight: '100vh',
          backgroundColor: '#f9f9f9',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
} 