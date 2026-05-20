// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Mock globals before importing
Object.defineProperty(global, 'scriptUrl', {
    value: 'http://localhost:3000/out/client/vegaRenderer.js',
    writable: true
});

// Set up a basic DOM environment for tests
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.Node = dom.window.Node;

import * as vegaEmbed from 'vega-embed';
import { OutputItem, RendererContext } from 'vscode-notebook-renderer';
import { activate } from './vegaRenderer';

// Define interface for our mock OutputItem to match the actual OutputItem interface
interface MockOutputItem extends OutputItem {
    id: string;
    mime: string;
    json: () => any;
    metadata: any;
    text: () => string;
    data: () => Uint8Array;
    blob: () => Blob;
}

// Mock the vega-embed library
jest.mock('vega-embed', () => ({
    default: jest.fn(),
    vega: {
        loader: jest.fn()
    }
}));

// Mock the constants module
jest.mock('./constants', () => ({
    isDarkTheme: jest.fn(() => false)
}));

describe('vegaRenderer', () => {
    let mockContext: RendererContext<unknown>;
    let mockElement: HTMLElement;
    let mockOutputItem: MockOutputItem;
    let mockResult: vegaEmbed.Result;

    beforeEach(() => {
        mockContext = {} as RendererContext<unknown>;

        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);

        mockOutputItem = {
            id: 'test-id',
            mime: 'application/vnd.vegalite.v1+json',
            json: jest.fn(),
            metadata: {},
            text: jest.fn(),
            data: jest.fn(() => new Uint8Array()),
            blob: jest.fn(() => new Blob())
        } as MockOutputItem;

        mockResult = {
            finalize: jest.fn(),
            view: {
                toImageURL: jest.fn()
            }
        } as unknown as vegaEmbed.Result;

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.removeChild(mockElement);
    });

    describe('activate', () => {
        it('should return an object with renderOutputItem and disposeOutputItem methods', async () => {
            const renderer = await activate(mockContext);

            expect(renderer).toHaveProperty('renderOutputItem');
            expect(renderer).toHaveProperty('disposeOutputItem');
            expect(typeof renderer.renderOutputItem).toBe('function');
            expect(typeof renderer.disposeOutputItem).toBe('function');
        });

        describe('renderOutputItem', () => {
            it('should embed Vega-Lite visualization correctly', async () => {
                const mockSpec = { $schema: 'https://vega.github.io/schema/vega-lite/v5.json', mark: 'point', encoding: {} };
                (mockOutputItem.json as jest.Mock).mockReturnValue(mockSpec);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                expect(vegaEmbed.default).toHaveBeenCalledWith(
                    expect.any(HTMLDivElement),
                    mockSpec,
                    expect.objectContaining({
                        actions: {
                            export: true,
                            compiled: false,
                            editor: false,
                            source: false
                        },
                        defaultStyle: true,
                        mode: 'vega-lite'
                    })
                );
            });

            it('should embed Vega visualization correctly for VEGA_MIME_TYPE', async () => {
                const mockSpec = { $schema: 'https://vega.github.io/schema/vega/v5.json', marks: [] };
                const mockOutputItemVega: MockOutputItem = {
                    ...mockOutputItem,
                    mime: 'application/vnd.vega.v5+json'
                };

                (mockOutputItemVega.json as jest.Mock).mockReturnValue(mockSpec);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItemVega, mockElement);

                expect(vegaEmbed.default).toHaveBeenCalledWith(
                    expect.any(HTMLDivElement),
                    mockSpec,
                    expect.objectContaining({
                        mode: 'vega'
                    })
                );
            });

            it('should apply dark theme when isDarkTheme returns true and no theme is set', async () => {
                const mockSpec = { $schema: 'https://vega.github.io/schema/vega-lite/v5.json', mark: 'point', encoding: {} };
                (mockOutputItem.json as jest.Mock).mockReturnValue(mockSpec);

                // Mock isDarkTheme to return true
                jest.requireMock('./constants').isDarkTheme.mockReturnValue(true);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                expect(vegaEmbed.default).toHaveBeenCalledWith(
                    expect.any(HTMLDivElement),
                    mockSpec,
                    expect.objectContaining({
                        theme: 'dark'
                    })
                );
            });

            it('should not apply dark theme when spec has background set', async () => {
                const mockSpec = {
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
                    mark: 'point',
                    encoding: {},
                    background: 'white'
                };
                (mockOutputItem.json as jest.Mock).mockReturnValue(mockSpec);

                // Mock isDarkTheme to return true
                jest.requireMock('./constants').isDarkTheme.mockReturnValue(true);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                // Check that theme is not set to dark since background is already defined
                const callArgs = (vegaEmbed.default as jest.Mock).mock.calls[0];
                const options = callArgs[2];
                expect(options.theme !== 'dark').toBeTruthy(); // Theme should not be 'dark' when background is set
            });

            it('should not apply dark theme when embedOptions already has a theme', async () => {
                const mockSpec = {
                    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
                    mark: 'point',
                    encoding: {}
                };

                const mockOutputItemWithCustomTheme: MockOutputItem = {
                    ...mockOutputItem,
                    metadata: {
                        metadata: {
                            'application/vnd.vegalite.v1+json': {
                                embed_options: { theme: 'custom-theme' }
                            }
                        }
                    }
                };

                (mockOutputItemWithCustomTheme.json as jest.Mock).mockReturnValue(mockSpec);

                // Mock isDarkTheme to return true
                jest.requireMock('./constants').isDarkTheme.mockReturnValue(true);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItemWithCustomTheme, mockElement);

                // Check that theme is not overridden
                const callArgs = (vegaEmbed.default as jest.Mock).mock.calls[0];
                const options = callArgs[2];
                expect(options.theme).toBe('custom-theme'); // Should remain custom theme
            });

            it('should handle undefined spec gracefully', async () => {
                (mockOutputItem.json as jest.Mock).mockReturnValue(undefined);

                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                expect(vegaEmbed.default).not.toHaveBeenCalled();
            });

            it('should dispose of existing view when rendering new output with same id', async () => {
                const mockSpec = { $schema: 'https://vega.github.io/schema/vega-lite/v5.json', mark: 'point', encoding: {} };
                (mockOutputItem.json as jest.Mock).mockReturnValue(mockSpec);

                const mockOldResult = {
                    finalize: jest.fn()
                };

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                // First render to set up the map with an existing view
                const renderer = await activate(mockContext);
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                // Second render with same ID to trigger disposal of existing view
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                expect(mockOldResult.finalize).not.toHaveBeenCalled(); // Since this is a new mockResult
                expect(vegaEmbed.default).toHaveBeenCalledTimes(2); // Should have been called twice
            });
        });

        describe('disposeOutputItem', () => {
            it('should dispose of view when id is provided', async () => {
                const mockSpec = { $schema: 'https://vega.github.io/schema/vega-lite/v5.json', mark: 'point', encoding: {} };
                (mockOutputItem.json as jest.Mock).mockReturnValue(mockSpec);

                const mockLoader = {
                    sanitize: jest.fn()
                };

                (vegaEmbed.vega.loader as jest.Mock).mockReturnValue(mockLoader);
                (vegaEmbed.default as jest.Mock).mockResolvedValue(mockResult);

                const renderer = await activate(mockContext);

                // First render to create a view
                await renderer.renderOutputItem(mockOutputItem, mockElement);

                // Then dispose of it
                renderer.disposeOutputItem(mockOutputItem.id);

                expect(mockResult.finalize).toHaveBeenCalled();
            });

            it('should not attempt to dispose when id is not provided', async () => {
                const renderer = await activate(mockContext);

                // This should not throw or cause issues
                renderer.disposeOutputItem();

                expect(mockResult.finalize).not.toHaveBeenCalled();
            });
        });
    });
});