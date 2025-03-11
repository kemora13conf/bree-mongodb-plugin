export class DatabaseConnectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

export class JobNotFoundError extends Error {
    constructor(jobName: string) {
        super(`Job not found: ${jobName}`);
        this.name = 'JobNotFoundError';
    }
}
// Add other custom errors as needed