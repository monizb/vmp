import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { AuthProvider } from '../features/auth/AuthProvider';
import { RequireAuth } from '../components/guards/RequireAuth';
import { RequireRole } from '../components/guards/RequireRole';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { VulnsTable } from '../features/vulns/VulnsTable';
import { VulnDetails } from '../features/vulns/VulnDetails';
import { ReportsTable } from '../features/reports/ReportsTable';
import { ReportDetails } from '../features/reports/ReportDetails';
import { AppsPage } from '../features/apps/AppsPage';
import { TeamsPage } from '../features/teams/TeamsPage';
import { UsersPage } from '../features/users/UsersPage';
import { SchedulePage } from '../features/schedule/SchedulePage';
import { Role } from '../types/models';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="vulns" element={<VulnsTable />} />
                  <Route path="vulns/:id" element={<VulnDetails />} />
                  <Route path="reports" element={<ReportsTable />} />
                  <Route path="reports/:id" element={<ReportDetails />} />
                  <Route
                    path="apps"
                    element={
                      <RequireRole allowedRoles={[Role.Admin, Role.Security]}>
                        <AppsPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="teams"
                    element={
                      <RequireRole allowedRoles={[Role.Admin, Role.Security]}>
                        <TeamsPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <RequireRole allowedRoles={[Role.Admin]}>
                        <UsersPage />
                      </RequireRole>
                    }
                  />
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="me" element={<div>Profile (Coming Soon)</div>} />
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 