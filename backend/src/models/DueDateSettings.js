import { ObjectId } from 'mongodb';

export class DueDateSettings {
  constructor(data = {}) {
    this._id = data._id ? new ObjectId(data._id) : new ObjectId();
    this.autoAssignDueDates = data.autoAssignDueDates !== undefined ? data.autoAssignDueDates : true;
    this.dueDateTimelines = data.dueDateTimelines || {
      Critical: 15,
      High: 30,
      Medium: 60,
      Low: 60
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromMongo(doc) {
    if (!doc) return null;
    return new DueDateSettings({
      _id: doc._id,
      autoAssignDueDates: doc.autoAssignDueDates,
      dueDateTimelines: doc.dueDateTimelines,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toMongo() {
    return {
      _id: this._id,
      autoAssignDueDates: this.autoAssignDueDates,
      dueDateTimelines: this.dueDateTimelines,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toJSON() {
    return {
      id: this._id.toString(),
      autoAssignDueDates: this.autoAssignDueDates,
      dueDateTimelines: this.dueDateTimelines,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  calculateDueDate(severity, discoveredDate = new Date()) {
    if (!this.autoAssignDueDates) {
      return null;
    }

    const timelineDays = this.dueDateTimelines[severity];
    if (!timelineDays) {
      return null;
    }

    const dueDate = new Date(discoveredDate);
    dueDate.setDate(dueDate.getDate() + timelineDays);
    return dueDate;
  }
}