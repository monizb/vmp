import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Link,
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
  FormHelperText,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { vulnsApi, appsApi, reportsApi, usersApi, settingsApi, viewsApi } from '../../api/endpoints';
import { SeverityChip } from '../../components/ui/SeverityChip';
import { StatusChip } from '../../components/ui/StatusChip';
import { InternalStatusChip } from '../../components/ui/InternalStatusChip';
import { VulnsFilters } from './VulnsFilters';
import { format } from 'date-fns';
import { InternalStatusOptions } from '../../types/models';

export function VulnsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSaveViewDialog, setOpenSaveViewDialog] = useState(false);
  const [saveViewData, setSaveViewData] = useState({ name: '', entityType: 'vulns' });
  const [newVuln, setNewVuln] = useState({ title: '', description: '', severity: 'Medium', applicationId: '', reportId: '', assignedToUserId: '', dueDate: '', status: 'New', internalStatus: '' });

  const { data: vulnsData, isLoading, error } = useQuery({
    queryKey: ['vulns', { page: page + 1, pageSize, ...filters }],
    queryFn: () => vulnsApi.getAll({ page: page + 1, pageSize, ...filters }),
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll({ pageSize: 1000 }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: dueDateSettings } = useQuery({
    queryKey: ['settings', 'due-dates'],
    queryFn: () => settingsApi.getDueDateSettings(),
  });

  const handleOpenSaveView = () => {
    setSaveViewData({ name: '', entityType: 'vulns' });
    setOpenSaveViewDialog(true);
  };

  const handleSaveCurrentView = async () => {
    if (!saveViewData.name) return;
    await viewsApi.create({ name: saveViewData.name, entityType: 'vulns', filters: filters });
    setOpenSaveViewDialog(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initial = {};
    ['applicationId', 'status', 'severity', 'assignedTo', 'search', 'internalStatus'].forEach((k) => {
      const v = params.get(k);
      if (v) initial[k] = v;
    });
    if (Object.keys(initial).length > 0) {
      setFilters(initial);
    }
  }, [location.search]);

  const handleRowClick = (vulnId) => {
    navigate(`/vulns/${vulnId}`);
  };

  const getAppName = (appId) => {
    const app = apps?.find(a => a.id === appId);
    return app?.name || appId;
  };

  const getReportInfo = (reportId) => {
    if (!reportId) return null;
    const report = reports?.items?.find(r => r.id === reportId);
    return report;
  };

  const handleCreateVuln = async () => {
    if (!newVuln.title || !newVuln.description || !newVuln.severity || !newVuln.applicationId) return;
    await vulnsApi.create({ ...newVuln, dueDate: newVuln.dueDate || undefined, internalStatus: newVuln.internalStatus || undefined });
    setOpenAddDialog(false);
    setNewVuln({ title: '', description: '', severity: 'Medium', applicationId: '', reportId: '', assignedToUserId: '', dueDate: '', status: 'New', internalStatus: '' });
    queryClient.invalidateQueries(['vulns']);
  };

  const calculateAutoDueDate = (severity) => {
    if (!dueDateSettings?.autoAssignDueDates || !dueDateSettings?.dueDateTimelines?.[severity]) {
      return null;
    }
    const days = dueDateSettings.dueDateTimelines[severity];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  };

  const getAutoAssignedDueDate = () => {
    if (newVuln.dueDate) return null; // Manual date is set
    return calculateAutoDueDate(newVuln.severity);
  };

  const handleSeverityChange = (severity) => {
    setNewVuln({ 
      ...newVuln, 
      severity,
      // Clear manual due date when severity changes to show auto-assigned date
      dueDate: ''
    });
  };





  if (isLoading) {
    return (
      <Box>
        <VulnsFilters onFiltersChange={handleFiltersChange} />
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Report</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Internal</TableCell>
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
        Error loading vulnerabilities: {error.message}
      </Alert>
    );
  }

  const vulnerabilities = vulnsData?.items || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Vulnerabilities</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={handleOpenSaveView} disabled={Object.keys(filters || {}).length === 0}>Save Current View</Button>
            <Button variant="outlined" onClick={() => navigate('/views')}>Views</Button>
            <Button variant="contained" onClick={() => setOpenAddDialog(true)}>Add Vulnerability</Button>
          </Box>
        </Box>
        <VulnsFilters onFiltersChange={handleFiltersChange} value={filters} />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small" sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
          <TableHead>
            <TableRow sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
              <TableCell>Title</TableCell>
              <TableCell>Application</TableCell>
              <TableCell>Report</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Internal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vulnerabilities.map((vuln) => {
              const report = getReportInfo(vuln.reportId);
              return (
                <TableRow 
                  key={vuln.id} 
                  hover 
                  onClick={() => handleRowClick(vuln.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {vuln.title}
                      </Typography>
                      {vuln.cve && vuln.cve.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {vuln.cve.slice(0, 2).map((cve, index) => (
                            <Chip
                              key={index}
                              label={cve}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {vuln.cve.length > 2 && (
                            <Chip
                              label={`+${vuln.cve.length - 2} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getAppName(vuln.applicationId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {report ? (
                      <Box>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reports/${report.id}`);
                          }}
                          sx={{ textDecoration: 'none' }}
                        >
                          {report.fileName}
                        </Link>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {report.vendorName} • {format(new Date(report.reportDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Manual Entry
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <SeverityChip severity={vuln.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={vuln.status}
                      onChange={async (newStatus) => {
                        await vulnsApi.update(vuln.id, { status: newStatus });
                        queryClient.invalidateQueries(['vulns']);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {users?.find(u => u.id === vuln.assignedToUserId)?.name || users?.find(u => u.id === vuln.assignedToUserId)?.email || 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {vuln.dueDate ? (
                      <Typography variant="body2">
                        {format(new Date(vuln.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No due date
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <InternalStatusChip
                      value={vuln.internalStatus || ''}
                      onChange={async (newInternal) => {
                        await vulnsApi.update(vuln.id, { internalStatus: newInternal || null });
                        queryClient.invalidateQueries(['vulns']);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={vulnsData?.total || 0}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangePageSize}
        />
      </TableContainer>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vulnerability</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField label="Title" value={newVuln.title} onChange={(e) => setNewVuln({ ...newVuln, title: e.target.value })} required fullWidth />
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={newVuln.severity} label="Severity" onChange={(e) => handleSeverityChange(e.target.value)}>
                {['Low','Medium','High','Critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Application</InputLabel>
              <Select value={newVuln.applicationId} label="Application" onChange={(e) => setNewVuln({ ...newVuln, applicationId: e.target.value })} required>
                {apps?.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Report (optional)</InputLabel>
              <Select value={newVuln.reportId} label="Report (optional)" onChange={(e) => setNewVuln({ ...newVuln, reportId: e.target.value })}>
                <MenuItem value=""><em>Manual</em></MenuItem>
                {reports?.items?.map(r => <MenuItem key={r.id} value={r.id}>{r.fileName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assigned To</InputLabel>
              <Select value={newVuln.assignedToUserId} label="Assigned To" onChange={(e) => setNewVuln({ ...newVuln, assignedToUserId: e.target.value })}>
                <MenuItem value=""><em>Unassigned</em></MenuItem>
                {users?.map(u => <MenuItem key={u.id} value={u.id}>{u.name || u.email}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField 
              type="date" 
              label="Due Date" 
              InputLabelProps={{ shrink: true }} 
              value={newVuln.dueDate} 
              onChange={(e) => setNewVuln({ ...newVuln, dueDate: e.target.value })} 
              fullWidth 
              helperText={
                !newVuln.dueDate && getAutoAssignedDueDate() ? 
                  `Auto-assigned: ${new Date(getAutoAssignedDueDate()).toLocaleDateString()} (${dueDateSettings?.dueDateTimelines?.[newVuln.severity]} days)` : 
                  newVuln.dueDate ? 'Manual override' : 'Set manually or will be auto-assigned'
              }
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={newVuln.status} label="Status" onChange={(e) => setNewVuln({ ...newVuln, status: e.target.value })}>
                {['New','Open','In Progress','Fixed','Reopened','Closed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Internal Status</InputLabel>
              <Select value={newVuln.internalStatus} label="Internal Status" onChange={(e) => setNewVuln({ ...newVuln, internalStatus: e.target.value })}>
                <MenuItem value=""><em>None</em></MenuItem>
                {InternalStatusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Description" value={newVuln.description} onChange={(e) => setNewVuln({ ...newVuln, description: e.target.value })} multiline rows={4} fullWidth sx={{ gridColumn: { md: '1 / span 2' } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateVuln} disabled={!newVuln.title || !newVuln.description || !newVuln.severity || !newVuln.applicationId}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSaveViewDialog} onClose={() => setOpenSaveViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Current View</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="View Name"
              value={saveViewData.name}
              onChange={(e) => setSaveViewData({ ...saveViewData, name: e.target.value })}
              fullWidth
              required
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>Current Filters:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(filters || {}).map(([key, value]) => (
                  value ? <Chip key={key} label={`${key}: ${value}`} size="small" variant="outlined" /> : null
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveViewDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCurrentView} disabled={!saveViewData.name}>Save View</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 