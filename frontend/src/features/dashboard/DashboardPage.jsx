import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BugReport,
  Description,
  Apps,
  Group,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { vulnsApi, reportsApi, appsApi, teamsApi } from '../../api/endpoints';
import { Severity, VulnStatus } from '../../types/models';

export function DashboardPage() {
  const [interval, setInterval] = useState('month');
  const [periods, setPeriods] = useState(6);
  const [severityFilter, setSeverityFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');

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

  // Analytics queries
  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', severityFilter, applicationFilter],
    queryFn: () => vulnsApi.getAnalyticsSummary({ severity: severityFilter || undefined, applicationId: applicationFilter || undefined }),
  });

  const { data: timeseries } = useQuery({
    queryKey: ['analytics', 'timeseries', interval, periods, severityFilter, applicationFilter],
    queryFn: () => vulnsApi.getAnalyticsTimeSeries({ interval, periods, severity: severityFilter || undefined, applicationId: applicationFilter || undefined }),
  });

  const { data: mttr } = useQuery({
    queryKey: ['analytics', 'mttr', severityFilter, applicationFilter],
    queryFn: () => vulnsApi.getAnalyticsMTTR({ severity: severityFilter || undefined, applicationId: applicationFilter || undefined }),
  });

  const { data: topApps } = useQuery({
    queryKey: ['analytics', 'top-apps', severityFilter],
    queryFn: () => vulnsApi.getTopApps({ limit: 5, severity: severityFilter || undefined }),
  });

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ borderRadius: 3, boxShadow: 3, border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{
            backgroundColor: `${color}.main`,
            color: '#fff',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            boxShadow: 2,
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" component="div" sx={{ lineHeight: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup value={interval} exclusive onChange={(e, val) => val && setInterval(val)} size="small">
            <ToggleButton value="week">Weekly</ToggleButton>
            <ToggleButton value="month">Monthly</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {Object.values(Severity).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Application</InputLabel>
            <Select value={applicationFilter} label="Application" onChange={(e) => setApplicationFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {apps.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vulnerabilities"
            value={summary?.total ?? totalVulns}
            icon={<BugReport />}
            color="error"
            subtitle={`${summary?.open ?? openVulns} open issues`}
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
            title="SLA Compliance"
            value={`${summary?.sla?.compliancePercent ?? 100}%`}
            icon={<BugReport />}
            color="error"
            subtitle={`${summary?.overdue ?? overdueVulns} overdue issues`}
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
                <PieChart>
                  <Pie dataKey="value" data={severityData} nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Opened vs Fixed ({interval})
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries?.buckets || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="opened" stroke="#1976d2" />
                  <Line type="monotone" dataKey="fixed" stroke="#2e7d32" />
                </LineChart>
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
                Internal Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(summary?.byInternalStatus || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6a1b9a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MTTR by Severity (days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(mttr?.bySeverity || {}).map(([name, val]) => ({ name, value: val.average }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef6c00" />
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
                SLA Compliance
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: 'Compliant', value: summary?.sla?.openNotOverdue || 0 },
                      { name: 'Non-compliant', value: (summary?.sla?.openTotalWithDueDate || 0) - (summary?.sla?.openNotOverdue || 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label
                  >
                    <Cell fill="#2e7d32" />
                    <Cell fill="#c62828" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Risk Applications (Open Vulns)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                {(topApps || []).map((a) => (
                  <Box key={a.applicationId} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2">{a.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{a.openCount} open</Typography>
                  </Box>
                ))}
                {(!topApps || topApps.length === 0) && (
                  <Typography variant="body2" color="text.secondary">No open vulnerabilities</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 