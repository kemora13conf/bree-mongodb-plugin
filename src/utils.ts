// Placeholder for utility functions.  In a real application, you'd use a
// proper logging library here.

export function log(message: string, ...args: any[]): void {
    console.log(`[Bree MongoDB Plugin]: ${message}`, ...args);
}