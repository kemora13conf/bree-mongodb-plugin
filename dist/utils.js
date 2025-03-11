"use strict";
// Placeholder for utility functions.  In a real application, you'd use a
// proper logging library here.
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(message, ...args) {
    console.log(`[Bree MongoDB Plugin]: ${message}`, ...args);
}
