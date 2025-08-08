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
  Chip,
  Skeleton,
  Alert,
  Avatar,
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
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete, Email, Group } from '@mui/icons-material';
import { usersApi, teamsApi } from '../../api/endpoints';
import { Role } from '../../types/models';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    role: 'Dev',
    teamIds: [],
  });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpenDialog(false);
      setUserData({ email: '', name: '', role: 'Dev', teamIds: [] });
      setEditingUser(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpenDialog(false);
      setUserData({ email: '', name: '', role: 'Dev', teamIds: [] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });

  const handleCreateUser = () => {
    if (userData.email && userData.name && userData.role) {
      createUserMutation.mutate(userData);
    }
  };

  const handleUpdateUser = () => {
    if (userData.email && userData.name && userData.role && editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserData({
      email: user.email,
      name: user.name,
      role: user.role,
      teamIds: user.teamIds || [],
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleOpenDialog = () => {
    setEditingUser(null);
    setUserData({ email: '', name: '', role: 'Dev', teamIds: [] });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setUserData({ email: '', name: '', role: 'Dev', teamIds: [] });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case Role.Admin:
        return 'error';
      case Role.Security:
        return 'warning';
      case Role.Dev:
        return 'primary';
      case Role.ProductOwner:
        return 'success';
      default:
        return 'default';
    }
  };

  const getUserTeams = (user) => {
    return teams?.filter(team => user.teamIds.includes(team.id)) || [];
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Users</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
          >
            Add User
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
        Error loading users: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Add User
        </Button>
      </Box>

      <Grid container spacing={3}>
        {users?.map((user) => {
          const userTeams = getUserTeams(user);
          return (
            <Grid item xs={12} md={6} key={user.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {user.name || 'Unnamed User'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </Box>

                  {userTeams.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Group sx={{ fontSize: 16 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Teams:
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {userTeams.map((team) => (
                          <Chip
                            key={team.id}
                            label={team.name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditUser(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Delete />}
                    color="error"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {users?.length === 0 && (
        <Alert severity="info">
          No users found. Create your first user to get started.
        </Alert>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Name"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                label="Role"
              >
                <MenuItem value={Role.Admin}>Admin</MenuItem>
                <MenuItem value={Role.Security}>Security</MenuItem>
                <MenuItem value={Role.Dev}>Developer</MenuItem>
                <MenuItem value={Role.ProductOwner}>Product Owner</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Teams</InputLabel>
              <Select
                multiple
                value={userData.teamIds}
                onChange={(e) => setUserData({ ...userData, teamIds: e.target.value })}
                input={<OutlinedInput label="Teams" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const team = teams?.find(t => t.id === value);
                      return (
                        <Chip key={value} label={team?.name || value} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {teams?.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    <Checkbox checked={userData.teamIds.indexOf(team.id) > -1} />
                    <ListItemText primary={team.name} secondary={team.platform} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={editingUser ? handleUpdateUser : handleCreateUser}
            variant="contained"
            disabled={!userData.email || !userData.name || !userData.role || 
              (editingUser ? updateUserMutation.isLoading : createUserMutation.isLoading)}
          >
            {editingUser 
              ? (updateUserMutation.isLoading ? 'Updating...' : 'Update User')
              : (createUserMutation.isLoading ? 'Creating...' : 'Create User')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 