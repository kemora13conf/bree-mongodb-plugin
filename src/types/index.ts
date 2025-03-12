import type { Connection, Model, Mongoose } from 'mongoose';
import type { Db, MongoClient } from 'mongodb';
import type Bree from 'bree';
import { LoggerOptions } from 'pino';

export interface MongoDBPluginOptions {
    mongoose?: Mongoose; // Optional Mongoose instance
    connection?: Connection; //Optional mongoose connection
    mongoClient?: MongoClient; // Optional MongoDB client
    db?: Db; // Optional MongoDB Db instance
    uri?: string; // MongoDB connection URI
    dbName?: string; // Database name
    collectionName?: string; // Collection name (default: 'bree_jobs')
    loggerOptions?: LoggerOptions | boolean; // Pino logger options (or `true` for default)
    // Add other options as needed, e.g., connection options, timeouts, etc.
}

export interface JobDocument {
    _id: string; // Job name (Bree's unique identifier)
    name: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'scheduled' | string;
    schedule?: string; //cron, date or human readable schedule
    lastRun?: Date;
    error?: any; // Store error details
    output?: any; // Optionally store job output (consider size limitations)
    path?: string; // job's path
    timeout?: number | string | boolean | undefined;
    worker?: any;
    date?: Date;
}
export interface JobDocumentModel extends Model<JobDocument>{};

export interface IDatabaseConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getJob(name: string): Promise<JobDocument | null>;
    updateJob(name: string, data: Partial<JobDocument>): Promise<void>;
    createJob(job: JobDocument): Promise<void>;
    deleteJob(name: string): Promise<void>;
    getAllJobs(): Promise<JobDocument[]>;
}

export interface BreeWithEvents extends Bree {
    on(event: 'job created', listener: (jobOptions: Bree.JobOptions) => void): this;
    on(event: 'job started', listener: (name: string) => void): this;
    on(event: 'job completed', listener: (name: string) => void): this;
    on(event: 'job failed', listener: (name: string, err: Error) => void): this;
    on(event: 'job cancelled', listener: (name: string) => void): this;
    on(event: 'job deleted', listener: (name: string) => void): this;
}
