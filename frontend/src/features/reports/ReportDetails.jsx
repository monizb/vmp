import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack, Download, BugReport } from '@mui/icons-material';
import { reportsApi, vulnsApi, appsApi } from '../../api/endpoints';
import { SeverityChip } from '../../components/ui/SeverityChip';
import { StatusChip } from '../../components/ui/StatusChip';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { format } from 'date-fns';
import { InternalStatusOptions } from '../../types/models';

export function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsApi.getById(id),
  });

  const { data: vulns } = useQuery({
    queryKey: ['vulns', { reportId: id }],
    queryFn: () => vulnsApi.getAll({ reportId: id, pageSize: 1000 }),
    enabled: !!report,
  });

  const updateVulnMutation = useMutation({
    mutationFn: ({ vulnId, data }) => vulnsApi.update(vulnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vulns']);
    },
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

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
        Error loading report: {error.message}
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="warning">
        Report not found
      </Alert>
    );
  }

  const app = apps?.find(a => a.id === report.applicationId);
  const reportVulns = vulns?.items || [];

  const severityCounts = reportVulns.reduce((acc, vuln) => {
    acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports')}
          sx={{ mr: 2 }}
        >
          Back to Reports
        </Button>
        <Button
          startIcon={<Download />}
          variant="contained"
          onClick={() => console.log('Downloading report:', report.fileName)}
        >
          Download Report
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {report.fileName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={report.parsed ? 'Parsed' : 'Pending'}
                color={report.parsed ? 'success' : 'warning'}
              />
              {app && <PlatformBadge platform={app.platform} />}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Report Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Application
                </Typography>
                <Typography variant="body1">
                  {app?.name || report.applicationId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Vendor
                </Typography>
                <Typography variant="body1">
                  {report.vendorName || 'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date Uploaded
                </Typography>
                <Typography variant="body1">
                  {format(new Date(report.dateUploaded), 'MMM dd, yyyy HH:mm')}
                </Typography>
              </Box>
              {report.reportDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Report Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(report.reportDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Vulnerability Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Findings
                </Typography>
                <Typography variant="h4" color="primary">
                  {reportVulns.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Severity Breakdown
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(severityCounts).map(([severity, count]) => (
                    <Chip
                      key={severity}
                      label={`${severity}: ${count}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BugReport sx={{ mr: 1 }} />
          <Typography variant="h5">
            Vulnerabilities ({reportVulns.length})
          </Typography>
        </Box>

        {reportVulns.length === 0 ? (
          <Alert severity="info">
            No vulnerabilities found in this report.
          </Alert>
        ) : (
          <List>
            {reportVulns.map((vuln, index) => (
              <Box key={vuln.id}>
                <ListItem
                  button
                  onClick={() => navigate(`/vulns/${vuln.id}`)}
                  sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {vuln.title}
                    </Typography>
                    <SeverityChip severity={vuln.severity} />
                    <StatusChip
                      status={vuln.status}
                      onChange={(newStatus) =>
                        updateVulnMutation.mutate({ vulnId: vuln.id, data: { status: newStatus } })
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {vuln.description.substring(0, 200)}...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {vuln.cve.map((cve, i) => (
                      <Chip key={i} label={cve} size="small" variant="outlined" />
                    ))}
                    {vuln.cwe.map((cwe, i) => (
                      <Chip key={i} label={cwe} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                    <FormControl size="small" sx={{ minWidth: 240 }} onClick={(e) => e.stopPropagation()}>
                      <InputLabel>Internal Status</InputLabel>
                      <Select
                        value={vuln.internalStatus || ''}
                        label="Internal Status"
                        onChange={(e) => updateVulnMutation.mutate({ vulnId: vuln.id, data: { internalStatus: e.target.value } })}
                      >
                        <MenuItem value="">None</MenuItem>
                        {InternalStatusOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </ListItem>
                {index < reportVulns.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
} 