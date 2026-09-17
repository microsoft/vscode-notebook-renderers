import { writeImageToClipboard } from './clipboard';

// Mock ClipboardItem and navigator.clipboard
const mockClipboardItem = jest.fn();
const mockWrite = jest.fn();

// Create a proper mock Blob for testing
class MockBlob {
    type: string;
    size: number;
    constructor(parts?: any, options?: { type?: string }) {
        this.type = options?.type || '';
        this.size = parts ? parts.length : 0;
    }

    slice(): MockBlob {
        return this;
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(this.size));
    }

    text(): Promise<string> {
        return Promise.resolve('');
    }

    stream() {
        return null;
    }
}

// Set up the navigator mock before importing the module
beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
});

describe('clipboard', () => {
    beforeEach(() => {
        // Mock ClipboardItem
        (global as any).ClipboardItem = mockClipboardItem;

        // Mock navigator.clipboard
        if (!global.navigator) {
            (global as any).navigator = {};
        }

        Object.defineProperty(global.navigator, 'clipboard', {
            value: {
                write: mockWrite,
            },
            writable: true,
        });
    });

    afterEach(() => {
        // Clean up mocks
        delete (global as any).ClipboardItem;

        // Reset navigator clipboard to undefined instead of deleting
        Object.defineProperty(global.navigator, 'clipboard', {
            value: undefined,
            writable: true,
        });
    });

    describe('writeImageToClipboard', () => {
        it('should successfully write an image blob to clipboard when Clipboard API is supported', async () => {
            // Arrange
            const mockBlob = new MockBlob(['image data'], { type: 'image/png' }) as unknown as Blob;
            mockClipboardItem.mockImplementation((options) => ({
                types: Object.keys(options),
                getType: jest.fn().mockResolvedValue(mockBlob),
            }));
            mockWrite.mockResolvedValue(undefined);

            // Act
            await writeImageToClipboard(mockBlob);

            // Assert
            expect(mockClipboardItem).toHaveBeenCalledWith({ 'image/png': mockBlob });
            expect(mockWrite).toHaveBeenCalledWith([expect.anything()]);
            expect(mockWrite).toHaveBeenCalledTimes(1);
        });

        it('should throw an error when navigator.clipboard.write is not supported', async () => {
            // Arrange
            const mockBlob = new MockBlob(['image data'], { type: 'image/png' }) as unknown as Blob;

            // Temporarily remove the write method to simulate lack of support
            Object.defineProperty(global.navigator, 'clipboard', {
                value: {},
                writable: true,
            });

            // Act & Assert
            await expect(writeImageToClipboard(mockBlob)).rejects.toThrow(
                'navigator.clipboard.write not supported'
            );

            // Restore clipboard
            Object.defineProperty(global.navigator, 'clipboard', {
                value: {
                    write: mockWrite,
                },
                writable: true,
            });
        });

        it('should handle errors from clipboard.write properly', async () => {
            // Arrange
            const mockBlob = new MockBlob(['image data'], { type: 'image/png' }) as unknown as Blob;
            mockClipboardItem.mockImplementation((options) => ({
                types: Object.keys(options),
                getType: jest.fn().mockResolvedValue(mockBlob),
            }));
            const errorMessage = 'Clipboard write failed';
            mockWrite.mockRejectedValue(new Error(errorMessage));

            // Act & Assert
            await expect(writeImageToClipboard(mockBlob)).rejects.toThrow(errorMessage);
        });

        it('should create ClipboardItem with correct MIME type', async () => {
            // Arrange
            const mockBlob = new MockBlob(['image data'], { type: 'image/png' }) as unknown as Blob;
            const expectedOptions = { 'image/png': mockBlob };
            mockClipboardItem.mockImplementation((options) => {
                expect(options).toEqual(expectedOptions);
                return {
                    types: Object.keys(options),
                    getType: jest.fn(),
                };
            });
            mockWrite.mockResolvedValue(undefined);

            // Act
            await writeImageToClipboard(mockBlob);

            // Assert
            expect(mockClipboardItem).toHaveBeenCalledWith(expectedOptions);
        });
    });
});