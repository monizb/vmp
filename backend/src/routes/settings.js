import { DueDateSettingsService } from '../services/DueDateSettingsService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function settingsRoutes(fastify, options) {
  const dueDateSettingsService = new DueDateSettingsService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get due date settings (Admin, Security only)
  fastify.get('/settings/due-dates', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      console.log('GET /settings/due-dates called');
      const settings = await dueDateSettingsService.getSettings();
      console.log('Settings retrieved:', settings);
      return settings;
    } catch (error) {
      console.error('Error in GET /settings/due-dates:', error);
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update due date settings (Admin only)
  fastify.patch('/settings/due-dates', {
    preHandler: requireRole(['Admin'])
  }, async (request, reply) => {
    try {
      const settingsData = request.body;
      
      // Validate the settings data
      if (settingsData.dueDateTimelines) {
        const validSeverities = ['Critical', 'High', 'Medium', 'Low'];
        for (const severity of validSeverities) {
          if (settingsData.dueDateTimelines[severity] !== undefined) {
            const timeline = settingsData.dueDateTimelines[severity];
            if (typeof timeline !== 'number' || timeline < 1 || timeline > 365) {
              return reply.code(400).send({ 
                error: 'Bad request', 
                message: `Timeline for ${severity} must be a number between 1 and 365 days` 
              });
            }
          }
        }
      }

      const settings = await dueDateSettingsService.updateSettings(settingsData);
      return settings;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
}