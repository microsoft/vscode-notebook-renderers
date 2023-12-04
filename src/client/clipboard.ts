declare const ClipboardItem: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prototype: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (options: any): any;
};
declare interface ClipboardItem {
    readonly types: ReadonlyArray<string>;
    getType(type: string): Promise<Blob>;
}

async function convertWebPToPNG(webpBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(webpBlob);

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Unable to get canvas context'));
                return;
            }

            ctx.drawImage(image, 0, 0);

            canvas.toBlob((pngBlob) => {
                if (pngBlob) {
                    resolve(pngBlob);
                } else {
                    reject(new Error('Canvas to Blob conversion failed'));
                }
            }, 'image/png');

            URL.revokeObjectURL(url);
        };

        image.onerror = () => {
            reject(new Error('Error loading WebP image'));
            URL.revokeObjectURL(url);
        };

        image.src = url;
    });
}

export async function writeImageToClipboard(blob: Blob, mimeType: string) {
    let imageBlob = blob;

    // Convert WebP to PNG if necessary
    if (mimeType === 'image/webp') {
        imageBlob = await convertWebPToPNG(blob);
        mimeType = 'image/png'; // Update the mimeType to 'image/png'
    }

    // Create ClipboardItem with the correct mimeType
    const item = new ClipboardItem({ [mimeType]: imageBlob });

    // Check if clipboard API is supported
    if (!('write' in navigator.clipboard)) {
        throw new Error('navigator.clipboard.write not supported');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (navigator.clipboard as any).write([item]);
}
