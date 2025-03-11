import { IDatabaseConnection, JobDocument } from './types';
import Bree from 'bree';

export class JobRepository {
    private dbConnection: IDatabaseConnection;

    constructor(dbConnection: IDatabaseConnection) {
        this.dbConnection = dbConnection;
    }

    async getJob(name: string): Promise<JobDocument | null> {
        return this.dbConnection.getJob(name);
    }

    async updateJob(name: string, data: Partial<JobDocument>): Promise<void> {
        await this.dbConnection.updateJob(name, data);
    }

    async createJob(job: Bree.JobOptions): Promise<void> {
        const jobDoc: JobDocument = {
            _id: job.name,
            name: job.name,
            status: 'pending',  // Initial status
            schedule: typeof job.interval === 'string' ? job.interval : '',
            path: typeof job.path === 'string' ? job.path : job?.path?.toString(),
            timeout: job.timeout,
            worker: job.worker,
            date: job.date,
        }
        await this.dbConnection.createJob(jobDoc);
    }

    async deleteJob(name: string): Promise<void> {
        await this.dbConnection.deleteJob(name);
    }

    async getAllJobs(): Promise<JobDocument[]> {
        return await this.dbConnection.getAllJobs();
    }
}