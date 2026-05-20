// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Mock the global variables needed by the module before importing
Object.defineProperty(global, 'scriptUrl', {
    value: 'http://localhost:8080/test.js',
    writable: true
});

// Mock __webpack_public_path__ to prevent errors during module evaluation
Object.defineProperty(global, '__webpack_public_path__', {
    value: '',
    writable: true
});

import { activate } from './builtinRendererHooks';

// Mock the vscode-notebook-renderer types
const mockOutputItem: any = {
    metadata: {
        metadata: {
            testMetadata: 'testValue'
        }
    }
};

const mockElement: HTMLElement = {
    id: 'test-element-id',
    classList: {
        add: jest.fn()
    },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    insertBefore: jest.fn(),
    remove: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    hasAttribute: jest.fn(),
    removeAttribute: jest.fn(),
} as any;

// Mock globalThis.$ and globalThis.jQuery
Object.defineProperty(globalThis, '$', {
    value: null,
    writable: true,
    configurable: true
});

Object.defineProperty(globalThis, 'jQuery', {
    value: null,
    writable: true,
    configurable: true
});

describe('builtinRendererHooks', () => {
    let mockCtx: any;
    let mockBuiltinRenderer: any;

    beforeEach(() => {
        // Reset global variables
        (globalThis as any).$ = undefined;
        (globalThis as any).jQuery = undefined;

        mockBuiltinRenderer = {
            experimental_registerHtmlRenderingHook: jest.fn(),
            experimental_registerJavaScriptRenderingHook: jest.fn()
        };

        mockCtx = {
            getRenderer: jest.fn().mockResolvedValue(mockBuiltinRenderer),
            postMessage: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('activate', () => {
        it('should register both HTML and JavaScript rendering hooks', async () => {
            await activate(mockCtx);

            expect(mockCtx.getRenderer).toHaveBeenCalledWith('vscode.builtin-renderer');
            expect(mockBuiltinRenderer.experimental_registerHtmlRenderingHook).toHaveBeenCalled();
            expect(mockBuiltinRenderer.experimental_registerJavaScriptRenderingHook).toHaveBeenCalled();
        });

        it('should throw an error when builtin renderer is not found', async () => {
            mockCtx.getRenderer.mockResolvedValue(null);

            await expect(activate(mockCtx)).rejects.toThrow('Could not find the built-in js renderer');
        });

        it('should handle errors when registering rendering hooks', async () => {
            mockBuiltinRenderer.experimental_registerHtmlRenderingHook.mockImplementation(() => {
                throw new Error('Registration error');
            });

            await expect(activate(mockCtx)).rejects.toThrow('Failed to register JavaScript rendering hook: Error: Registration error');
        });

        it('should add output_html class to element in HTML postRender hook', async () => {
            await activate(mockCtx);

            // Extract the registered HTML hook
            const htmlHook = (mockBuiltinRenderer.experimental_registerHtmlRenderingHook as jest.Mock).mock.calls[0][0];
            
            await htmlHook.postRender(mockOutputItem, mockElement, new AbortController().signal);
            
            expect(mockElement.classList.add).toHaveBeenCalledWith('output_html');
        });

        it('should send message via postMessage in JavaScript preEvaluate hook', async () => {
            await activate(mockCtx);

            // Extract the registered JavaScript hook
            const jsHook = (mockBuiltinRenderer.experimental_registerJavaScriptRenderingHook as jest.Mock).mock.calls[0][0];
            
            await jsHook.preEvaluate(mockOutputItem, mockElement, 'console.log("test");', new AbortController().signal);
            
            expect(mockCtx.postMessage).toHaveBeenCalledWith({ type: 'from Renderer', payload: 'Hello World' });
        });

        it('should return properly wrapped JavaScript script in preEvaluate hook', async () => {
            const script = 'console.log("test");';
            await activate(mockCtx);

            // Extract the registered JavaScript hook
            const jsHook = (mockBuiltinRenderer.experimental_registerJavaScriptRenderingHook as jest.Mock).mock.calls[0][0];
            
            const result = await jsHook.preEvaluate(mockOutputItem, mockElement, script, new AbortController().signal);
            
            expect(result).toContain('test-element-id'); // Element ID should be included
            expect(result).toContain('testMetadata'); // Metadata should be included
            expect(result).toContain(script); // Original script should be included
        });

        it('should handle output items without metadata properly', async () => {
            const script = 'console.log("test");';
            const outputItemWithoutMetadata: any = { metadata: {} };
            
            await activate(mockCtx);

            // Extract the registered JavaScript hook
            const jsHook = (mockBuiltinRenderer.experimental_registerJavaScriptRenderingHook as jest.Mock).mock.calls[0][0];
            
            const result = await jsHook.preEvaluate(outputItemWithoutMetadata, mockElement, script, new AbortController().signal);
            
            expect(result).toContain('{}'); // Empty metadata object should be included
        });

        it('should initialize jQuery if not present', () => {
            // Remove existing jQuery to simulate first load
            delete (globalThis as any).$;
            delete (globalThis as any).jQuery;
            
            // Reload the module to trigger jQuery initialization
            jest.isolateModules(() => {
                require('./builtinRendererHooks');
            });
            
            // Verify that jQuery was added to global
            expect((globalThis as any).$).toBeDefined();
            expect((globalThis as any).jQuery).toBeDefined();
        });
    });
});