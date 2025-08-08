import { UserService } from '../services/UserService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function userRoutes(fastify, options) {
  const userService = new UserService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get all users (Admin only)
  fastify.get('/users', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const users = await userService.getAll();
      return users;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get current user
  fastify.get('/me', async (request, reply) => {
    try {
      const user = await userService.getCurrentUser(request.user.email);
      if (!user) {
        return reply.code(404).send({ error: 'Not found', message: 'User not found' });
      }
      return user;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get user by ID (Admin only)
  fastify.get('/users/:id', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await userService.getById(id);
      if (!user) {
        return reply.code(404).send({ error: 'Not found', message: 'User not found' });
      }
      return user;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Create new user (Admin only)
  fastify.post('/users', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const userData = request.body;
      
      // Validate required fields
      if (!userData.email || !userData.name || !userData.role) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Email, name, and role are required' 
        });
      }

      // Check if user already exists
      const existingUser = await userService.getByEmail(userData.email);
      if (existingUser) {
        return reply.code(409).send({ 
          error: 'Conflict', 
          message: 'User with this email already exists' 
        });
      }

      const user = await userService.create(userData);
      reply.code(201).send(user);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update user (Admin only)
  fastify.patch('/users/:id', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const user = await userService.update(id, updateData);
      if (!user) {
        return reply.code(404).send({ error: 'Not found', message: 'User not found' });
      }
      
      return user;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Delete user (Admin only)
  fastify.delete('/users/:id', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await userService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'User not found' });
      }
      
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
} 