import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Visibility,
  Download,
  Upload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appsApi, teamsApi, reportsApi } from '../../api/endpoints';
import { PlatformBadge } from '../../components/ui/PlatformBadge';
import { format } from 'date-fns';

export function AppsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState(null);
  const [openAppDialog, setOpenAppDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [appData, setAppData] = useState({
    name: '',
    platform: 'Web',
    teamId: '',
    description: '',
  });
  const [reportData, setReportData] = useState({
    driveFileId: '',
    vendorName: '',
  });

  const { data: apps, isLoading, error } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll({ pageSize: 1000 }),
  });

  const createAppMutation = useMutation({
    mutationFn: (data) => appsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apps']);
      setOpenAppDialog(false);
      setAppData({ name: '', platform: 'Web', teamId: '', description: '' });
    },
  });

  const importReportMutation = useMutation({
    mutationFn: (data) => reportsApi.import({ ...data, applicationId: selectedApp.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      setOpenReportDialog(false);
      setReportData({ driveFileId: '', vendorName: '' });
    },
  });

  const handleCreateApp = () => {
    if (appData.name && appData.platform && appData.teamId) {
      createAppMutation.mutate(appData);
    }
  };

  const handleImportReport = () => {
    if (reportData.driveFileId && reportData.vendorName && selectedApp) {
      importReportMutation.mutate(reportData);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams?.find(t => t.id === teamId);
    return team?.name || teamId;
  };

  const getReportsByYear = (appId) => {
    if (!reports?.items) return {};
    
    const appReports = reports.items.filter(r => r.applicationId === appId);
    const reportsByYear = {};
    
    appReports.forEach(report => {
      const year = new Date(report.reportDate || report.dateUploaded).getFullYear();
      if (!reportsByYear[year]) {
        reportsByYear[year] = [];
      }
      reportsByYear[year].push(report);
    });
    
    // Sort years in descending order and reports by date
    Object.keys(reportsByYear).forEach(year => {
      reportsByYear[year].sort((a, b) => 
        new Date(b.reportDate || b.dateUploaded) - new Date(a.reportDate || a.dateUploaded)
      );
    });
    
    return reportsByYear;
  };

  const getVulnerabilityCount = (reportId) => {
    const report = reports?.items?.find(r => r.id === reportId);
    return report?.vulnerabilityIds?.length || 0;
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Applications</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAppDialog(true)}
          >
            Add Application
          </Button>
        </Box>
        <Grid container spacing={3}>
          {Array.from(new Array(6)).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading applications: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Applications</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAppDialog(true)}
        >
          Add Application
        </Button>
      </Box>

      <Grid container spacing={3}>
        {apps?.map((app) => {
          const reportsByYear = getReportsByYear(app.id);
          const totalReports = Object.values(reportsByYear).flat().length;
          
          return (
            <Grid item xs={12} md={6} key={app.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {app.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PlatformBadge platform={app.platform} />
                        <Typography variant="body2" color="text.secondary">
                          {getTeamName(app.teamId)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedApp(app);
                          setOpenReportDialog(true);
                        }}
                        title="Import Report"
                      >
                        <Upload />
                      </IconButton>
                      <IconButton size="small" title="Edit Application">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" title="Delete Application">
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {app.description || 'No description available'}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>{totalReports}</strong> reports • <strong>{Object.keys(reportsByYear).length}</strong> years
                  </Typography>

                  {totalReports > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Reports by Year:
                      </Typography>
                      {Object.keys(reportsByYear)
                        .sort((a, b) => parseInt(b) - parseInt(a))
                        .slice(0, 3)
                        .map((year) => (
                          <Accordion key={year} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">
                                {year} ({reportsByYear[year].length} reports)
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {reportsByYear[year].map((report) => (
                                  <ListItem key={report.id}>
                                    <ListItemText
                                      primary={report.fileName}
                                      secondary={`${report.vendorName} • ${format(new Date(report.reportDate || report.dateUploaded), 'MMM dd, yyyy')} • ${getVulnerabilityCount(report.id)} findings`}
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        size="small"
                                        onClick={() => navigate(`/reports/${report.id}`)}
                                      >
                                        <Visibility />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      {Object.keys(reportsByYear).length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{Object.keys(reportsByYear).length - 3} more years
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/vulns?applicationId=${app.id}`)}
                  >
                    View Vulnerabilities
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/reports?applicationId=${app.id}`)}
                  >
                    View All Reports
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add Application Dialog */}
      <Dialog open={openAppDialog} onClose={() => setOpenAppDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Application</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Application Name"
              value={appData.name}
              onChange={(e) => setAppData({ ...appData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Platform</InputLabel>
              <Select
                value={appData.platform}
                onChange={(e) => setAppData({ ...appData, platform: e.target.value })}
                label="Platform"
              >
                <MenuItem value="Web">Web</MenuItem>
                <MenuItem value="iOS">iOS</MenuItem>
                <MenuItem value="Android">Android</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Team</InputLabel>
              <Select
                value={appData.teamId}
                onChange={(e) => setAppData({ ...appData, teamId: e.target.value })}
                label="Team"
              >
                {teams?.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name} ({team.platform})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={appData.description}
              onChange={(e) => setAppData({ ...appData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAppDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateApp}
            variant="contained"
            disabled={!appData.name || !appData.platform || !appData.teamId || createAppMutation.isLoading}
          >
            {createAppMutation.isLoading ? 'Creating...' : 'Create Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Import Report for {selectedApp?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Google Drive File ID"
              value={reportData.driveFileId}
              onChange={(e) => setReportData({ ...reportData, driveFileId: e.target.value })}
              placeholder="Enter the Google Drive file ID"
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={reportData.vendorName}
                onChange={(e) => setReportData({ ...reportData, vendorName: e.target.value })}
                label="Vendor"
              >
                <MenuItem value="appknox">Appknox</MenuItem>
                <MenuItem value="aujas">Aujas</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleImportReport}
            variant="contained"
            disabled={!reportData.driveFileId || !reportData.vendorName || importReportMutation.isLoading}
          >
            {importReportMutation.isLoading ? 'Importing...' : 'Import Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 