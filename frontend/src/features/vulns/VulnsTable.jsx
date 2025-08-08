import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { vulnsApi, appsApi, reportsApi, usersApi, viewsApi } from '../../api/endpoints';
import { SeverityChip } from '../../components/ui/SeverityChip';
import { StatusChip } from '../../components/ui/StatusChip';
import { VulnsFilters } from './VulnsFilters';
import { format } from 'date-fns';

export function VulnsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newVuln, setNewVuln] = useState({ title: '', description: '', severity: 'Medium', applicationId: '', reportId: '', assignedToUserId: '', dueDate: '' });
  const [viewName, setViewName] = useState('');

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

  const { data: savedViews, refetch: refetchViews } = useQuery({
    queryKey: ['views', 'vulns'],
    queryFn: () => viewsApi.getAll({ entityType: 'vulns' }),
  });

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
    await vulnsApi.create({ ...newVuln, dueDate: newVuln.dueDate || undefined });
    setOpenAddDialog(false);
    setNewVuln({ title: '', description: '', severity: 'Medium', applicationId: '', reportId: '', assignedToUserId: '', dueDate: '' });
  };

  const handleSaveView = async () => {
    if (!viewName) return;
    await viewsApi.create({ name: viewName, entityType: 'vulns', filters });
    setViewName('');
    await refetchViews();
  };

  if (isLoading) {
    return (
      <Box>
        <VulnsFilters onFiltersChange={handleFiltersChange} />
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Report</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Due Date</TableCell>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <VulnsFilters onFiltersChange={handleFiltersChange} />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <select onChange={(e) => {
            const view = savedViews?.find(v => v.id === e.target.value);
            if (view) handleFiltersChange(view.filters || {});
          }} value="">
            <option value="">Saved Views</option>
            {savedViews?.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <input placeholder="View name" value={viewName} onChange={(e) => setViewName(e.target.value)} />
          <button onClick={handleSaveView} disabled={!viewName}>Save View</button>
          <button onClick={() => setOpenAddDialog(true)}>Add Vulnerability</button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Application</TableCell>
              <TableCell>Report</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
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
                    <StatusChip status={vuln.status} />
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

      {openAddDialog && (
        <div style={{ padding: 16, background: '#fff', border: '1px solid #ccc', marginTop: 12 }}>
          <Typography variant="h6">Add Vulnerability</Typography>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <input placeholder="Title" value={newVuln.title} onChange={(e) => setNewVuln({ ...newVuln, title: e.target.value })} />
            <select value={newVuln.severity} onChange={(e) => setNewVuln({ ...newVuln, severity: e.target.value })}>
              {['Low','Medium','High','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={newVuln.applicationId} onChange={(e) => setNewVuln({ ...newVuln, applicationId: e.target.value })}>
              <option value="">Select Application</option>
              {apps?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={newVuln.reportId} onChange={(e) => setNewVuln({ ...newVuln, reportId: e.target.value })}>
              <option value="">No Report (Manual)</option>
              {reports?.items?.map(r => <option key={r.id} value={r.id}>{r.fileName}</option>)}
            </select>
            <select value={newVuln.assignedToUserId} onChange={(e) => setNewVuln({ ...newVuln, assignedToUserId: e.target.value })}>
              <option value="">Unassigned</option>
              {users?.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
            <input type="date" value={newVuln.dueDate} onChange={(e) => setNewVuln({ ...newVuln, dueDate: e.target.value })} />
            <textarea placeholder="Description" style={{ gridColumn: '1 / span 2' }} value={newVuln.description} onChange={(e) => setNewVuln({ ...newVuln, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleCreateVuln}>Create</button>
            <button onClick={() => setOpenAddDialog(false)}>Cancel</button>
          </div>
        </div>
      )}
    </Box>
  );
} 