"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
class JobRepository {
    constructor(dbConnection) {
        this.dbConnection = dbConnection;
    }
    async getJob(name) {
        return this.dbConnection.getJob(name);
    }
    async updateJob(name, data) {
        await this.dbConnection.updateJob(name, data);
    }
    async createJob(job) {
        var _a;
        const jobDoc = {
            _id: job.name,
            name: job.name,
            status: 'pending', // Initial status
            schedule: typeof job.interval === 'string' ? job.interval : '',
            path: typeof job.path === 'string' ? job.path : (_a = job === null || job === void 0 ? void 0 : job.path) === null || _a === void 0 ? void 0 : _a.toString(),
            timeout: job.timeout,
            worker: job.worker,
            date: job.date,
        };
        await this.dbConnection.createJob(jobDoc);
    }
    async deleteJob(name) {
        await this.dbConnection.deleteJob(name);
    }
    async getAllJobs() {
        return await this.dbConnection.getAllJobs();
    }
}
exports.JobRepository = JobRepository;
