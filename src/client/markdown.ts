/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const styleContent = `
.alert {
    width: auto;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1em;
	border-style: solid;
	border-width: 1px;
}
.alert > *:last-child {
    margin-bottom: 0;
}
#preview > .alert:last-child {
    /* Prevent this being set to zero by the default notebook stylesheet */
    padding-bottom: 1em;
}

.alert-success {
    background-color: rgb(200,230,201);
    color: rgb(27,94,32);
}
.alert-info {
    background-color: rgb(178,235,242);
    color: rgb(0,96,100);
}
.alert-warning {
    background-color: rgb(255,224,178);
    color: rgb(230,81,0);
}
.alert-danger {
    background-color: rgb(255,205,210);
    color: rgb(183,28,28);
}
`;

export async function activate() {
    const style = document.createElement('style');
    style.textContent = styleContent;
    const template = document.createElement('template');
    template.classList.add('markdown-style');
    template.content.appendChild(style);
    document.head.appendChild(template);
}
