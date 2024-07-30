declare const ClipboardItem: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prototype: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
    new (options: any): any;
};
declare interface ClipboardItem {
    readonly types: ReadonlyArray<string>;
    // eslint-disable-next-line no-unused-vars
    getType(type: string): Promise<Blob>;
}

export async function writeImageToClipboard(blob: Blob) {
    const item = new ClipboardItem({ 'image/png': blob });
    if (!('write' in navigator.clipboard)) {
        throw new Error('navigator.clipboard.write not supported');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (navigator.clipboard as any).write([item]);
}
