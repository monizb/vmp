import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { Clear, FilterList } from '@mui/icons-material';
import { appsApi, usersApi } from '../../api/endpoints';
import { Severity, VulnStatus } from '../../types/models';

export function VulnsFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    status: '',
    applicationId: '',
    assignedTo: '',
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      severity: '',
      status: '',
      applicationId: '',
      assignedTo: '',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Box sx={{ flexGrow: 1 }}>Filters</Box>
        <Button
          startIcon={<Clear />}
          onClick={handleClearFilters}
          size="small"
        >
          Clear All
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search vulnerabilities..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Severity</InputLabel>
            <Select
              value={filters.severity}
              label="Severity"
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(Severity).map((severity) => (
                <MenuItem key={severity} value={severity}>
                  {severity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(VulnStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Application</InputLabel>
            <Select
              value={filters.applicationId}
              label="Application"
              onChange={(e) => handleFilterChange('applicationId', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {apps?.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={filters.assignedTo}
              label="Assigned To"
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="unassigned">Unassigned</MenuItem>
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
} 