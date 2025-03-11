import { IDatabaseConnection, JobDocument } from './types';
import Bree from 'bree';
export declare class JobRepository {
    private dbConnection;
    constructor(dbConnection: IDatabaseConnection);
    getJob(name: string): Promise<JobDocument | null>;
    updateJob(name: string, data: Partial<JobDocument>): Promise<void>;
    createJob(job: Bree.JobOptions): Promise<void>;
    deleteJob(name: string): Promise<void>;
    getAllJobs(): Promise<JobDocument[]>;
}
