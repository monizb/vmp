import { getDatabase } from '../config/database.js';
import { Application } from '../models/Application.js';
import { ObjectId } from 'mongodb';

export class ApplicationService {
  constructor() {
    this.collectionName = 'applications';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getAll(filters = {}) {
    const collection = await this.getCollection();
    let query = {};
    
    if (filters.teamId) {
      query.teamId = new ObjectId(filters.teamId);
    }
    
    if (filters.platform) {
      query.platform = filters.platform;
    }
    
    const applications = await collection.find(query).toArray();
    return applications.map(app => Application.fromMongo(app).toJSON());
  }

  async getById(id) {
    const collection = await this.getCollection();
    const application = await collection.findOne({ _id: new ObjectId(id) });
    return application ? Application.fromMongo(application).toJSON() : null;
  }

  async create(applicationData) {
    const collection = await this.getCollection();
    const application = new Application(applicationData);
    const result = await collection.insertOne(application.toMongo());
    return Application.fromMongo({ ...application.toMongo(), _id: result.insertedId }).toJSON();
  }

  async update(id, applicationData) {
    const collection = await this.getCollection();
    const updateData = {
      ...applicationData,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result.value ? Application.fromMongo(result.value).toJSON() : null;
  }

  async delete(id) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getByTeam(teamId) {
    const collection = await this.getCollection();
    const applications = await collection.find({ teamId: new ObjectId(teamId) }).toArray();
    return applications.map(app => Application.fromMongo(app).toJSON());
  }

  async getByPlatform(platform) {
    const collection = await this.getCollection();
    const applications = await collection.find({ platform }).toArray();
    return applications.map(app => Application.fromMongo(app).toJSON());
  }
} 