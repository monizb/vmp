import { ObjectId } from 'mongodb';

export class Report {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.driveFileId = data.driveFileId || '';
    this.fileName = data.fileName || '';
    this.vendorName = data.vendorName || '';
    this.applicationId = data.applicationId ? new ObjectId(data.applicationId) : null;
    this.dateUploaded = data.dateUploaded || new Date();
    this.reportDate = data.reportDate || null;
    this.parsed = data.parsed || false;
    this.vulnerabilityIds = data.vulnerabilityIds || [];
    this.reportType = data.reportType || 'initial'; // 'initial' or 'reconfirmatory'
    this.originalReportId = data.originalReportId ? new ObjectId(data.originalReportId) : null; // For reconfirmatory reports
    this.reconfirmatoryReports = data.reconfirmatoryReports || []; // Array of reconfirmatory report IDs
    this.year = data.year || new Date().getFullYear();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new Report({
      _id: doc._id,
      driveFileId: doc.driveFileId,
      fileName: doc.fileName,
      vendorName: doc.vendorName,
      applicationId: doc.applicationId,
      dateUploaded: doc.dateUploaded,
      reportDate: doc.reportDate,
      parsed: doc.parsed,
      vulnerabilityIds: doc.vulnerabilityIds,
      reportType: doc.reportType,
      originalReportId: doc.originalReportId,
      reconfirmatoryReports: doc.reconfirmatoryReports,
      year: doc.year,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      driveFileId: this.driveFileId,
      fileName: this.fileName,
      vendorName: this.vendorName,
      applicationId: this.applicationId,
      dateUploaded: this.dateUploaded,
      reportDate: this.reportDate,
      parsed: this.parsed,
      vulnerabilityIds: this.vulnerabilityIds,
      reportType: this.reportType,
      originalReportId: this.originalReportId,
      reconfirmatoryReports: this.reconfirmatoryReports,
      year: this.year,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      driveFileId: this.driveFileId,
      fileName: this.fileName,
      vendorName: this.vendorName,
      applicationId: this.applicationId ? this.applicationId.toString() : null,
      dateUploaded: this.dateUploaded,
      reportDate: this.reportDate,
      parsed: this.parsed,
      vulnerabilityIds: this.vulnerabilityIds,
      reportType: this.reportType,
      originalReportId: this.originalReportId ? this.originalReportId.toString() : null,
      reconfirmatoryReports: this.reconfirmatoryReports,
      year: this.year,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 