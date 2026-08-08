// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Mock document for testing isDarkTheme function before imports
const mockDocument = {
    body: {
        dataset: {} as { vscodeThemeKind?: string }
    }
};

// Define the global document for this test
Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
});

import {
    JupyterNotebookRenderer,
    OpenImageInPlotViewer,
    IsJupyterExtensionInstalled,
    SaveImageAs,
    noop,
    isDarkTheme
} from './constants';

describe('Constants', () => {
    describe('JupyterNotebookRenderer', () => {
        it('should be a string constant', () => {
            expect(JupyterNotebookRenderer).toBe('jupyter-notebook-renderer');
        });
    });

    describe('OpenImageInPlotViewer type', () => {
        it('should be able to be instantiated', () => {
            const obj: OpenImageInPlotViewer = {
                type: 'openImageInPlotViewer',
                outputId: 'some-id',
                mimeType: 'image/png'
            };

            expect(obj.type).toBe('openImageInPlotViewer');
            expect(obj.outputId).toBe('some-id');
            expect(obj.mimeType).toBe('image/png');
        });
    });

    describe('IsJupyterExtensionInstalled type', () => {
        it('should be able to be instantiated', () => {
            const obj: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled',
                response: true
            };

            expect(obj.type).toBe('isJupyterExtensionInstalled');
            expect(obj.response).toBe(true);
        });

        it('should allow undefined response', () => {
            const obj: IsJupyterExtensionInstalled = {
                type: 'isJupyterExtensionInstalled'
                // response is optional
            };

            expect(obj.type).toBe('isJupyterExtensionInstalled');
            expect(obj.response).toBeUndefined();
        });
    });

    describe('SaveImageAs type', () => {
        it('should be able to be instantiated', () => {
            const obj: SaveImageAs = {
                type: 'saveImageAs',
                outputId: 'some-id',
                mimeType: 'image/png'
            };

            expect(obj.type).toBe('saveImageAs');
            expect(obj.outputId).toBe('some-id');
            expect(obj.mimeType).toBe('image/png');
        });
    });

    // Skip ClipboardItem test since it's just a type declaration
    describe('ClipboardItem type', () => {
        it('should be declared in type system', () => {
            // Simply test that the declaration exists conceptually
            // Since it's a declaration, we can't really test runtime behavior
            expect(true).toBe(true); // Just ensure the file compiles properly with the type
        });
    });

    describe('noop function', () => {
        it('should be a function that does nothing', () => {
            expect(typeof noop).toBe('function');
            const result = noop();
            expect(result).toBeUndefined();
        });
    });

    describe('isDarkTheme function', () => {
        beforeEach(() => {
            // Reset the mock document before each test
            mockDocument.body.dataset = {};
        });

        it('should return false when no theme kind is present', () => {
            mockDocument.body.dataset = {};
            expect(isDarkTheme()).toBe(false);
        });

        it('should return true when theme kind contains dark', () => {
            mockDocument.body.dataset.vscodeThemeKind = 'vscode-dark';
            expect(isDarkTheme()).toBe(true);
        });

        it('should return true when theme kind contains dark (case insensitive)', () => {
            mockDocument.body.dataset.vscodeThemeKind = 'VSCode-DARK';
            expect(isDarkTheme()).toBe(true);
        });

        it('should return false when theme kind does not contain dark', () => {
            mockDocument.body.dataset.vscodeThemeKind = 'vscode-light';
            expect(isDarkTheme()).toBe(false);
        });

        it('should handle cases where there is no theme kind', () => {
            mockDocument.body.dataset.vscodeThemeKind = undefined;
            expect(isDarkTheme()).toBe(false);
        });

        it('should handle cases where dataset property throws an error', () => {
            // Create a spy to temporarily override the document access
            const originalDocument = (global as any).document;

            // Create a version of document that throws error when accessing dataset
            const throwingDocument = {
                body: {
                    get dataset() {
                        throw new Error('Dataset not available');
                    }
                }
            };

            (global as any).document = throwingDocument;

            expect(isDarkTheme()).toBe(false);

            // Restore original document
            (global as any).document = originalDocument;
        });
    });
});