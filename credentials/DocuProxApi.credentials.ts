import {
    IAuthenticateGeneric,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class DocuProxApi implements ICredentialType {
    name = 'docuProxApi';
    displayName = 'DocuProx API';
    documentationUrl = 'https://docuprox.com/docs';
    properties: INodeProperties[] = [
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

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'x-auth': '={{$credentials.apiKey}}'
            },
        },
    };
}
