// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Define the types that match the actual VSCode API
interface ExtensionContext {
    subscriptions: { dispose(): void }[];
}

type NotebookEditor = any;

type VSCodeEvent<T> = (listener: (e: T) => any) => { dispose(): void };

interface OpenImageInPlotViewer {
    type: 'openImageInPlotViewer';
    outputId: string;
    mimeType: string;
}

interface IsJupyterExtensionInstalled {
    type: 'isJupyterExtensionInstalled';
    response?: boolean;
}

interface SaveImageAs {
    type: 'saveImageAs';
    outputId: string;
    mimeType: string;
}

// Create mock implementations that match the actual VSCode API signatures
class MockEventEmitter<T> {
    event: VSCodeEvent<T> = (listener: (e: T) => any) => ({ dispose: () => {} });
    fire = jest.fn();
    dispose = jest.fn();
}

// Define the interface for mockable functionality
interface MockNotebookMessaging {
    onDidReceiveMessage: (listener: (e: { editor: NotebookEditor; message: any }) => any) => { dispose(): void };
    postMessage: (message: any, editor?: NotebookEditor) => Promise<void>;
}

// Mock VSCode API using jest
const mockEventEmitter = new MockEventEmitter<{ editor: NotebookEditor; message: OpenImageInPlotViewer | SaveImageAs }>();

const mockMessaging: MockNotebookMessaging = {
    onDidReceiveMessage: jest.fn(),
    postMessage: jest.fn().mockResolvedValue(undefined)
};

// Create a reference to hold the actual activate function
let actualActivate: (context: ExtensionContext) => Promise<{
    onDidReceiveMessage: VSCodeEvent<{ editor: NotebookEditor; message: OpenImageInPlotViewer | SaveImageAs }>;
}>;

// Use a require hook to override the module before it's imported
jest.mock('vscode', () => ({
    notebooks: {
        createRendererMessaging: jest.fn(() => mockMessaging)
    },
    EventEmitter: jest.fn(() => mockEventEmitter),
    extensions: {
        getExtension: jest.fn()
    }
}), { virtual: true });

jest.mock('./constants', () => ({
    OpenImageInPlotViewer: jest.fn(),
    SaveImageAs: jest.fn(),
    IsJupyterExtensionInstalled: jest.fn()
}), { virtual: true });

describe('Extension Index', () => {
    let mockContext: ExtensionContext;
    let mockEditor: NotebookEditor;
    
    // Store references to the mocked functions
    let mockCreateRendererMessaging: jest.MockedFunction<any>;
    let mockGetExtension: jest.MockedFunction<any>;

    beforeAll(async () => {
        // Import the actual function after setting up mocks
        const module = await import('./index');
        actualActivate = module.activate;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Get references to the mocked functions
        const vscodeModule = require('vscode');
        mockCreateRendererMessaging = vscodeModule.notebooks.createRendererMessaging as jest.MockedFunction<any>;
        mockGetExtension = vscodeModule.extensions.getExtension as jest.MockedFunction<any>;
        
        // Set up default mock implementations
        mockCreateRendererMessaging.mockReturnValue(mockMessaging);
        mockGetExtension.mockReturnValue(true);

        mockContext = {
            subscriptions: []
        };

        mockEditor = {};
    });

    it('should initialize correctly and return onDidReceiveMessage event', async () => {
        // Set up the messaging mock to call the handler when onDidReceiveMessage is called
        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            // Simulate receiving a message
            callback({ 
                editor: mockEditor, 
                message: { type: 'openImageInPlotViewer', outputId: 'test-id', mimeType: 'image/png' } 
            });
            return { dispose: jest.fn() };
        });

        // Act
        const result = await actualActivate(mockContext);

        // Assert
        expect(mockCreateRendererMessaging).toHaveBeenCalledWith('jupyter-notebook-renderer');
        expect(result).toHaveProperty('onDidReceiveMessage');
        expect(typeof result.onDidReceiveMessage).toBe('function');
        
        // Verify postMessage was called to check if Jupyter extension is installed
        expect(mockMessaging.postMessage).toHaveBeenCalledWith({
            type: 'isJupyterExtensionInstalled',
            response: true
        });
    });

    it('should handle isJupyterExtensionInstalled message type', async () => {
        // Arrange
        const mockIsJupyterInstalledMsg = {
            type: 'isJupyterExtensionInstalled'
        };
        const postMessageSpy = jest.spyOn(mockMessaging, 'postMessage');

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({ 
                editor: mockEditor, 
                message: mockIsJupyterInstalledMsg 
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Assert
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'isJupyterExtensionInstalled',
                response: true
            }),
            mockEditor
        );
        // The event emitter should NOT fire for this specific message type
        expect(mockEventEmitter.fire).not.toHaveBeenCalled();
    });

    it('should handle openImageInPlotViewer message type', async () => {
        // Arrange
        const mockOpenImageMsg = {
            type: 'openImageInPlotViewer',
            outputId: 'test-output-id',
            mimeType: 'image/png'
        };

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({ 
                editor: mockEditor, 
                message: mockOpenImageMsg 
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Assert - check that the event emitter was fired with the correct message
        expect(mockEventEmitter.fire).toHaveBeenCalledWith({
            editor: mockEditor,
            message: mockOpenImageMsg
        });
    });

    it('should handle saveImageAs message type', async () => {
        // Arrange
        const mockSaveImageMsg = {
            type: 'saveImageAs',
            outputId: 'test-save-id',
            mimeType: 'image/png'
        };

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({ 
                editor: mockEditor, 
                message: mockSaveImageMsg 
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Assert
        expect(mockEventEmitter.fire).toHaveBeenCalledWith({
            editor: mockEditor,
            message: mockSaveImageMsg
        });
    });

    it('should not process messages without a type property', async () => {
        // Arrange
        const invalidMessage = { someOtherProp: 'value' };

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({ 
                editor: mockEditor, 
                message: invalidMessage 
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Assert - the event emitter should not be fired for messages without a type
        expect(mockEventEmitter.fire).not.toHaveBeenCalled();
    });

    it('should handle cases where jupyter extension is not installed', async () => {
        // Arrange
        mockGetExtension.mockReturnValue(null); // No extension found
        const mockIsJupyterInstalledMsg = {
            type: 'isJupyterExtensionInstalled'
        };
        const postMessageSpy = jest.spyOn(mockMessaging, 'postMessage');

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({ 
                editor: mockEditor, 
                message: mockIsJupyterInstalledMsg 
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Assert
        expect(postMessageSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'isJupyterExtensionInstalled',
                response: false
            }),
            mockEditor
        );
    });

    it('should add subscription to context.subscriptions', async () => {
        // Arrange
        let callbackFunc: (data: any) => void;
        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callbackFunc = callback;
            return { dispose: jest.fn() }; // Return a disposable object
        });

        // Act
        await actualActivate(mockContext);

        // Assert
        expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should handle postMessage rejection gracefully', async () => {
        // Arrange
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // This error is rejected in the void-ed promise, so it won't bubble up
        // We need to mock postMessage to reject for the initial call in the activate function
        const mockError = new Error('Post message failed');
        (mockMessaging.postMessage as jest.Mock).mockRejectedValueOnce(mockError);

        const mockIsJupyterInstalledMsg = {
            type: 'isJupyterExtensionInstalled'
        };

        (mockMessaging.onDidReceiveMessage as jest.Mock).mockImplementation((callback) => {
            callback({
                editor: mockEditor,
                message: mockIsJupyterInstalledMsg
            });
            return { dispose: jest.fn() };
        });

        // Act
        await actualActivate(mockContext);

        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        // Assert
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send', expect.any(Error));
    });
});