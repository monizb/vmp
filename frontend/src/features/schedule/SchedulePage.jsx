import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from '@mui/material';
import {
  Schedule,
  BugReport,
  Warning,
  CheckCircle,
  CalendarToday,
  Assignment,
} from '@mui/icons-material';
import { vulnsApi, appsApi } from '../../api/endpoints';
import { Severity, VulnStatus } from '../../types/models';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export function SchedulePage() {
  const { data: vulnsData, isLoading, error } = useQuery({
    queryKey: ['vulns', {}],
    queryFn: () => vulnsApi.getAll({ pageSize: 1000 }),
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Schedule
        </Typography>
        <Grid container spacing={3}>
          {Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} md={4} key={index}>
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
        Error loading schedule: {error.message}
      </Alert>
    );
  }

  const vulns = vulnsData?.items || [];
  const today = new Date();

  // Filter vulnerabilities that need attention
  const overdueVulns = vulns.filter(vuln => {
    if (vuln.status === VulnStatus.Fixed || vuln.status === VulnStatus.Closed) return false;
    if (!vuln.dueDate) return false;
    return isBefore(new Date(vuln.dueDate), today);
  });

  const dueThisWeek = vulns.filter(vuln => {
    if (vuln.status === VulnStatus.Fixed || vuln.status === VulnStatus.Closed) return false;
    if (!vuln.dueDate) return false;
    const dueDate = new Date(vuln.dueDate);
    const weekFromNow = addDays(today, 7);
    return isAfter(dueDate, today) && isBefore(dueDate, weekFromNow);
  });

  const upcomingRetests = vulns.filter(vuln => {
    if (vuln.status !== VulnStatus.Fixed) return false;
    if (!vuln.resolvedDate) return false;
    // Assume retest is due 30 days after fix
    const retestDate = addDays(new Date(vuln.resolvedDate), 30);
    return isAfter(retestDate, today) && isBefore(retestDate, addDays(today, 30));
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case Severity.Critical:
        return <BugReport color="error" />;
      case Severity.High:
        return <Warning color="warning" />;
      case Severity.Medium:
        return <Assignment color="info" />;
      case Severity.Low:
        return <CheckCircle color="success" />;
      default:
        return <BugReport />;
    }
  };

  const getAppName = (appId) => {
    const app = apps?.find(a => a.id === appId);
    return app?.name || appId;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Schedule & Retests
      </Typography>

      <Grid container spacing={3}>
        {/* Overdue Vulnerabilities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error">
                  Overdue ({overdueVulns.length})
                </Typography>
              </Box>
              
              {overdueVulns.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No overdue vulnerabilities
                </Typography>
              ) : (
                <List dense>
                  {overdueVulns.slice(0, 5).map((vuln, index) => (
                    <Box key={vuln.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getSeverityIcon(vuln.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={vuln.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {getAppName(vuln.applicationId)}
                              </Typography>
                              <Typography variant="caption" color="error">
                                Due: {format(new Date(vuln.dueDate), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={vuln.severity}
                          size="small"
                          color={vuln.severity === Severity.Critical ? 'error' : 'warning'}
                        />
                      </ListItem>
                      {index < overdueVulns.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Due This Week */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="warning.main">
                  Due This Week ({dueThisWeek.length})
                </Typography>
              </Box>
              
              {dueThisWeek.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No vulnerabilities due this week
                </Typography>
              ) : (
                <List dense>
                  {dueThisWeek.slice(0, 5).map((vuln, index) => (
                    <Box key={vuln.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getSeverityIcon(vuln.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={vuln.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {getAppName(vuln.applicationId)}
                              </Typography>
                              <Typography variant="caption" color="warning.main">
                                Due: {format(new Date(vuln.dueDate), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={vuln.severity}
                          size="small"
                          color={vuln.severity === Severity.Critical ? 'error' : 'warning'}
                        />
                      </ListItem>
                      {index < dueThisWeek.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Retests */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" color="info.main">
                  Upcoming Retests ({upcomingRetests.length})
                </Typography>
              </Box>
              
              {upcomingRetests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No upcoming retests scheduled
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {upcomingRetests.map((vuln) => {
                    const retestDate = addDays(new Date(vuln.resolvedDate), 30);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={vuln.id}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getSeverityIcon(vuln.severity)}
                            <Typography variant="subtitle2" sx={{ ml: 1, flexGrow: 1 }}>
                              {vuln.title}
                            </Typography>
                          </Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {getAppName(vuln.applicationId)}
                          </Typography>
                          <Typography variant="caption" color="info.main">
                            Retest Due: {format(retestDate, 'MMM dd, yyyy')}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 