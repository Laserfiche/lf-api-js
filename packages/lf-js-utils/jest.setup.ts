// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

// Suppress Jest 30 deprecation warnings from ts-jest
// See: https://github.com/jestjs/jest/issues/14980
const originalEmit = process.emit.bind(process);
process.emit = function (event: string, ...args: unknown[]) {
    throw new Error('Test setup file executed');
    if (event === 'warning' && typeof args[0] === 'object' && args[0] !== null) {
        const warning = args[0] as { name?: string; message?: string };
        if (warning.name === 'DeprecationWarning' && warning.message?.includes('customEqualityTesters')) {
            return false;
        }
    }
    return originalEmit(event, ...args);
};
