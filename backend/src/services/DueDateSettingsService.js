import { getDatabase } from '../config/database.js';
import { DueDateSettings } from '../models/DueDateSettings.js';
import { ObjectId } from 'mongodb';

export class DueDateSettingsService {
  constructor() {
    this.collectionName = 'dueDateSettings';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getSettings() {
    const collection = await this.getCollection();
    const settings = await collection.findOne({});
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = new DueDateSettings();
      const result = await collection.insertOne(defaultSettings.toMongo());
      return defaultSettings.toJSON();
    }
    
    return DueDateSettings.fromMongo(settings).toJSON();
  }

  async updateSettings(settingsData) {
    const collection = await this.getCollection();
    const updateData = {
      ...settingsData,
      updatedAt: new Date()
    };

    const result = await collection.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        returnDocument: 'after',
        upsert: true
      }
    );

    return result.value ? DueDateSettings.fromMongo(result.value).toJSON() : new DueDateSettings(updateData).toJSON();
  }

  async calculateDueDate(severity, discoveredDate = new Date()) {
    const settings = await this.getSettings();
    const dueDateSettings = DueDateSettings.fromMongo(settings);
    return dueDateSettings.calculateDueDate(severity, discoveredDate);
  }
}