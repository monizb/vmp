import { ReportService } from '../services/ReportService.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

export default async function reportRoutes(fastify, options) {
  const reportService = new ReportService();

  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateUser);

  // Get all reports with pagination
  fastify.get('/reports', async (request, reply) => {
    try {
      const filters = {
        applicationId: request.query.applicationId,
        parsed: request.query.parsed === 'true' ? true : request.query.parsed === 'false' ? false : undefined,
        reportType: request.query.reportType,
        year: request.query.year ? parseInt(request.query.year) : undefined
      };
      
      const pagination = {
        page: parseInt(request.query.page) || 1,
        pageSize: parseInt(request.query.pageSize) || 10
      };
      
      const reports = await reportService.getAll(filters, pagination);
      return reports;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get report by ID
  fastify.get('/reports/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const report = await reportService.getById(id);
      if (!report) {
        return reply.code(404).send({ error: 'Not found', message: 'Report not found' });
      }
      return report;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Create new report (Admin, Security only)
  fastify.post('/reports', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const reportData = request.body;
      
      // Validate required fields
      if (!reportData.fileName || !reportData.vendorName) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'File name and vendor name are required' 
        });
      }

      const report = await reportService.create(reportData);
      reply.code(201).send(report);
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Update report (Admin, Security only)
  fastify.patch('/reports/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const report = await reportService.update(id, updateData);
      if (!report) {
        return reply.code(404).send({ error: 'Not found', message: 'Report not found' });
      }
      
      return report;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Delete report (Admin, Security only)
  fastify.delete('/reports/:id', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await reportService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Not found', message: 'Report not found' });
      }
      
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Import report from Google Drive (Admin, Security only)
  fastify.post('/reports/import', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { driveFileId, applicationId, vendorName, reportType = 'initial', originalReportId } = request.body;
      
      if (!driveFileId || !applicationId || !vendorName) {
        return reply.code(400).send({ 
          error: 'Bad request', 
          message: 'Drive file ID, application ID, and vendor name are required' 
        });
      }

      // Mock import process - in real implementation, this would:
      // 1. Download file from Google Drive
      // 2. Parse PDF/Word document
      // 3. Extract vulnerabilities using NLP
      // 4. Create vulnerability records
      // 5. Mark report as parsed

      const reportData = {
        driveFileId,
        fileName: `VAPT_Report_${Date.now()}.pdf`,
        vendorName,
        applicationId,
        dateUploaded: new Date(),
        reportDate: new Date(),
        parsed: false,
        vulnerabilityIds: [],
        reportType,
        originalReportId,
        year: new Date().getFullYear()
      };

      const report = await reportService.create(reportData);
      
      // Simulate async processing
      setTimeout(async () => {
        try {
          await reportService.markAsParsed(report.id, ['vuln_1', 'vuln_2', 'vuln_3']);
        } catch (error) {
          console.error('Error marking report as parsed:', error);
        }
      }, 2000);

      reply.code(201).send({ 
        message: 'Import started', 
        jobId: `job_${Date.now()}`,
        report 
      });
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get reports by application
  fastify.get('/reports/application/:applicationId', async (request, reply) => {
    try {
      const { applicationId } = request.params;
      const reports = await reportService.getByApplication(applicationId);
      return reports;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get reports by year
  fastify.get('/reports/year/:year', async (request, reply) => {
    try {
      const { year } = request.params;
      const reports = await reportService.getByYear(parseInt(year));
      return reports;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Get reconfirmatory reports for a specific report
  fastify.get('/reports/:id/reconfirmatory', async (request, reply) => {
    try {
      const { id } = request.params;
      const reports = await reportService.getReconfirmatoryReports(id);
      return reports;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  // Mark report as parsed (Admin, Security only)
  fastify.patch('/reports/:id/parse', {
    preHandler: requireRole(['Admin', 'Security'])
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { vulnerabilityIds } = request.body;
      
      const report = await reportService.markAsParsed(id, vulnerabilityIds || []);
      if (!report) {
        return reply.code(404).send({ error: 'Not found', message: 'Report not found' });
      }
      
      return report;
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error', message: error.message });
    }
  });
} 