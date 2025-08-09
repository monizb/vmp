import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import { Save, RestoreRounded } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { settingsApi } from '../../api/endpoints';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    autoAssignDueDates: true,
    dueDateTimelines: {
      Critical: 15,
      High: 30,
      Medium: 60,
      Low: 60
    }
  });

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings', 'due-dates'],
    queryFn: () => settingsApi.getDueDateSettings(),
    onSuccess: (data) => {
      setFormData({
        autoAssignDueDates: data.autoAssignDueDates,
        dueDateTimelines: data.dueDateTimelines
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => settingsApi.updateDueDateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings', 'due-dates']);
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar('Failed to update settings: ' + error.message, { variant: 'error' });
    },
  });

  const handleSwitchChange = (event) => {
    setFormData({
      ...formData,
      autoAssignDueDates: event.target.checked
    });
  };

  const handleTimelineChange = (severity, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 365) return;
    
    setFormData({
      ...formData,
      dueDateTimelines: {
        ...formData.dueDateTimelines,
        [severity]: numValue
      }
    });
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        autoAssignDueDates: settings.autoAssignDueDates,
        dueDateTimelines: settings.dueDateTimelines
      });
    }
  };

  const resetToDefaults = () => {
    setFormData({
      autoAssignDueDates: true,
      dueDateTimelines: {
        Critical: 15,
        High: 30,
        Medium: 60,
        Low: 60
      }
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load settings: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Due Date Auto-Assignment"
              subheader="Configure automatic due date assignment based on vulnerability severity"
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoAssignDueDates}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Automatically assign due dates based on severity"
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom>
                Due Date Timelines (days)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set the number of days from discovery date to the due date for each severity level.
              </Typography>

              <Grid container spacing={2}>
                {Object.entries(formData.dueDateTimelines).map(([severity, days]) => (
                  <Grid item xs={12} sm={6} md={3} key={severity}>
                    <TextField
                      fullWidth
                      label={severity}
                      type="number"
                      value={days}
                      onChange={(e) => handleTimelineChange(severity, e.target.value)}
                      disabled={!formData.autoAssignDueDates}
                      inputProps={{ min: 1, max: 365 }}
                      helperText={`${days} days`}
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={updateMutation.isLoading}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={updateMutation.isLoading}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestoreRounded />}
                  onClick={resetToDefaults}
                  disabled={updateMutation.isLoading}
                >
                  Restore Defaults
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Preview"
              subheader="How due dates will be calculated"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Based on current settings, vulnerabilities discovered today would have these due dates:
              </Typography>
              
              {Object.entries(formData.dueDateTimelines).map(([severity, days]) => {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + days);
                
                return (
                  <Box key={severity} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {severity}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.autoAssignDueDates 
                        ? dueDate.toLocaleDateString()
                        : 'Not assigned'
                      }
                    </Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}