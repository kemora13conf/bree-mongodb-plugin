import type { Connection, Model, Mongoose } from 'mongoose';
import type { Db, MongoClient } from 'mongodb';
import type Bree from 'bree';
import { LoggerOptions } from 'pino';
export interface MongoDBPluginOptions {
    mongoose?: Mongoose;
    connection?: Connection;
    mongoClient?: MongoClient;
    db?: Db;
    uri?: string;
    dbName?: string;
    collectionName?: string;
    loggerOptions?: LoggerOptions | boolean;
}
export interface JobDocument {
    _id: string;
    name: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'scheduled' | string;
    schedule?: string;
    lastRun?: Date;
    error?: any;
    output?: any;
    path?: string;
    timeout?: number | string | boolean | undefined;
    worker?: any;
    date?: Date;
}
export interface JobDocumentModel extends Model<JobDocument> {
}
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
