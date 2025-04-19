import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Mock data for assets
const mockAssets = [
  {
    id: 1,
    name: 'Solar Farm Alpha',
    type: 'Solar',
    capacity: 100,
    status: 'Operational',
    location: 'California, USA',
  },
  {
    id: 2,
    name: 'Wind Park Beta',
    type: 'Wind',
    capacity: 150,
    status: 'Under Construction',
    location: 'Texas, USA',
  },
  {
    id: 3,
    name: 'Hydro Plant Gamma',
    type: 'Hydro',
    capacity: 75,
    status: 'Operational',
    location: 'Oregon, USA',
  },
  {
    id: 4,
    name: 'Solar Farm Delta',
    type: 'Solar',
    capacity: 120,
    status: 'Planned',
    location: 'Arizona, USA',
  },
  {
    id: 5,
    name: 'Wind Park Epsilon',
    type: 'Wind',
    capacity: 200,
    status: 'Operational',
    location: 'Iowa, USA',
  },
];

const AssetList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Filter assets based on search term
  const filteredAssets = mockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'success';
      case 'Under Construction':
        return 'warning';
      case 'Planned':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Renewable Assets</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add New Asset
        </Button>
      </Box>

      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          label="Search Assets"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton>
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="assets table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Capacity (MW)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssets.map((asset) => (
              <TableRow
                key={asset.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                hover
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <TableCell component="th" scope="row">
                  {asset.name}
                </TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell align="right">{asset.capacity}</TableCell>
                <TableCell>
                  <Chip
                    label={asset.status}
                    color={getStatusColor(asset.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/assets/${asset.id}`);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete functionality would go here
                      alert(`Delete asset ${asset.id}`);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredAssets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No assets found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AssetList; 