import { rest } from 'msw';
import { createMockData } from './data';

const mockData = createMockData();

export const handlers = [
  // Health check
  rest.get('/api/status', (req, res, ctx) => {
    return res(
      ctx.json({ status: 'ok', timestamp: new Date().toISOString() })
    );
  }),

  // Apps endpoints
  rest.get('/api/apps', (req, res, ctx) => {
    const teamId = req.url.searchParams.get('teamId');
    const platform = req.url.searchParams.get('platform');
    
    let apps = mockData.apps;
    
    if (teamId) {
      apps = apps.filter(app => app.teamId === teamId);
    }
    
    if (platform) {
      apps = apps.filter(app => app.platform === platform);
    }
    
    return res(ctx.json(apps));
  }),

  rest.get('/api/apps/:id', (req, res, ctx) => {
    const app = mockData.apps.find(a => a.id === req.params.id);
    if (!app) {
      return res(ctx.status(404));
    }
    return res(ctx.json(app));
  }),

  rest.post('/api/apps', async (req, res, ctx) => {
    const data = await req.json();
    const newApp = {
      id: `app_${Date.now()}`,
      ...data,
    };
    mockData.apps.push(newApp);
    return res(ctx.status(201), ctx.json(newApp));
  }),

  // Teams endpoints
  rest.get('/api/teams', (req, res, ctx) => {
    return res(ctx.json(mockData.teams));
  }),

  rest.get('/api/teams/:id', (req, res, ctx) => {
    const team = mockData.teams.find(t => t.id === req.params.id);
    if (!team) {
      return res(ctx.status(404));
    }
    return res(ctx.json(team));
  }),

  rest.post('/api/teams', async (req, res, ctx) => {
    const data = await req.json();
    const newTeam = {
      id: `team_${Date.now()}`,
      ...data,
    };
    mockData.teams.push(newTeam);
    return res(ctx.status(201), ctx.json(newTeam));
  }),

  // Reports endpoints
  rest.get('/api/reports', (req, res, ctx) => {
    const applicationId = req.url.searchParams.get('applicationId');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    
    let reports = mockData.reports;
    
    if (applicationId) {
      reports = reports.filter(report => report.applicationId === applicationId);
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedReports = reports.slice(start, end);
    
    return res(ctx.json({
      items: paginatedReports,
      total: reports.length,
      page,
      pageSize,
    }));
  }),

  rest.get('/api/reports/:id', (req, res, ctx) => {
    const report = mockData.reports.find(r => r.id === req.params.id);
    if (!report) {
      return res(ctx.status(404));
    }
    return res(ctx.json(report));
  }),

  rest.post('/api/reports/import', (req, res, ctx) => {
    return res(ctx.json({ message: 'Import started', jobId: `job_${Date.now()}` }));
  }),

  // Vulnerabilities endpoints
  rest.get('/api/vulns', (req, res, ctx) => {
    const applicationId = req.url.searchParams.get('applicationId');
    const status = req.url.searchParams.get('status');
    const severity = req.url.searchParams.get('severity');
    const assignedTo = req.url.searchParams.get('assignedTo');
    const search = req.url.searchParams.get('search');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
    
    let vulns = mockData.vulnerabilities;
    
    if (applicationId) {
      vulns = vulns.filter(v => v.applicationId === applicationId);
    }
    
    if (status) {
      vulns = vulns.filter(v => v.status === status);
    }
    
    if (severity) {
      vulns = vulns.filter(v => v.severity === severity);
    }
    
    if (assignedTo) {
      vulns = vulns.filter(v => v.assignedToUserId === assignedTo);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      vulns = vulns.filter(v => 
        v.title.toLowerCase().includes(searchLower) ||
        v.description.toLowerCase().includes(searchLower) ||
        v.cve.some(cve => cve.toLowerCase().includes(searchLower)) ||
        v.cwe.some(cwe => cwe.toLowerCase().includes(searchLower))
      );
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedVulns = vulns.slice(start, end);
    
    return res(ctx.json({
      items: paginatedVulns,
      total: vulns.length,
      page,
      pageSize,
    }));
  }),

  rest.get('/api/vulns/:id', (req, res, ctx) => {
    const vuln = mockData.vulnerabilities.find(v => v.id === req.params.id);
    if (!vuln) {
      return res(ctx.status(404));
    }
    return res(ctx.json(vuln));
  }),

  rest.patch('/api/vulns/:id', async (req, res, ctx) => {
    const data = await req.json();
    const vulnIndex = mockData.vulnerabilities.findIndex(v => v.id === req.params.id);
    
    if (vulnIndex === -1) {
      return res(ctx.status(404));
    }
    
    mockData.vulnerabilities[vulnIndex] = {
      ...mockData.vulnerabilities[vulnIndex],
      ...data,
    };
    
    return res(ctx.json(mockData.vulnerabilities[vulnIndex]));
  }),

  rest.post('/api/vulns', async (req, res, ctx) => {
    const data = await req.json();
    const newVuln = {
      id: `vuln_${Date.now()}`,
      ...data,
    };
    mockData.vulnerabilities.push(newVuln);
    return res(ctx.status(201), ctx.json(newVuln));
  }),

  // Users endpoints
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json(mockData.users));
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const user = mockData.users.find(u => u.id === req.params.id);
    if (!user) {
      return res(ctx.status(404));
    }
    return res(ctx.json(user));
  }),

  rest.get('/api/me', (req, res, ctx) => {
    // Return the first user as the current user for demo
    return res(ctx.json(mockData.users[0]));
  }),

  rest.post('/api/users', async (req, res, ctx) => {
    const data = await req.json();
    const newUser = {
      id: `user_${Date.now()}`,
      ...data,
    };
    mockData.users.push(newUser);
    return res(ctx.status(201), ctx.json(newUser));
  }),

  rest.patch('/api/users/:id', async (req, res, ctx) => {
    const data = await req.json();
    const userIndex = mockData.users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res(ctx.status(404));
    }
    
    mockData.users[userIndex] = {
      ...mockData.users[userIndex],
      ...data,
    };
    
    return res(ctx.json(mockData.users[userIndex]));
  }),

  // Config endpoint
  rest.get('/api/config', (req, res, ctx) => {
    return res(ctx.json({
      driveFolderIds: {
        web: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        ios: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        android: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      },
      defaultRetestDays: 30,
      notificationSettings: {
        email: true,
        slack: false,
      },
    }));
  }),

  rest.post('/api/config', async (req, res, ctx) => {
    const data = await req.json();
    return res(ctx.json({ message: 'Configuration updated', ...data }));
  }),

  // Fallback handler for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn('Unhandled request:', req.method, req.url.pathname);
    return res(
      ctx.status(404),
      ctx.json({ 
        error: 'Not found',
        message: `No handler found for ${req.method} ${req.url.pathname}` 
      })
    );
  }),
]; 