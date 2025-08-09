// Core data models for the Vulnerability Management Platform

export const Platform = {
  Web: 'Web',
  iOS: 'iOS',
  Android: 'Android',
};

export const Severity = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
};

export const VulnStatus = {
  New: 'New',
  Open: 'Open',
  InProgress: 'In Progress',
  Fixed: 'Fixed',
  Reopened: 'Reopened',
  Closed: 'Closed',
};

// Internal workflow statuses for tracking progress outside of vendor-facing statuses
export const InternalStatusOptions = [
  'Stuck',
  'Fix in progress',
  'False positive',
  'Exemption requested',
];

export const Role = {
  Admin: 'Admin',
  Security: 'Security',
  Dev: 'Dev',
  ProductOwner: 'ProductOwner',
};

export const SeverityColors = {
  [Severity.Low]: '#4caf50',
  [Severity.Medium]: '#ff9800',
  [Severity.High]: '#f44336',
  [Severity.Critical]: '#9c27b0',
};

export const StatusColors = {
  [VulnStatus.New]: '#2196f3',
  [VulnStatus.Open]: '#ff9800',
  [VulnStatus.InProgress]: '#9c27b0',
  [VulnStatus.Fixed]: '#4caf50',
  [VulnStatus.Reopened]: '#f44336',
  [VulnStatus.Closed]: '#757575',
};

export const InternalStatusColors = {
  'Stuck': '#c62828',
  'Fix in progress': '#6a1b9a',
  'False positive': '#2e7d32',
  'Exemption requested': '#ef6c00',
};

export class Team {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.platform = data.platform || Platform.Web;
    this.applicationIds = data.applicationIds || [];
  }
}

export class Application {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.platform = data.platform || Platform.Web;
    this.teamId = data.teamId || '';
    this.description = data.description || '';
  }
}

export class Report {
  constructor(data = {}) {
    this.id = data.id || '';
    this.driveFileId = data.driveFileId || '';
    this.fileName = data.fileName || '';
    this.vendorName = data.vendorName || '';
    this.applicationId = data.applicationId || '';
    this.dateUploaded = data.dateUploaded || new Date().toISOString();
    this.reportDate = data.reportDate || '';
    this.parsed = data.parsed || false;
    this.vulnerabilityIds = data.vulnerabilityIds || [];
  }
}

export class Vulnerability {
  constructor(data = {}) {
    this.id = data.id || '';
    this.applicationId = data.applicationId || '';
    this.reportId = data.reportId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.severity = data.severity || Severity.Medium;
    this.cvssScore = data.cvssScore || null;
    this.cvssVector = data.cvssVector || '';
    this.cwe = data.cwe || [];
    this.cve = data.cve || [];
    this.status = data.status || VulnStatus.New;
    this.internalStatus = data.internalStatus || '';
    this.discoveredDate = data.discoveredDate || new Date().toISOString();
    this.dueDate = data.dueDate || '';
    this.resolvedDate = data.resolvedDate || '';
    this.assignedToUserId = data.assignedToUserId || '';
    this.tags = data.tags || [];
  }
}

export class User {
  constructor(data = {}) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.name = data.name || '';
    this.role = data.role || Role.Dev;
    this.teamIds = data.teamIds || [];
  }
}

export class PaginatedResponse {
  constructor(data = {}) {
    this.items = data.items || [];
    this.total = data.total || 0;
    this.page = data.page || 1;
    this.pageSize = data.pageSize || 10;
  }
} 