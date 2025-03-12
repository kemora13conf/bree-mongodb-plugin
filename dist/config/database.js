"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseConnection = createDatabaseConnection;
const mongoose_1 = require("mongoose");
const _1 = require(".");
// Mongoose implementation
class MongooseDatabaseConnection {
    constructor(config) {
        this.mongoose = config.mongoose;
        this.connection = config.connection || this.mongoose.connection; // Use existing connection or default
        this.collectionName = config.collectionName;
        const jobSchema = new mongoose_1.Schema({
            _id: { type: String, required: true },
            name: { type: String, required: true },
            status: { type: String, required: true },
            schedule: { type: String },
            lastRun: { type: Date },
            error: { type: mongoose_1.Schema.Types.Mixed },
            output: { type: mongoose_1.Schema.Types.Mixed },
            path: { type: String },
            timeout: { type: mongoose_1.Schema.Types.Mixed },
            worker: { type: mongoose_1.Schema.Types.Mixed },
            date: { type: Date }
        }, { timestamps: true, collection: this.collectionName });
        // Ensure the model is only created once
        try {
            this.JobModel = this.connection.model('Job', jobSchema);
            // Make sure the collection is created if it doesn't exist
            this.connection.createCollection(this.collectionName);
        }
        catch (error) {
            // If the model has already been compiled, re-throw any other error
            if (error.name !== 'OverwriteModelError') {
                throw error;
            }
        }
        this.JobModel = this.connection.model('Job');
    }
    async connect() {
        if (this.connection.readyState === 0) { // 0 = disconnected
            if (!this.mongoose)
                throw new Error('Mongoose instance is required to connect');
            await this.mongoose.connect(this.collectionName);
        }
    }
    async disconnect() {
        //Don't close the connection, let the user handle
        //if (this.connection.readyState === 1) {  // 1 = connected
        //  await this.connection.close();
        //}
    }
    async getJob(name) {
        return this.JobModel.findById(name).exec();
    }
    async updateJob(name, data) {
        await this.JobModel.findByIdAndUpdate(name, data, { upsert: true }).exec();
    }
    async createJob(job) {
        await this.JobModel.create(job);
    }
    async deleteJob(name) {
        await this.JobModel.findByIdAndDelete(name).exec();
    }
    async getAllJobs() {
        return await this.JobModel.find().exec();
    }
}
// Native MongoDB Driver implementation
class MongoDriverDatabaseConnection {
    constructor(config) {
        if (!config.mongoClient && !config.db && !config.uri) {
            throw new Error('MongoClient, db, or uri is required.');
        }
        this.client = config.mongoClient;
        this.db = config.db || this.client.db(config.dbName);
        this.collectionName = config.collectionName;
    }
    async connect() {
        try {
            await this.client.db().command({ ping: 1 });
        }
        catch (error) {
            if (!this.client)
                throw new Error("MongoClient instance is required to connect");
            await this.client.connect();
        }
    }
    async disconnect() {
        //Don't close the connection, let the user handle
        //await this.client.close();
    }
    async getJob(name) {
        return this.db.collection(this.collectionName).findOne({ _id: name });
    }
    async updateJob(name, data) {
        await this.db.collection(this.collectionName).updateOne({ _id: name }, { $set: data }, { upsert: true });
    }
    async createJob(job) {
        await this.db.collection(this.collectionName).insertOne(job);
    }
    async deleteJob(name) {
        await this.db.collection(this.collectionName).deleteOne({ _id: name });
    }
    async getAllJobs() {
        return await this.db.collection(this.collectionName).find().toArray();
    }
}
async function createDatabaseConnection(options) {
    const config = (0, _1.validateAndNormalizeConfig)(options);
    let connection;
    if (config.mongoose || config.connection) {
        connection = new MongooseDatabaseConnection(config);
    }
    else {
        connection = new MongoDriverDatabaseConnection(config);
    }
    await connection.connect();
    return connection;
}
