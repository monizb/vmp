import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
} from '@mui/material';
import { ArrowBack, Edit, Save, Cancel } from '@mui/icons-material';
import { vulnsApi, appsApi, usersApi, settingsApi } from '../../api/endpoints';
import { SeverityChip } from '../../components/ui/SeverityChip';
import { StatusChip } from '../../components/ui/StatusChip';
import { TagList } from '../../components/ui/TagList';
import { Severity, VulnStatus, InternalStatusOptions } from '../../types/models';
import { format } from 'date-fns';
import { useState } from 'react';

export function VulnDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: vuln, isLoading, error } = useQuery({
    queryKey: ['vulns', id],
    queryFn: () => vulnsApi.getById(id),
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: dueDateSettings } = useQuery({
    queryKey: ['settings', 'due-dates'],
    queryFn: () => settingsApi.getDueDateSettings(),
  });

  const updateVulnMutation = useMutation({
    mutationFn: (data) => vulnsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vulns']);
      queryClient.invalidateQueries(['vulns', id]);
      setEditMode(false);
    },
  });

  const handleEdit = () => {
    setEditData({
      status: vuln.status,
      internalStatus: vuln.internalStatus || '',
      assignedToUserId: vuln.assignedToUserId || '',
      dueDate: vuln.dueDate ? vuln.dueDate.split('T')[0] : '',
      severity: vuln.severity,
    });
    setEditMode(true);
  };

  const calculateAutoDueDate = (severity) => {
    if (!dueDateSettings?.autoAssignDueDates || !dueDateSettings?.dueDateTimelines?.[severity]) {
      return null;
    }
    const days = dueDateSettings.dueDateTimelines[severity];
    const dueDate = new Date(vuln?.discoveredDate || new Date());
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  };

  const handleSeverityChange = (severity) => {
    const autoAssignedDate = calculateAutoDueDate(severity);
    setEditData({ 
      ...editData, 
      severity,
      // Only auto-assign if no manual date was set
      dueDate: editData.dueDate || autoAssignedDate || ''
    });
  };

  const handleSave = () => {
    updateVulnMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading vulnerability: {error.message}
      </Alert>
    );
  }

  if (!vuln) {
    return (
      <Alert severity="warning">
        Vulnerability not found
      </Alert>
    );
  }

  const app = apps?.find(a => a.id === vuln.applicationId);
  const assignedUser = users?.find(u => u.id === vuln.assignedToUserId);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/vulns')}
          sx={{ mr: 2 }}
        >
          Back to Vulnerabilities
        </Button>
        {!editMode && (
          <Button
            startIcon={<Edit />}
            variant="contained"
            onClick={handleEdit}
          >
            Edit
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {vuln.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <SeverityChip severity={vuln.severity} />
              <StatusChip
                status={vuln.status}
                onChange={(newStatus) => updateVulnMutation.mutate({ status: newStatus })}
              />
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {vuln.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Technical Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  CVSS Score
                </Typography>
                <Typography variant="body1">
                  {vuln.cvssScore || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  CVSS Vector
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {vuln.cvssVector || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                CVE References
              </Typography>
              <TagList tags={vuln.cve} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                CWE References
              </Typography>
              <TagList tags={vuln.cwe} />
            </Box>

            {vuln.tags && vuln.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <TagList tags={vuln.tags} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Assignment & Status
              </Typography>

              {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editData.status}
                      label="Status"
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    >
                      {Object.values(VulnStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Internal Status</InputLabel>
                    <Select
                      value={editData.internalStatus}
                      label="Internal Status"
                      onChange={(e) => setEditData({ ...editData, internalStatus: e.target.value })}
                    >
                      <MenuItem value="">None</MenuItem>
                      {InternalStatusOptions.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      value={editData.assignedToUserId}
                      label="Assigned To"
                      onChange={(e) => setEditData({ ...editData, assignedToUserId: e.target.value })}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {users?.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    helperText={
                      !editData.dueDate && calculateAutoDueDate(editData.severity) ? 
                        `Would auto-assign: ${new Date(calculateAutoDueDate(editData.severity)).toLocaleDateString()} (${dueDateSettings?.dueDateTimelines?.[editData.severity]} days from discovery)` : 
                        editData.dueDate ? 'Manual override' : 'Not set'
                    }
                  />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={updateVulnMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <StatusChip
                      status={vuln.status}
                      onChange={(newStatus) => updateVulnMutation.mutate({ status: newStatus })}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Internal Status
                    </Typography>
                    <Typography variant="body1">
                      {vuln.internalStatus || 'None'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="body1">
                      {assignedUser ? (assignedUser.name || assignedUser.email) : 'Unassigned'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1">
                      {vuln.dueDate ? format(new Date(vuln.dueDate), 'MMM dd, yyyy') : 'Not set'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Discovered
                    </Typography>
                    <Typography variant="body1">
                      {vuln.discoveredDate ? format(new Date(vuln.discoveredDate), 'MMM dd, yyyy') : 'Not specified'}
                    </Typography>
                  </Box>

                  {vuln.resolvedDate && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Resolved
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(vuln.resolvedDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Application Details
              </Typography>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Application
                </Typography>
                <Typography variant="body1">
                  {app?.name || vuln.applicationId}
                </Typography>
              </Box>
              {app && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Platform
                  </Typography>
                  <Typography variant="body1">
                    {app.platform}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 