// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as nbformat from '@jupyterlab/nbformat';
import { concatMultilineString } from './helpers';

describe('concatMultilineString', () => {
    test('should handle single string input', () => {
        const input = 'hello world';
        const result = concatMultilineString(input);
        expect(result).toBe('hello world');
    });

    test('should handle array with single string', () => {
        const input: nbformat.MultilineString = ['hello world'];
        const result = concatMultilineString(input);
        expect(result).toBe('hello world');
    });

    test('should concatenate array of strings with newline insertion', () => {
        const input: nbformat.MultilineString = ['line1', 'line2', 'line3'];
        const result = concatMultilineString(input);
        expect(result).toBe('line1\nline2\nline3');
    });

    test('should not add extra newline if string already ends with newline', () => {
        const input: nbformat.MultilineString = ['line1\n', 'line2', 'line3\n'];
        const result = concatMultilineString(input);
        expect(result).toBe('line1\nline2\nline3\n');
    });

    test('should handle mixed strings with and without newlines', () => {
        const input: nbformat.MultilineString = ['line1\n', 'line2', 'line3\n', 'line4'];
        const result = concatMultilineString(input);
        expect(result).toBe('line1\nline2\nline3\nline4');
    });

    test('should handle empty array', () => {
        const input: nbformat.MultilineString = [];
        const result = concatMultilineString(input);
        expect(result).toBe('');
    });

    test('should handle array with empty strings', () => {
        const input: nbformat.MultilineString = ['', '', ''];
        const result = concatMultilineString(input);
        expect(result).toBe('\n\n');
    });

    test('should handle array with mix of empty and non-empty strings', () => {
        const input: nbformat.MultilineString = ['first', '', 'third'];
        const result = concatMultilineString(input);
        expect(result).toBe('first\n\nthird');
    });

    test('should trim whitespace when trim option is true with single string', () => {
        const input = '  hello world  ';
        const result = concatMultilineString(input, true);
        expect(result).toBe('hello world'); // Tabs, spaces, and other whitespace but not \n
    });

    test('should trim whitespace when trim option is true with array', () => {
        const input: nbformat.MultilineString = ['  line1  ', '  line2  ', '  line3  '];
        const result = concatMultilineString(input, true);
        expect(result).toBe('line1  \n  line2  \n  line3'); // Trims leading and trailing whitespace from entire result only
    });

    test('should preserve newlines when trimming', () => {
        const input: nbformat.MultilineString = ['  line1\n', 'line2  \n', '  line3  '];
        const result = concatMultilineString(input, true);
        expect(result).toBe('line1\nline2  \n  line3'); // Preserves newlines while trimming leading and trailing whitespace only
    });

    test('should handle tab characters in trim', () => {
        const input = '\thello\tworld\t';
        const result = concatMultilineString(input, true);
        expect(result).toBe('hello\tworld');
    });

    test('should handle form feed and vertical tab characters in trim', () => {
        const input = '\f\v hello \f\v';
        const result = concatMultilineString(input, true);
        expect(result).toBe('hello');
    });

    test('should handle carriage return and other whitespace characters in trim', () => {
        const input = '\r hello \r';
        const result = concatMultilineString(input, true);
        expect(result).toBe('hello');
    });

    test('should handle number input converted to string', () => {
        // Since concatMultilineString expects nbformat.MultilineString | string,
        // we cast the number to any to match the internal behavior
        const input: any = 42;
        const result = concatMultilineString(input);
        expect(result).toBe('42');
    });
});