"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobNotFoundError = exports.DatabaseConnectionError = void 0;
class DatabaseConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
class JobNotFoundError extends Error {
    constructor(jobName) {
        super(`Job not found: ${jobName}`);
        this.name = 'JobNotFoundError';
    }
}
exports.JobNotFoundError = JobNotFoundError;
// Add other custom errors as needed
