import { TeamService } from '../services/TeamService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function teamRoutes(fastify, options) {
  const teamService = new TeamService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get all teams (Admin, Security only)
  fastify.get('/teams', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const teams = await teamService.getAll();
      return teams;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get team by ID (Admin, Security only)
  fastify.get('/teams/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const team = await teamService.getById(id);
      if (!team) {
        return reply.code(404).send({ error: 'Not found', message: 'Team not found' });
      }
      return team;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Create new team (Admin, Security only)
  fastify.post('/teams', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const teamData = request.body;
      
      // Validate required fields
      if (!teamData.name || !teamData.platform) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Name and platform are required' 
        });
      }

      const team = await teamService.create(teamData);
      reply.code(201).send(team);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update team (Admin, Security only)
  fastify.patch('/teams/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const team = await teamService.update(id, updateData);
      if (!team) {
        return reply.code(404).send({ error: 'Not found', message: 'Team not found' });
      }
      
      return team;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Delete team (Admin, Security only)
  fastify.delete('/teams/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await teamService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'Team not found' });
      }
      
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get teams by platform (Admin, Security only)
  fastify.get('/teams/platform/:platform', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { platform } = request.params;
      const teams = await teamService.getByPlatform(platform);
      return teams;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
} 