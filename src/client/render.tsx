/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type * as nbformat from '@jupyterlab/nbformat';
import type { PartialJSONObject } from '@lumino/coreutils';
import * as React from 'react';
import type { RendererContext } from 'vscode-notebook-renderer';
import { concatMultilineString } from './helpers';
import { getTransform } from './transforms';
import { OpenImageInPlotViewer, SaveImageAs, IsJupyterExtensionInstalled } from './constants';

(globalThis as any).__isJupyterInstalled = false;
export interface ICellOutputProps {
    output: nbformat.IExecuteResult | nbformat.IDisplayData;
    mimeType: string;
    ctx: RendererContext<unknown>;
    outputId: string;
}

export class CellOutput extends React.Component<ICellOutputProps> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly saveAsIcon: React.RefObject<HTMLButtonElement>;
    private readonly plotIcon: React.RefObject<HTMLButtonElement>;
    private readonly disposables: {
        dispose: () => void;
    }[] = [];
    constructor(prop: ICellOutputProps) {
        super(prop);
        this.saveAsIcon = React.createRef<HTMLButtonElement>();
        this.plotIcon = React.createRef<HTMLButtonElement>();
    }
    public componentWillUnmount() {
        this.disposables.forEach((d) => d.dispose());
    }
    public render() {
        const mimeBundle = this.props.output.data as nbformat.IMimeBundle; // NOSONAR
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let data = mimeBundle[this.props.mimeType!];

        // For un-executed output we might get text or svg output as multiline string arrays
        // we want to concat those so we don't display a bunch of weird commas as we expect
        // Single strings in our output
        if (Array.isArray(data)) {
            data = concatMultilineString(data as nbformat.MultilineString, true);
        }

        switch (this.props.mimeType) {
            case 'image/svg+xml':
            case 'image/png':
            case 'image/gif':
            case 'image/jpeg':
                return this.renderImage(
                    this.props.mimeType,
                    data as unknown as Blob | MediaSource,
                    this.props.output.metadata
                );
            default:
                return this.renderOutput(data, this.props.mimeType);
        }
    }
    /**
     * Custom rendering of image/png and image/jpeg to handle custom Jupyter metadata.
     * Behavior adopted from Jupyter lab.
     * For mimetype image/svg+xml, the data type will be string.
     */
    private renderImage(mimeType: string, data: Blob | MediaSource, metadata: Record<string, unknown> = {}) {
        if (this.props.ctx.postMessage) {
            this.props.ctx.postMessage({ type: 'isJupyterExtensionInstalled' } as IsJupyterExtensionInstalled);
        }
        if (this.props.ctx.onDidReceiveMessage) {
            const disposable = this.props.ctx.onDidReceiveMessage((response: Partial<IsJupyterExtensionInstalled>) => {
                if (response?.type === 'isJupyterExtensionInstalled' && response.response) {
                    (globalThis as any).__isJupyterInstalled = response.response;
                }
            });
            this.disposables.push(disposable);
        }

        const imgStyle: Record<string, string | number> = {};
        const divStyle: Record<string, string | number> = { overflow: 'scroll', position: 'relative' }; // `overflow:scroll` is the default style used by Jupyter lab.
        const imgSrc =
            mimeType.toLowerCase().includes('svg') && typeof data === 'string' ? undefined : URL.createObjectURL(data);
        const customMetadata = metadata.metadata as PartialJSONObject | undefined;
        const showPlotViewer = metadata.__displayOpenPlotIcon === true;
        if (customMetadata && typeof customMetadata.needs_background === 'string') {
            imgStyle.backgroundColor = customMetadata.needs_background === 'light' ? 'white' : 'black';
        }
        const imageMetadata: Record<string, any> | undefined = customMetadata
            ? (customMetadata[mimeType] as any)
            : undefined;
        if (imageMetadata?.height) {
            imgStyle.height = imageMetadata.height;
        }
        if (imageMetadata?.width) {
            imgStyle.width = imageMetadata.width;
        }
        if (imageMetadata?.unconfined === true) {
            imgStyle.maxWidth = 'none';
        }

        // Hack, use same classes as used in VSCode for images (keep things as similar as possible).
        // This is to maintain consistently in displaying images (if we hadn't used HTML).
        // See src/vs/workbench/contrib/notebook/browser/view/output/transforms/richTransform.ts
        const saveAs = () => {
            if (this.props.ctx.postMessage) {
                this.props.ctx.postMessage({
                    type: 'saveImageAs',
                    outputId: this.props.outputId,
                    mimeType: this.props.mimeType
                } as SaveImageAs);
            }
        };
        const openPlot = () => {
            if (this.props.ctx.postMessage) {
                this.props.ctx.postMessage({
                    type: 'openImageInPlotViewer',
                    outputId: this.props.outputId,
                    mimeType: this.props.mimeType
                } as OpenImageInPlotViewer);
            }
        };
        const onMouseOver = () => {
            if (!(globalThis as any).__isJupyterInstalled) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.saveAsIcon.current!.className = 'plotIcon';
            if (this.plotIcon.current) {
                this.plotIcon.current.className = 'plotIcon';
            }
        };
        const onMouseOut = () => {
            if (!(globalThis as any).__isJupyterInstalled) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.saveAsIcon.current!.className = 'plotIcon hidden';
            if (this.plotIcon.current) {
                this.plotIcon.current.className = 'plotIcon hidden';
            }
        };
        const contents = imgSrc ? (
            <img src={imgSrc} style={imgStyle}></img>
        ) : (
            <div className={'svgContainerStyle'} dangerouslySetInnerHTML={{ __html: data.toString() }} />
        );
        return (
            <div className={'display'} style={divStyle} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
                <button
                    ref={this.saveAsIcon}
                    style={{ position: 'absolute', top: '5px', right: '5px' }}
                    className={'plotIcon hidden'}
                    onClick={saveAs}
                    role="button"
                    aria-pressed="false"
                    title="Save As"
                    aria-label="Save As"
                >
                    <span>
                        <span className="image-button-child">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    className={'plotIconSvgPath'}
                                    d="M12.0147 2.8595L13.1397 3.9845L13.25 4.25V12.875L12.875 13.25H3.125L2.75 12.875V3.125L3.125 2.75H11.75L12.0147 2.8595ZM3.5 3.5V12.5H12.5V4.406L11.5947 3.5H10.25V6.5H5V3.5H3.5ZM8 3.5V5.75H9.5V3.5H8Z"
                                />
                            </svg>
                        </span>
                    </span>
                </button>
                {showPlotViewer ? (
                    <button
                        ref={this.plotIcon}
                        style={{ position: 'absolute', top: '5px', right: '45px' }}
                        className={'plotIcon hidden'}
                        onClick={openPlot}
                        role="button"
                        aria-pressed="false"
                        title="Expand image"
                        aria-label="Expand image"
                    >
                        <span>
                            <span className="image-button-child">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        className={'plotIconSvgPath'}
                                        d="M9.71429 6.28571V12.2857H7.14286V6.28571H9.71429ZM13.1429 2.85714V12.2857H10.5714V2.85714H13.1429ZM2.85714 13.1429H14V14H2V2H2.85714V13.1429ZM6.28571 4.57143V12.2857H3.71429V4.57143H6.28571Z"
                                    />
                                </svg>
                            </span>
                        </span>
                    </button>
                ) : undefined}
                {contents}
            </div>
        );
    }
    private renderOutput(data: nbformat.MultilineString | PartialJSONObject, mimeType?: string) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, no-unused-vars, @typescript-eslint/no-explicit-any
        const Transform: any = getTransform(this.props.mimeType!);
        const vegaPlot = mimeType && isVegaPlot(mimeType);
        const divStyle: React.CSSProperties = {
            backgroundColor: vegaPlot ? 'white' : undefined
        };
        if (vegaPlot) {
            // Vega library expects data to be passed as serialized JSON instead of a native
            // JS object.
            data = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return (
            <div style={divStyle}>
                <Transform data={data} onError={console.error} />
            </div>
        );
    }
}

function isVegaPlot(mimeType: string) {
    return mimeType.includes('application/vnd.vega');
}
