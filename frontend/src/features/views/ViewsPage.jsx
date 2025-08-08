import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
} from '@mui/material';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { viewsApi } from '../../api/endpoints';
import { format } from 'date-fns';

export function ViewsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [editingView, setEditingView] = useState(null);
  const [editData, setEditData] = useState({ name: '', entityType: '' });
  const [saveData, setSaveData] = useState({ name: '', entityType: 'vulns', filters: {} });

  const { data: views, isLoading, error } = useQuery({
    queryKey: ['views'],
    queryFn: () => viewsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => viewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['views']);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => viewsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['views']);
      setOpenEditDialog(false);
      setEditingView(null);
      setEditData({ name: '', entityType: '' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => viewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['views']);
      setOpenSaveDialog(false);
      setSaveData({ name: '', entityType: 'vulns', filters: {} });
    },
  });

  const handleEdit = (view) => {
    setEditingView(view);
    setEditData({ name: view.name, entityType: view.entityType });
    setOpenEditDialog(true);
  };

  const handleUpdate = () => {
    if (!editData.name || !editData.entityType) return;
    updateMutation.mutate({ id: editingView.id, data: editData });
  };

  const handleSaveView = () => {
    if (!saveData.name || !saveData.entityType) return;
    createMutation.mutate(saveData);
  };

  // Parse filters from URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    ['applicationId', 'status', 'severity', 'assignedTo', 'search', 'internalStatus'].forEach((key) => {
      const value = params.get(key);
      if (value) filters[key] = value;
    });
    
    if (Object.keys(filters).length > 0) {
      setSaveData(prev => ({ ...prev, filters }));
    }
  }, [location.search]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this view?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleApplyView = (view) => {
    if (view.entityType === 'vulns') {
      const params = new URLSearchParams();
      Object.entries(view.filters || {}).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      navigate(`/vulns?${params.toString()}`);
    } else if (view.entityType === 'reports') {
      const params = new URLSearchParams();
      Object.entries(view.filters || {}).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      navigate(`/reports?${params.toString()}`);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Saved Views</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Filters</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading views: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Saved Views</Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenSaveDialog(true)}
          disabled={Object.keys(saveData.filters).length === 0}
        >
          Save Current View
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Filters</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {views?.map((view) => (
              <TableRow key={view.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {view.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={view.entityType === 'vulns' ? 'Vulnerabilities' : 'Reports'} 
                    color={view.entityType === 'vulns' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(view.filters || {}).map(([key, value]) => (
                      value && (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          size="small"
                          variant="outlined"
                        />
                      )
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(view.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleApplyView(view)}
                      title="Apply View"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(view)}
                      title="Edit View"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(view.id)}
                      title="Delete View"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit View</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="View Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editData.entityType}
                label="Type"
                onChange={(e) => setEditData({ ...editData, entityType: e.target.value })}
                required
              >
                <MenuItem value="vulns">Vulnerabilities</MenuItem>
                <MenuItem value="reports">Reports</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate}
            disabled={!editData.name || !editData.entityType}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Current View</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="View Name"
              value={saveData.name}
              onChange={(e) => setSaveData({ ...saveData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={saveData.entityType}
                label="Type"
                onChange={(e) => setSaveData({ ...saveData, entityType: e.target.value })}
                required
              >
                <MenuItem value="vulns">Vulnerabilities</MenuItem>
                <MenuItem value="reports">Reports</MenuItem>
              </Select>
            </FormControl>
            {Object.keys(saveData.filters).length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Current Filters:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(saveData.filters).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveView}
            disabled={!saveData.name || !saveData.entityType}
          >
            Save View
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 