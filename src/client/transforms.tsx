// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import * as React from 'react';
import Loadable, { LoadableComponent } from '@loadable/component';

class TransformData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cachedPromise: undefined | Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(public mimeType: string, private importer: () => Promise<any>) {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getComponent(): Promise<any> {
        if (!this.cachedPromise) {
            this.cachedPromise = this.importer();
        }
        return this.cachedPromise;
    }
}

// Hardcode mimeType here so we can do a quick lookup without loading all of the
// other components.
const mimeTypeToImport: TransformData[] = [
    new TransformData('application/vnd.vega.v2+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.Vega2;
    }),
    new TransformData('application/vnd.vega.v3+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.Vega3;
    }),
    new TransformData('application/vnd.vega.v4+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.Vega4;
    }),
    new TransformData('application/vnd.vega.v5+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.Vega5;
    }),
    new TransformData('application/vnd.vegalite.v1+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.VegaLite1;
    }),
    new TransformData('application/vnd.vegalite.v2+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.VegaLite2;
    }),
    new TransformData('application/vnd.vegalite.v3+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.VegaLite3;
    }),
    new TransformData('application/vnd.vegalite.v4+json', async () => {
        const module = await import(/* webpackChunkName: "vega" */ '@nteract/transform-vega');
        return module.VegaLite4;
    }),
    new TransformData('application/geo+json', async () => {
        const module = await import(/* webpackChunkName: "geojson" */ '@nteract/transform-geojson');
        return module.GeoJSONTransform;
    }),
    new TransformData('application/vnd.dataresource+json', async () => {
        const module = await import(/* webpackChunkName: "dataresource" */ '@nteract/transform-dataresource');
        return module.DataResourceTransform;
    }),
    new TransformData('application/x-nteract-model-debug+json', async () => {
        const module = await import(/* webpackChunkName: "modeldebug" */ '@nteract/transform-model-debug');
        return module.default;
    }),
    new TransformData('text/vnd.plotly.v1+html', async () => {
        const module = await import(/* webpackChunkName: "plotly" */ '@nteract/transform-plotly');
        return module.PlotlyNullTransform;
    }),
    new TransformData('application/vnd.plotly.v1+json', async () => {
        const module = await import(/* webpackChunkName: "plotly" */ '@nteract/transform-plotly');
        return module.PlotlyTransform;
    }),
    new TransformData('image/svg+xml', async () => {
        const module = await import(/* webpackChunkName: "nteract_transforms" */ '@nteract/transforms');
        return module.SVGTransform;
    }),
    new TransformData('application/vdom.v1+json', async () => {
        const module = await import(/* webpackChunkName: "nteract_transforms_vsdom" */ '@nteract/transform-vdom');
        return module.VDOM;
    })
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRichestMimetype(data: any): string {
    // Go through the keys of this object and find their index in the map
    let index = mimeTypeToImport.length;
    const keys = Object.keys(data);
    keys.forEach((k) => {
        const keyIndex = mimeTypeToImport.findIndex((m) => m.mimeType === k);
        if (keyIndex >= 0 && keyIndex < index) {
            // If higher up the chain, pick the higher up key
            index = keyIndex;
        }
    });

    // If this index is found, return the mimetype to use.
    if (index < mimeTypeToImport.length) {
        return mimeTypeToImport[index].mimeType;
    }

    // Don't know which to pick, just pick the first.
    return keys[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTransform(mimeType: string, loadingMessage = 'Loading...'): LoadableComponent<{ data: any }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Loadable<{ data: any }>(
        async () => {
            const match = mimeTypeToImport.find((m) => m.mimeType === mimeType);
            if (match) {
                const transform = await match.getComponent();
                return transform;
            }

            return <div>`Transform not found for mimetype ${mimeType}`</div>;
        },
        { fallback: <div>{loadingMessage}</div> }
    );
}

export async function forceLoad() {
    // Used for tests to make sure we don't end up with 'Loading ...' anywhere in a test
    await Promise.all(mimeTypeToImport.map((m) => m.getComponent()));
}

export function isMimeTypeSupported(mimeType: string): boolean {
    const match = mimeTypeToImport.find((m) => m.mimeType === mimeType);
    return match ? true : false;
}
