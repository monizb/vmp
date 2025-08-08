import { getDatabase } from '../config/database.js';
import { Report } from '../models/Report.js';
import { ObjectId } from 'mongodb';

export class ReportService {
  constructor() {
    this.collectionName = 'reports';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getAll(filters = {}, pagination = {}) {
    const collection = await this.getCollection();
    let query = {};
    
    if (filters.applicationId) {
      query.applicationId = new ObjectId(filters.applicationId);
    }
    
    if (filters.parsed !== undefined) {
      query.parsed = filters.parsed;
    }

    if (filters.reportType) {
      query.reportType = filters.reportType;
    }

    if (filters.year) {
      query.year = filters.year;
    }
    
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const skip = (page - 1) * pageSize;
    
    const [reports, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
      collection.countDocuments(query)
    ]);
    
    return {
      items: reports.map(report => Report.fromMongo(report).toJSON()),
      total,
      page,
      pageSize
    };
  }

  async getById(id) {
    const collection = await this.getCollection();
    const report = await collection.findOne({ _id: new ObjectId(id) });
    return report ? Report.fromMongo(report).toJSON() : null;
  }

  async create(reportData) {
    const collection = await this.getCollection();
    const report = new Report(reportData);
    const result = await collection.insertOne(report.toMongo());
    return Report.fromMongo({ ...report.toMongo(), _id: result.insertedId }).toJSON();
  }

  async update(id, reportData) {
    const collection = await this.getCollection();
    const updateData = {
      ...reportData,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result.value ? Report.fromMongo(result.value).toJSON() : null;
  }

  async delete(id) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getByApplication(applicationId) {
    const collection = await this.getCollection();
    const reports = await collection.find({ applicationId: new ObjectId(applicationId) }).sort({ createdAt: -1 }).toArray();
    return reports.map(report => Report.fromMongo(report).toJSON());
  }

  async getByYear(year) {
    const collection = await this.getCollection();
    const reports = await collection.find({ year }).sort({ createdAt: -1 }).toArray();
    return reports.map(report => Report.fromMongo(report).toJSON());
  }

  async getReconfirmatoryReports(reportId) {
    const collection = await this.getCollection();
    const reports = await collection.find({ 
      $or: [
        { originalReportId: new ObjectId(reportId) },
        { _id: new ObjectId(reportId) }
      ]
    }).sort({ createdAt: -1 }).toArray();
    return reports.map(report => Report.fromMongo(report).toJSON());
  }

  async markAsParsed(id, vulnerabilityIds = []) {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          parsed: true, 
          vulnerabilityIds,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result.value ? Report.fromMongo(result.value).toJSON() : null;
  }

  async getReportsByYearGrouped(applicationId) {
    const collection = await this.getCollection();
    const reports = await collection.find({ 
      applicationId: new ObjectId(applicationId) 
    }).sort({ year: -1, createdAt: -1 }).toArray();
    
    const groupedReports = {};
    reports.forEach(report => {
      const year = report.year || new Date(report.createdAt).getFullYear();
      if (!groupedReports[year]) {
        groupedReports[year] = [];
      }
      groupedReports[year].push(Report.fromMongo(report).toJSON());
    });
    
    return groupedReports;
  }
} 