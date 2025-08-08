import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { vulnsApi, appsApi, reportsApi } from '../../api/endpoints';
import { SeverityChip } from '../../components/ui/SeverityChip';
import { StatusChip } from '../../components/ui/StatusChip';
import { VulnsFilters } from './VulnsFilters';
import { format } from 'date-fns';

export function VulnsTable() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});

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
                      {vuln.assignedToUserId || 'Unassigned'}
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
    </Box>
  );
} 