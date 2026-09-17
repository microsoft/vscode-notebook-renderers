// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { activate } from './preload';

describe('Preload Module', () => {
    describe('activate', () => {
        test('should be a function', () => {
            expect(activate).toBeDefined();
            expect(typeof activate).toBe('function');
        });

        test('should return a promise when called', async () => {
            const result = activate();
            expect(result).toBeInstanceOf(Promise);
            await result; // Ensure the promise resolves without error
        });

        test('should be an async function', async () => {
            const result = activate();
            expect(result).toBeInstanceOf(Promise);
            // Check that calling the function returns a promise (indicating it's async)
            await result;
        });

        test('should resolve successfully without throwing', async () => {
            await expect(activate()).resolves.not.toThrow();
        });

        test('should be callable multiple times without issues', async () => {
            await expect(activate()).resolves.not.toThrow();
            await expect(activate()).resolves.not.toThrow();
            await expect(activate()).resolves.not.toThrow();
        });
    });
});