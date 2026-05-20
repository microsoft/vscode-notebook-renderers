// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
import {
    EXTENSION_ROOT_DIR,
    OpenImageInPlotViewer,
    IsJupyterExtensionInstalled,
    SaveImageAs
} from './constants';

describe('Constants', () => {
    describe('EXTENSION_ROOT_DIR', () => {
        it('should be a valid path', () => {
            expect(EXTENSION_ROOT_DIR).toBeDefined();
            expect(typeof EXTENSION_ROOT_DIR).toBe('string');
            expect(path.isAbsolute(EXTENSION_ROOT_DIR)).toBe(true);
        });

        it('should contain the expected parent directories', () => {
            // Check if it goes two levels up from __dirname
            const expectedPath = path.join(__dirname, '..', '..');
            expect(EXTENSION_ROOT_DIR).toEqual(expectedPath);
        });
    });

    describe('Types', () => {
        // Just checking that the types are properly defined
        it('OpenImageInPlotViewer should have correct structure', () => {
            // This is a type definition test - ensuring we can create objects matching the type
            const mockObject: OpenImageInPlotViewer = {
                type: 'openImageInPlotViewer',
                outputId: 'some-id',
                mimeType: 'image/png'
            };

            expect(mockObject.type).toBe('openImageInPlotViewer');
            expect(mockObject.outputId).toBe('some-id');
            expect(mockObject.mimeType).toBe('image/png');
        });

        it('IsJupyterExtensionInstalled should have correct structure', () => {
            // This is a type definition test - ensuring we can create objects matching the type
            const positiveResponse: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled',
                response: true
            };
            
            const negativeResponse: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled',
                response: false
            };
            
            const undefinedResponse: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled'
            };

            expect(positiveResponse.type).toBe('isJupyterExtensionInstalled');
            expect(positiveResponse.response).toBe(true);

            expect(negativeResponse.type).toBe('isJupyterExtensionInstalled');
            expect(negativeResponse.response).toBe(false);

            expect(undefinedResponse.type).toBe('isJupyterExtensionInstalled');
            expect(undefinedResponse.response).toBeUndefined();
        });

        it('SaveImageAs should have correct structure', () => {
            // This is a type definition test - ensuring we can create objects matching the type
            const mockObject: SaveImageAs = {
                type: 'saveImageAs',
                outputId: 'some-id',
                mimeType: 'image/png'
            };

            expect(mockObject.type).toBe('saveImageAs');
            expect(mockObject.outputId).toBe('some-id');
            expect(mockObject.mimeType).toBe('image/png');
        });
    });

    describe('Export Verification', () => {
        it('should export all expected constants and types', () => {
            expect(EXTENSION_ROOT_DIR).toBeDefined();

            // Verify that types can be used to create objects
            const openImageObj: OpenImageInPlotViewer = {
                type: 'openImageInPlotViewer',
                outputId: 'test',
                mimeType: 'image/png'
            };

            const isJupyterObj: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled',
                response: true
            };

            const saveImageObj: SaveImageAs = {
                type: 'saveImageAs',
                outputId: 'test',
                mimeType: 'image/png'
            };

            expect(openImageObj).toBeTruthy();
            expect(isJupyterObj).toBeTruthy();
            expect(saveImageObj).toBeTruthy();
        });
    });
});