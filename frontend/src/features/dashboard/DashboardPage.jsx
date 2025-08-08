import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  BugReport,
  Description,
  Apps,
  Group,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { vulnsApi, reportsApi, appsApi, teamsApi } from '../../api/endpoints';
import { Severity, VulnStatus } from '../../types/models';

export function DashboardPage() {
  const { data: vulnsData } = useQuery({
    queryKey: ['vulns', {}],
    queryFn: () => vulnsApi.getAll({ pageSize: 1000 }),
  });

  const { data: reportsData } = useQuery({
    queryKey: ['reports', {}],
    queryFn: () => reportsApi.getAll({ pageSize: 1000 }),
  });

  const { data: appsData } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const vulns = vulnsData?.items || [];
  const reports = reportsData?.items || [];
  const apps = appsData || [];
  const teams = teamsData || [];

  // Calculate statistics
  const totalVulns = vulns.length;
  const openVulns = vulns.filter(v => v.status !== VulnStatus.Fixed && v.status !== VulnStatus.Closed).length;
  const criticalVulns = vulns.filter(v => v.severity === Severity.Critical).length;
  const highVulns = vulns.filter(v => v.severity === Severity.High).length;
  const overdueVulns = vulns.filter(v => {
    if (v.status === VulnStatus.Fixed || v.status === VulnStatus.Closed) return false;
    if (!v.dueDate) return false;
    return new Date(v.dueDate) < new Date();
  }).length;

  const severityData = [
    { name: 'Critical', value: criticalVulns, color: '#9c27b0' },
    { name: 'High', value: highVulns, color: '#f44336' },
    { name: 'Medium', value: vulns.filter(v => v.severity === Severity.Medium).length, color: '#ff9800' },
    { name: 'Low', value: vulns.filter(v => v.severity === Severity.Low).length, color: '#4caf50' },
  ];

  const statusData = [
    { name: 'Open', value: vulns.filter(v => v.status === VulnStatus.Open).length },
    { name: 'In Progress', value: vulns.filter(v => v.status === VulnStatus.InProgress).length },
    { name: 'Fixed', value: vulns.filter(v => v.status === VulnStatus.Fixed).length },
    { name: 'Closed', value: vulns.filter(v => v.status === VulnStatus.Closed).length },
  ];

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 1,
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vulnerabilities"
            value={totalVulns}
            icon={<BugReport />}
            color="error"
            subtitle={`${openVulns} open issues`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Issues"
            value={criticalVulns}
            icon={<TrendingUp />}
            color="error"
            subtitle="Requires immediate attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Priority"
            value={highVulns}
            icon={<TrendingDown />}
            color="warning"
            subtitle="Address within 30 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue"
            value={overdueVulns}
            icon={<BugReport />}
            color="error"
            subtitle="Past due date"
          />
        </Grid>
      </Grid>

      {overdueVulns > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {overdueVulns} vulnerabilities are overdue and require immediate attention.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vulnerabilities by Severity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vulnerabilities by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Applications Overview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Apps sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {apps.length} Applications across {teams.length} Teams
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {reports.length} Reports imported
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reports.length > 0 ? (
                  `Latest report: ${reports[reports.length - 1]?.fileName}`
                ) : (
                  'No reports imported yet'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 