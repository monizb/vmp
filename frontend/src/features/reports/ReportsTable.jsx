import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Visibility, Download, Upload } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { reportsApi, appsApi } from '../../api/endpoints';
import { format } from 'date-fns';

export function ReportsTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    driveFileId: '',
    applicationId: '',
    vendorName: '',
  });

  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ['reports', { page: page + 1, pageSize, ...filters }],
    queryFn: () => reportsApi.getAll({ page: page + 1, pageSize, ...filters }),
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const importMutation = useMutation({
    mutationFn: (data) => reportsApi.import(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      setOpenUploadDialog(false);
      setUploadData({ driveFileId: '', applicationId: '', vendorName: '' });
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initial = {};
    const appId = params.get('applicationId');
    if (appId) initial.applicationId = appId;
    if (Object.keys(initial).length > 0) {
      setFilters(initial);
    }
  }, [location.search]);

  const handleRowClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const handleViewReport = (event, reportId) => {
    event.stopPropagation();
    navigate(`/reports/${reportId}`);
  };

  const handleDownloadReport = (event, reportId) => {
    event.stopPropagation();
    // Mock download functionality
    console.log('Downloading report:', reportId);
  };

  const handleUploadSubmit = () => {
    if (uploadData.driveFileId && uploadData.applicationId && uploadData.vendorName) {
      importMutation.mutate(uploadData);
    }
  };

  const getAppName = (appId) => {
    const app = apps?.find(a => a.id === appId);
    return app?.name || appId;
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Reports</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Import Report
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Date Uploaded</TableCell>
                <TableCell>Report Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Findings</TableCell>
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
        Error loading reports: {error.message}
      </Alert>
    );
  }

  const reports = reportsData?.items || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenUploadDialog(true)}
        >
          Import Report
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Name</TableCell>
              <TableCell>Application</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Date Uploaded</TableCell>
              <TableCell>Report Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Findings</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow
                key={report.id}
                hover
                onClick={() => handleRowClick(report.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {report.fileName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getAppName(report.applicationId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {report.vendorName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(report.dateUploaded), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {report.reportDate ? format(new Date(report.reportDate), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: report.parsed ? 'success.main' : 'warning.main',
                      }}
                    />
                    <Typography variant="body2">
                      {report.parsed ? 'Parsed' : 'Processing'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {report.vulnerabilityIds?.length || 0} findings
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Report">
                      <IconButton
                        size="small"
                        onClick={(e) => handleViewReport(e, report.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Report">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDownloadReport(e, report.id)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={reportsData?.total || 0}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangePageSize}
        />
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Report from Google Drive</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Google Drive File ID"
              value={uploadData.driveFileId}
              onChange={(e) => setUploadData({ ...uploadData, driveFileId: e.target.value })}
              placeholder="Enter the Google Drive file ID"
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Application</InputLabel>
              <Select
                value={uploadData.applicationId}
                onChange={(e) => setUploadData({ ...uploadData, applicationId: e.target.value })}
                label="Application"
              >
                {apps?.map((app) => (
                  <MenuItem key={app.id} value={app.id}>
                    {app.name} ({app.platform})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={uploadData.vendorName}
                onChange={(e) => setUploadData({ ...uploadData, vendorName: e.target.value })}
                label="Vendor"
              >
                <MenuItem value="appknox">Appknox</MenuItem>
                <MenuItem value="aujas">Aujas</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!uploadData.driveFileId || !uploadData.applicationId || !uploadData.vendorName || importMutation.isLoading}
          >
            {importMutation.isLoading ? 'Importing...' : 'Import Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 