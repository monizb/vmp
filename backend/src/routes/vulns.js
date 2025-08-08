import { VulnerabilityService } from '../services/VulnerabilityService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function vulnRoutes(fastify, options) {
  const vulnService = new VulnerabilityService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get all vulnerabilities with pagination and filters
  fastify.get('/vulns', async (request, reply) => {
    try {
      const filters = {
        applicationId: request.query.applicationId,
        reportId: request.query.reportId,
        status: request.query.status,
        internalStatus: request.query.internalStatus,
        severity: request.query.severity,
        assignedTo: request.query.assignedTo,
        search: request.query.search
      };
      
      const pagination = {
        page: parseInt(request.query.page) || 1,
        pageSize: parseInt(request.query.pageSize) || 10
      };
      
      const vulnerabilities = await vulnService.getAll(filters, pagination);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerability by ID
  fastify.get('/vulns/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const vulnerability = await vulnService.getById(id);
      if (!vulnerability) {
        return reply.code(404).send({ error: 'Not found', message: 'Vulnerability not found' });
      }
      return vulnerability;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Create new vulnerability (Admin, Security only)
  fastify.post('/vulns', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const vulnData = request.body;
      
      // Validate required fields
      if (!vulnData.title || !vulnData.description || !vulnData.severity || !vulnData.applicationId) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Title, description, severity, and application ID are required' 
        });
      }

      const vulnerability = await vulnService.create(vulnData);
      reply.code(201).send(vulnerability);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update vulnerability
  fastify.patch('/vulns/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      // Check if user has permission to update this vulnerability
      const currentVuln = await vulnService.getById(id);
      if (!currentVuln) {
        return reply.code(404).send({ error: 'Not found', message: 'Vulnerability not found' });
      }

      // Only Admin, Security, or assigned user can update
      const canUpdate = ['Admin', 'Security'].includes(request.user.role) || 
                       currentVuln.assignedToUserId === request.user.id;
      
      if (!canUpdate) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'You do not have permission to update this vulnerability' 
        });
      }
      
      const vulnerability = await vulnService.update(id, updateData);
      return vulnerability;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Delete vulnerability (Admin, Security only)
  fastify.delete('/vulns/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await vulnService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'Vulnerability not found' });
      }
      
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities by application
  fastify.get('/vulns/application/:applicationId', async (request, reply) => {
    try {
      const { applicationId } = request.params;
      const vulnerabilities = await vulnService.getByApplication(applicationId);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities by report
  fastify.get('/vulns/report/:reportId', async (request, reply) => {
    try {
      const { reportId } = request.params;
      const vulnerabilities = await vulnService.getByReport(reportId);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities by status
  fastify.get('/vulns/status/:status', async (request, reply) => {
    try {
      const { status } = request.params;
      const vulnerabilities = await vulnService.getByStatus(status);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities by severity
  fastify.get('/vulns/severity/:severity', async (request, reply) => {
    try {
      const { severity } = request.params;
      const vulnerabilities = await vulnService.getBySeverity(severity);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities by assignee
  fastify.get('/vulns/assigned/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const vulnerabilities = await vulnService.getByAssignee(userId);
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get overdue vulnerabilities
  fastify.get('/vulns/overdue', async (request, reply) => {
    try {
      const vulnerabilities = await vulnService.getOverdue();
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerabilities due this week
  fastify.get('/vulns/due-this-week', async (request, reply) => {
    try {
      const vulnerabilities = await vulnService.getDueThisWeek();
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get upcoming retests
  fastify.get('/vulns/upcoming-retests', async (request, reply) => {
    try {
      const vulnerabilities = await vulnService.getUpcomingRetests();
      return vulnerabilities;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get vulnerability statistics
  fastify.get('/vulns/stats', async (request, reply) => {
    try {
      const stats = await vulnService.getStats();
      return stats;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Bulk create vulnerabilities (Admin, Security only)
  fastify.post('/vulns/bulk', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { vulnerabilities } = request.body;
      
      if (!Array.isArray(vulnerabilities) || vulnerabilities.length === 0) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Vulnerabilities array is required and must not be empty' 
        });
      }

      const createdVulns = [];
      for (const vulnData of vulnerabilities) {
        if (!vulnData.title || !vulnData.description || !vulnData.severity || !vulnData.applicationId) {
          return reply.code(400).send({ 
            error: 'Bad request', 
            message: 'Each vulnerability must have title, description, severity, and application ID' 
          });
        }
        
        const vulnerability = await vulnService.create(vulnData);
        createdVulns.push(vulnerability);
      }

      reply.code(201).send(createdVulns);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
} 