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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { teamsApi, appsApi } from '../../api/endpoints';
import { PlatformBadge } from '../../components/ui/PlatformBadge';

export function TeamsPage() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamData, setTeamData] = useState({
    name: '',
    platform: 'Web',
  });

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const { data: apps } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.getAll(),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setOpenDialog(false);
      setTeamData({ name: '', platform: 'Web' });
      setEditingTeam(null);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
      setOpenDialog(false);
      setTeamData({ name: '', platform: 'Web' });
      setEditingTeam(null);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teams']);
    },
  });

  const handleCreateTeam = () => {
    if (teamData.name && teamData.platform) {
      createTeamMutation.mutate(teamData);
    }
  };

  const handleUpdateTeam = () => {
    if (teamData.name && teamData.platform && editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, data: teamData });
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamData({
      name: team.name,
      platform: team.platform,
    });
    setOpenDialog(true);
  };

  const handleDeleteTeam = (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleOpenDialog = () => {
    setEditingTeam(null);
    setTeamData({ name: '', platform: 'Web' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeam(null);
    setTeamData({ name: '', platform: 'Web' });
  };

  const getTeamApps = (teamId) => {
    return apps?.filter(app => app.teamId === teamId) || [];
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Teams</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
          >
            Add Team
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
        Error loading teams: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Teams</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Add Team
        </Button>
      </Box>

      <Grid container spacing={3}>
        {teams?.map((team) => {
          const teamApps = getTeamApps(team.id);
          return (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {team.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlatformBadge platform={team.platform} />
                        <Typography variant="body2" color="text.secondary">
                          {teamApps.length} applications
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTeam(team)}
                        title="Edit Team"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTeam(team.id)}
                        title="Delete Team"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  {teamApps.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Applications:
                      </Typography>
                      <List dense>
                        {teamApps.slice(0, 3).map((app) => (
                          <ListItem key={app.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={app.name}
                              secondary={app.description}
                            />
                          </ListItem>
                        ))}
                        {teamApps.length > 3 && (
                          <ListItem sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={`+${teamApps.length - 3} more applications`}
                              sx={{ fontStyle: 'italic' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => window.location.href = `/apps?teamId=${team.id}`}
                  >
                    View Applications
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add/Edit Team Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTeam ? 'Edit Team' : 'Add New Team'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Team Name"
              value={teamData.name}
              onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Platform</InputLabel>
              <Select
                value={teamData.platform}
                onChange={(e) => setTeamData({ ...teamData, platform: e.target.value })}
                label="Platform"
              >
                <MenuItem value="Web">Web</MenuItem>
                <MenuItem value="iOS">iOS</MenuItem>
                <MenuItem value="Android">Android</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
            variant="contained"
            disabled={!teamData.name || !teamData.platform || 
              (editingTeam ? updateTeamMutation.isLoading : createTeamMutation.isLoading)}
          >
            {editingTeam 
              ? (updateTeamMutation.isLoading ? 'Updating...' : 'Update Team')
              : (createTeamMutation.isLoading ? 'Creating...' : 'Create Team')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 