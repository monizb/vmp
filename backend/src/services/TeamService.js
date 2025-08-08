import { getDatabase } from '../config/database.js';
import { Team } from '../models/Team.js';
import { ObjectId } from 'mongodb';

export class TeamService {
  constructor() {
    this.collectionName = 'teams';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getAll() {
    const collection = await this.getCollection();
    const teams = await collection.find({}).toArray();
    return teams.map(team => Team.fromMongo(team).toJSON());
  }

  async getById(id) {
    const collection = await this.getCollection();
    const team = await collection.findOne({ _id: new ObjectId(id) });
    return team ? Team.fromMongo(team).toJSON() : null;
  }

  async create(teamData) {
    const collection = await this.getCollection();
    const team = new Team(teamData);
    const result = await collection.insertOne(team.toMongo());
    return Team.fromMongo({ ...team.toMongo(), _id: result.insertedId }).toJSON();
  }

  async update(id, teamData) {
    const collection = await this.getCollection();
    const updateData = {
      ...teamData,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result.value ? Team.fromMongo(result.value).toJSON() : null;
  }

  async delete(id) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getByPlatform(platform) {
    const collection = await this.getCollection();
    const teams = await collection.find({ platform }).toArray();
    return teams.map(team => Team.fromMongo(team).toJSON());
  }
} 