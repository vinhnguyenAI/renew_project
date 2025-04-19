import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
} from '@mui/material';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock user settings
  const [userSettings, setUserSettings] = useState({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Mock application settings
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    notifications: true,
    dataRefreshInterval: 5,
    defaultCurrency: 'USD',
    dateFormat: 'MM/DD/YYYY',
  });

  // Mock API settings
  const [apiSettings, setApiSettings] = useState({
    apiKey: 'sk_test_abcdefghijklmnopqrstuvwxyz123456',
    baseUrl: 'https://api.example.com/v1',
    timeout: 30,
    retryAttempts: 3,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings({
      ...userSettings,
      [event.target.name]: event.target.value,
    });
  };

  const handleAppSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    setAppSettings({
      ...appSettings,
      [name]: name === 'notifications' ? checked : value,
    });
  };

  const handleApiSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSettings({
      ...apiSettings,
      [event.target.name]: event.target.value,
    });
  };

  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as keyof typeof appSettings;
    setAppSettings({
      ...appSettings,
      [name]: event.target.value,
    });
  };

  const handleSaveSettings = () => {
    // In a real application, this would save the settings to the backend
    setSnackbarMessage('Settings saved successfully!');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="User Profile" />
            <Tab label="Application" />
            <Tab label="API Configuration" />
          </Tabs>
        </Box>

        {/* User Profile Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={userSettings.email}
                onChange={handleUserSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={userSettings.firstName}
                onChange={handleUserSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={userSettings.lastName}
                onChange={handleUserSettingsChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={userSettings.currentPassword}
                onChange={handleUserSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={userSettings.newPassword}
                onChange={handleUserSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={userSettings.confirmPassword}
                onChange={handleUserSettingsChange}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Application Settings */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Display Settings
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="theme-select-label">Theme</InputLabel>
                <Select
                  labelId="theme-select-label"
                  id="theme-select"
                  name="theme"
                  value={appSettings.theme}
                  label="Theme"
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="date-format-select-label">Date Format</InputLabel>
                <Select
                  labelId="date-format-select-label"
                  id="date-format-select"
                  name="dateFormat"
                  value={appSettings.dateFormat}
                  label="Date Format"
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.notifications}
                    onChange={handleAppSettingsChange}
                    name="notifications"
                  />
                }
                label="Enable Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Data Settings
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Refresh Interval (minutes)"
                name="dataRefreshInterval"
                type="number"
                value={appSettings.dataRefreshInterval}
                onChange={handleAppSettingsChange}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="currency-select-label">Default Currency</InputLabel>
                <Select
                  labelId="currency-select-label"
                  id="currency-select"
                  name="defaultCurrency"
                  value={appSettings.defaultCurrency}
                  label="Default Currency"
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="JPY">JPY (¥)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Configuration Settings */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                API Configuration
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                These settings control how the application interacts with external APIs.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                name="apiKey"
                value={apiSettings.apiKey}
                onChange={handleApiSettingsChange}
                type="password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Base URL"
                name="baseUrl"
                value={apiSettings.baseUrl}
                onChange={handleApiSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timeout (seconds)"
                name="timeout"
                type="number"
                value={apiSettings.timeout}
                onChange={handleApiSettingsChange}
                inputProps={{ min: 5, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Retry Attempts"
                name="retryAttempts"
                type="number"
                value={apiSettings.retryAttempts}
                onChange={handleApiSettingsChange}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Settings; 