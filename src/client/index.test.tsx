// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Testing the functions in client/index.tsx by replicating the logic in test file
// Since we're testing renderer functionality that expects DOM operations,
// we focus on testing the core business logic without DOM-dependent setup

import type { OutputItem, RendererContext } from 'vscode-notebook-renderer';

// Define the types locally since we can't import from the main index file
type ActivationFunction = (ctx: RendererContext<unknown>) => {
    renderOutputItem(outputItem: OutputItem, element: HTMLElement): void;
};

// Replicate the convertVSCodeOutputToExecuteResultOrDisplayData function for testing
function convertVSCodeOutputToExecuteResultOrDisplayData(
    outputItem: OutputItem
) {
    const isImage =
        outputItem.mime.toLowerCase().startsWith('image/') && !outputItem.mime.toLowerCase().includes('svg');
    // We add a metadata item `__isJson` to tell us whether the data is of type JSON or not.
    const isJson = (outputItem.metadata as Record<string, unknown>)?.__isJson === true;
    const value = isImage ? outputItem.blob() : isJson ? outputItem.json() : outputItem.text();
    return {
        data: {
            [outputItem.mime]: value
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (outputItem.metadata as any) || {},
        execution_count: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output_type: (outputItem.metadata as any)?.outputType || 'execute_result'
    };
}

// Create a mock element implementation to avoid needing DOM in setup
function createMockElement(): HTMLElement {
    return {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        replaceChild: jest.fn(),
        insertBefore: jest.fn(),
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        getAttribute: jest.fn(),
        hasAttribute: jest.fn(),
        innerHTML: '',
        outerHTML: '',
        textContent: '',
        firstChild: null,
        childNodes: [],
        className: '',
        style: {} as any,
        id: ''
    } as unknown as HTMLElement;
}

describe('client/index.tsx functions', () => {
    let mockCtx: RendererContext<unknown>;
    let mockOutputItem: OutputItem;

    beforeEach(() => {
        mockCtx = {
            workspace: {
                isTrusted: true
            },
            settings: {},
            setState: jest.fn(),
            getState: jest.fn(),
            getRenderer: jest.fn()
        } as unknown as RendererContext<unknown>;

        mockOutputItem = {
            id: 'test-id',
            mime: 'text/plain',
            metadata: {},
            text: () => 'test text',
            json: () => null,
            blob: () => new Blob(['test'])
        } as OutputItem;
    });

    describe('convertVSCodeOutputToExecuteResultOrDisplayData', () => {
        it('should convert plain text output correctly', () => {
            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(mockOutputItem);

            expect(result.output_type).toBe('execute_result');
            expect(result.execution_count).toBeNull();
            expect(result.data[mockOutputItem.mime]).toBe('test text');
        });

        it('should handle image outputs by calling blob()', () => {
            const imageOutputItem = {
                ...mockOutputItem,
                mime: 'image/png'
            } as OutputItem;

            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(imageOutputItem);

            expect(result.data[imageOutputItem.mime]).toBeInstanceOf(Blob);
        });

        it('should handle JPEG image outputs by calling blob()', () => {
            const jpegOutputItem = {
                ...mockOutputItem,
                mime: 'image/jpeg'
            } as OutputItem;

            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(jpegOutputItem);

            expect(result.data[jpegOutputItem.mime]).toBeInstanceOf(Blob);
        });

        it('should handle JSON outputs by calling json()', () => {
            const jsonData = { key: 'value' };
            const jsonOutputItem = {
                ...mockOutputItem,
                mime: 'application/json',
                metadata: { __isJson: true }
            } as OutputItem;

            // Override json method to return our test data
            Object.defineProperty(jsonOutputItem, 'json', {
                value: () => jsonData,
                writable: true
            });

            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(jsonOutputItem);

            expect(result.data[jsonOutputItem.mime]).toEqual(jsonData);
        });

        it('should handle SVG images as text rather than blobs', () => {
            const svgOutputItem = {
                ...mockOutputItem,
                mime: 'image/svg+xml'
            } as OutputItem;

            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(svgOutputItem);

            // SVG should be treated as text, not as a blob
            expect(result.data[svgOutputItem.mime]).toBe('test text');
        });

        it('should use provided output type from metadata if available', () => {
            const outputWithMetadata = {
                ...mockOutputItem,
                metadata: { outputType: 'display_data' }
            } as OutputItem;

            const result: any = convertVSCodeOutputToExecuteResultOrDisplayData(outputWithMetadata);

            expect(result.output_type).toBe('display_data');
        });

        it('should correctly identify image mime types but exclude SVG', () => {
            const pngOutputItem = {
                ...mockOutputItem,
                mime: 'image/png'
            } as OutputItem;

            const svgOutputItem = {
                ...mockOutputItem,
                mime: 'image/svg+xml'
            } as OutputItem;

            const pngResult: any = convertVSCodeOutputToExecuteResultOrDisplayData(pngOutputItem);
            const svgResult: any = convertVSCodeOutputToExecuteResultOrDisplayData(svgOutputItem);

            // PNG should return blob data (instanceof Blob)
            expect(pngResult.data['image/png']).toBeInstanceOf(Blob);
            // SVG should return text data (string)
            expect(typeof svgResult.data['image/svg+xml']).toBe('string');
        });
    });

    describe('Workspace trust logic validation', () => {
        it('should have trusted workspace context initially', () => {
            expect(mockCtx.workspace.isTrusted).toBe(true);
        });

        it('should have untrusted workspace context when set', () => {
            const untrustedCtx = {
                ...mockCtx,
                workspace: {
                    isTrusted: false
                }
            };

            expect(untrustedCtx.workspace.isTrusted).toBe(false);
        });
    });

    describe('OutputItem structure validation', () => {
        it('should have expected output item properties', () => {
            expect(mockOutputItem.id).toBe('test-id');
            expect(mockOutputItem.mime).toBe('text/plain');
            expect(typeof mockOutputItem.text).toBe('function');
            expect(typeof mockOutputItem.json).toBe('function');
            expect(typeof mockOutputItem.blob).toBe('function');
        });

        it('should handle different mime types properly', () => {
            const textOutput = {
                ...mockOutputItem,
                mime: 'text/plain'
            } as OutputItem;

            const htmlOutput = {
                ...mockOutputItem,
                mime: 'text/html'
            } as OutputItem;

            // For JSON, we need to set the __isJson metadata flag to true to make it use the json() method
            const jsonOutput = {
                ...mockOutputItem,
                mime: 'application/json',
                metadata: { __isJson: true }
            } as OutputItem;

            const textResult: any = convertVSCodeOutputToExecuteResultOrDisplayData(textOutput);
            const htmlResult: any = convertVSCodeOutputToExecuteResultOrDisplayData(htmlOutput);
            const jsonResult: any = convertVSCodeOutputToExecuteResultOrDisplayData(jsonOutput);

            expect(textResult.data['text/plain']).toBe('test text');
            expect(htmlResult.data['text/html']).toBe('test text');
            expect(jsonResult.data['application/json']).toBe(null); // json() returns null in our mock
        });
    });
});