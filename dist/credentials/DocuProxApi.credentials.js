"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocuProxApi = void 0;
class DocuProxApi {
    constructor() {
        this.name = 'docuProxApi';
        this.displayName = 'DocuProx API';
        this.documentationUrl = 'https://docuprox.com/docs';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Your DocuProx API key',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-auth': '={{$credentials.apiKey}}'
                },
            },
        };
    }
}
exports.DocuProxApi = DocuProxApi;
