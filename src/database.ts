import { MongoClient, Db } from 'mongodb';
import { Connection, Mongoose, Schema, model } from 'mongoose';
import { IDatabaseConnection, JobDocument, JobDocumentModel, MongoDBPluginOptions } from './types';
import { validateAndNormalizeConfig } from './config';

// Mongoose implementation
class MongooseDatabaseConnection implements IDatabaseConnection {
    private mongoose: Mongoose;
    private connection: Connection;
    private JobModel: ReturnType<typeof model<JobDocument, JobDocumentModel>>;
    private collectionName: string;

    constructor(config: Required<Omit<MongoDBPluginOptions, 'mongoClient' | 'db'>>) {
        this.mongoose = config.mongoose!;
        this.connection = config.connection || this.mongoose.connection; // Use existing connection or default
        this.collectionName = config.collectionName;

        const jobSchema = new Schema<JobDocument>({
            _id: { type: String, required: true },
            name: { type: String, required: true },
            status: { type: String, required: true },
            schedule: { type: String },
            lastRun: { type: Date },
            error: { type: Schema.Types.Mixed },
            output: { type: Schema.Types.Mixed },
            path: { type: String },
            timeout: { type: Schema.Types.Mixed },
            worker: { type: Schema.Types.Mixed },
            date: { type: Date }
        }, { timestamps: true });

        // Ensure the model is only created once
        try {
            this.JobModel = this.connection.model<JobDocument>('Job', jobSchema);
        } catch (error: any) {
            // If the model has already been compiled, re-throw any other error
            if (error.name !== 'OverwriteModelError') {
                throw error;
            }
        }
        this.JobModel = this.connection.model<JobDocument>('Job');
    }

    async connect(): Promise<void> {
        if (this.connection.readyState === 0) {  // 0 = disconnected
            if (!this.mongoose) throw new Error('Mongoose instance is required to connect');
            await this.mongoose.connect(this.collectionName);
        }
    }

    async disconnect(): Promise<void> {
        //Don't close the connection, let the user handle
        //if (this.connection.readyState === 1) {  // 1 = connected
        //  await this.connection.close();
        //}
    }

    async getJob(name: string): Promise<JobDocument | null> {
        return this.JobModel.findById(name).exec();
    }

    async updateJob(name: string, data: Partial<JobDocument>): Promise<void> {
        await this.JobModel.findByIdAndUpdate(name, data, { upsert: true }).exec();
    }

    async createJob(job: JobDocument): Promise<void> {
        await this.JobModel.create(job);
    }

    async deleteJob(name: string): Promise<void> {
        await this.JobModel.findByIdAndDelete(name).exec();
    }
    async getAllJobs(): Promise<JobDocument[]> {
        return await this.JobModel.find().exec();
    }
}

// Native MongoDB Driver implementation
class MongoDriverDatabaseConnection implements IDatabaseConnection {
    private client: MongoClient;
    private db: Db;
    private collectionName: string;

    constructor(config: Required<Omit<MongoDBPluginOptions, 'mongoose' | 'connection'>>) {
        if (!config.mongoClient && !config.db && !config.uri) {
            throw new Error('MongoClient, db, or uri is required.');
        }

        this.client = config.mongoClient!;
        this.db = config.db! || this.client.db(config.dbName);
        this.collectionName = config.collectionName;

    }

    async connect(): Promise<void> {
        try {
            await this.client.db().command({ ping: 1 });
        } catch (error) {
            if (!this.client) throw new Error("MongoClient instance is required to connect");
            await this.client.connect();
        }
    }

    async disconnect(): Promise<void> {
        //Don't close the connection, let the user handle
        //await this.client.close();
    }
    async getJob(name: string): Promise<JobDocument | null> {
        return this.db.collection<JobDocument>(this.collectionName).findOne({ _id: name });
    }
    async updateJob(name: string, data: Partial<JobDocument>): Promise<void> {
        await this.db.collection<JobDocument>(this.collectionName).updateOne({ _id: name }, { $set: data }, { upsert: true });
    }
    async createJob(job: JobDocument): Promise<void> {
        await this.db.collection<JobDocument>(this.collectionName).insertOne(job);
    }
    async deleteJob(name: string): Promise<void> {
        await this.db.collection<JobDocument>(this.collectionName).deleteOne({ _id: name });
    }
    async getAllJobs(): Promise<JobDocument[]> {
        return await this.db.collection<JobDocument>(this.collectionName).find().toArray();
    }

}

export async function createDatabaseConnection(options: MongoDBPluginOptions): Promise<IDatabaseConnection> {
    const config = validateAndNormalizeConfig(options);
    let connection: IDatabaseConnection;

    if (config.mongoose || config.connection) {
        connection = new MongooseDatabaseConnection(config as Required<Omit<MongoDBPluginOptions, 'mongoClient' | 'db'>>);
    } else {
        connection = new MongoDriverDatabaseConnection(config as Required<Omit<MongoDBPluginOptions, 'mongoose' | 'connection'>>);
    }

    await connection.connect();
    return connection;
}