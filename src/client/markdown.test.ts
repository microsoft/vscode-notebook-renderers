/**
 * @jest-environment jsdom
 */

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { activate } from './markdown';

// Note: Using jsdom environment, so DOM globals like document are available

describe('Markdown Styles', () => {
    beforeEach(() => {
        // Set up DOM environment for testing
        document.head.innerHTML = '';
    });

    afterEach(() => {
        // Clean up DOM after each test
        document.head.innerHTML = '';
    });

    test('activate function should add markdown styles to document head', async () => {
        await activate();

        // Check if the template element with class 'markdown-style' was added
        const templates = document.head.querySelectorAll('template.markdown-style');
        expect(templates.length).toBe(1);

        // Check if the style content inside the template includes alert classes
        const template = document.head.querySelector('template.markdown-style') as HTMLTemplateElement | null;
        const styleElement = template?.content.querySelector('style');
        expect(styleElement?.textContent).toContain('.alert {');
        expect(styleElement?.textContent).toContain('.alert-success {');
        expect(styleElement?.textContent).toContain('.alert-info {');
        expect(styleElement?.textContent).toContain('.alert-warning {');
        expect(styleElement?.textContent).toContain('.alert-danger {');
    });

    test('activate function should add correct CSS rules for alert types', async () => {
        await activate();

        const template = document.head.querySelector('template.markdown-style') as HTMLTemplateElement | null;
        const styleElement = template?.content.querySelector('style');
        const cssText = styleElement?.textContent;

        // Check various expected CSS rules
        expect(cssText).toContain('width: auto');
        expect(cssText).toContain('padding: 1em');
        expect(cssText).toContain('margin-top: 1em');
        expect(cssText).toContain('background-color: rgb(200,230,201)'); // success
        expect(cssText).toContain('color: rgb(27,94,32)'); // success
        expect(cssText).toContain('background-color: rgb(178,235,242)'); // info
        expect(cssText).toContain('color: rgb(0,96,100)'); // info
        expect(cssText).toContain('background-color: rgb(255,224,178)'); // warning
        expect(cssText).toContain('color: rgb(230,81,0)'); // warning
        expect(cssText).toContain('background-color: rgb(255,205,210)'); // danger
        expect(cssText).toContain('color: rgb(183,28,28)'); // danger
    });

    test('activate function should create template with correct class', async () => {
        await activate();

        const template = document.head.querySelector('template.markdown-style');
        expect(template).not.toBeNull();
        expect(template?.classList.contains('markdown-style')).toBe(true);
    });

    test('should handle multiple activations gracefully', async () => {
        await activate(); // First activation
        await activate(); // Second activation should not cause errors

        // Each activation creates a new template element
        const templates = document.head.querySelectorAll('template.markdown-style');
        expect(templates.length).toBe(2); // Two templates after two activations
    });
});