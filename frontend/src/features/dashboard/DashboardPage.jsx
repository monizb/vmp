import { useState } from 'react';
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
  const [periods] = useState(6);
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

  // Analytics queries (must be declared before using below)
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
  // Fallback summary if analytics API fails
  const fallbackSummary = (() => {
    const today = new Date();
    const isOpen = (v) => v.status !== VulnStatus.Fixed && v.status !== VulnStatus.Closed;
    const bySeverity = {};
    const byStatus = {};
    const byInternalStatus = {};
    const byApp = {};
    let openNotOverdue = 0;
    let openTotalWithDueDate = 0;
    vulns.forEach((v) => {
      bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      if (v.internalStatus) byInternalStatus[v.internalStatus] = (byInternalStatus[v.internalStatus] || 0) + 1;
      if (v.applicationId) byApp[v.applicationId] = (byApp[v.applicationId] || 0) + 1;
      if (isOpen(v) && v.dueDate) {
        openTotalWithDueDate += 1;
        if (new Date(v.dueDate) >= today) openNotOverdue += 1;
      }
    });
    const overdue = vulns.filter((v) => isOpen(v) && v.dueDate && new Date(v.dueDate) < today).length;
    const open = vulns.filter(isOpen).length;
    const compliancePercent = openTotalWithDueDate > 0 ? Math.round((openNotOverdue / openTotalWithDueDate) * 100) : 100;
    return { total: vulns.length, open, overdue, bySeverity, byStatus, byInternalStatus, byApp, byTeam: {}, sla: { openNotOverdue, openTotalWithDueDate, compliancePercent } };
  })();

  const summaryData = summary || fallbackSummary;

  // Fallback timeseries (last 6 months)
  const fallbackTimeSeries = (() => {
    const end = new Date();
    const buckets = [];
    const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const next = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let cursor = new Date(start);
    while (cursor <= end) {
      buckets.push({ period: key(cursor), opened: 0, fixed: 0 });
      cursor = next(cursor);
    }
    const indexByKey = Object.fromEntries(buckets.map((b, i) => [b.period, i]));
    vulns.forEach((v) => {
      const disc = v.discoveredDate && new Date(v.discoveredDate);
      if (disc && disc >= start && disc <= end) {
        const k = key(new Date(disc.getFullYear(), disc.getMonth(), 1));
        if (indexByKey[k] !== undefined) buckets[indexByKey[k]].opened += 1;
      }
      const res = v.resolvedDate && new Date(v.resolvedDate);
      if (res && res >= start && res <= end) {
        const k = key(new Date(res.getFullYear(), res.getMonth(), 1));
        if (indexByKey[k] !== undefined) buckets[indexByKey[k]].fixed += 1;
      }
    });
    return { buckets };
  })();

  const timeSeriesData = (timeseries && Array.isArray(timeseries.buckets)) ? timeseries.buckets : fallbackTimeSeries.buckets;

  // Fallback MTTR
  const fallbackMttr = (() => {
    const durationsBySev = {};
    vulns.forEach((v) => {
      if (v.discoveredDate && v.resolvedDate) {
        const d = Math.max(0, Math.round((new Date(v.resolvedDate) - new Date(v.discoveredDate)) / (1000 * 60 * 60 * 24)));
        const sev = v.severity || 'Unknown';
        durationsBySev[sev] = durationsBySev[sev] || [];
        durationsBySev[sev].push(d);
      }
    });
    const bySeverity = Object.fromEntries(Object.entries(durationsBySev).map(([sev, arr]) => {
      const avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      return [sev, { average: avg }];
    }));
    return { bySeverity };
  })();

  const mttrData = mttr || fallbackMttr;

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

  // statusData replaced by analytics charts

  // (queries defined above)

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
            value={summaryData.total ?? totalVulns}
            icon={<BugReport />}
            color="error"
            subtitle={`${summaryData.open ?? openVulns} open issues`}
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
            value={`${summaryData.sla?.compliancePercent ?? 100}%`}
            icon={<BugReport />}
            color="error"
            subtitle={`${summaryData.overdue ?? overdueVulns} overdue issues`}
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
                <LineChart data={timeSeriesData}>
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
                <BarChart data={Object.entries(summaryData.byInternalStatus || {}).map(([name, value]) => ({ name, value }))}>
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
                <BarChart data={Object.entries(mttrData.bySeverity || {}).map(([name, val]) => ({ name, value: val.average }))}>
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
                      { name: 'Compliant', value: summaryData.sla?.openNotOverdue || 0 },
                      { name: 'Non-compliant', value: (summaryData.sla?.openTotalWithDueDate || 0) - (summaryData.sla?.openNotOverdue || 0) },
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