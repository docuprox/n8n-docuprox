"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocuProx = void 0;
const n8n_workflow_1 = require("n8n-workflow");
function getMimeType(filename) {
    if (!filename || filename.indexOf('.') === -1) {
        return 'application/octet-stream';
    }
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const mimeTypes = {
        '.zip': 'application/zip',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.bmp': 'image/bmp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
// ── Helper: parse staticValues safely and return object or undefined ──────────
function parseStaticValues(raw, label = '') {
    console.log(`[DocuProx Debug] ${label} raw input:`, JSON.stringify(raw));
    if (raw === null || raw === undefined)
        return undefined;
    // ✅ n8n returns [null] or [undefined] for empty json fields — reject any array
    if (Array.isArray(raw)) {
        console.log(`[DocuProx Debug] ${label} input is an array, rejecting`);
        return undefined;
    }
    let parsed = raw;
    if (typeof parsed === 'string') {
        const trimmed = parsed.trim();
        if (!trimmed || trimmed === '{}' || trimmed === 'null' || trimmed === '[]' || trimmed === '[null]')
            return undefined;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch (_a) {
            return undefined;
        }
    }
    // After parsing, re-check for array or non-object
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        console.log(`[DocuProx Debug] ${label} parsed is not an object/is array, rejecting`);
        return undefined;
    }
    // Reject empty objects
    if (Object.keys(parsed).length === 0) {
        console.log(`[DocuProx Debug] ${label} object is empty, rejecting`);
        return undefined;
    }
    console.log(`[DocuProx Debug] ${label} validation passed`);
    return parsed;
}
class DocuProx {
    constructor() {
        this.description = {
            displayName: 'DocuProx',
            name: 'docuProx',
            icon: 'file:douprox-logo.svg',
            group: ['transform'],
            version: 1,
            description: 'AI-powered document data extraction using DocuProx. Use AI Agents with natural language prompts or AI-driven template extraction to pull structured data from documents in real-time or via high-volume batch processing.',
            documentationUrl: 'https://docuprox.com/docs/',
            defaults: {
                name: 'DocuProx',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'docuProxApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Need help setting up? Check out our <a href="https://docuprox.com/docs/getting-started/" target="_blank">Documentation Guide</a>.',
                    name: 'helpNotice',
                    type: 'notice',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['document', 'job'],
                        },
                    },
                },
                // ─── Resource Selector ─────────────────────────────────────────────
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    options: [
                        {
                            name: 'Document',
                            value: 'document',
                            description: 'Process individual document images in real-time. Supports both predefined Template IDs and AI-powered extraction without templates.',
                        },
                        {
                            name: 'Job',
                            value: 'job',
                            description: 'Submit and manage high-volume batch processing for multiple documents within a ZIP file',
                        },
                    ],
                    default: 'document',
                    required: true,
                },
                // ─── Operation Selector: Document ──────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                        },
                    },
                    options: [
                        {
                            name: 'Process Agent',
                            value: 'process_agent',
                            action: 'Process with agent',
                            description: 'Process documents via the DocuProx API. Extract structured data using manual or AI-generated prompts, no template required.',
                        },
                        {
                            name: 'Process',
                            value: 'process',
                            action: 'Process a document',
                            description: 'Extract document data in real-time by providing a Template ID (UUID) from your DocuProx dashboard',
                        },
                    ],
                    default: 'process_agent',
                    required: true,
                },
                // ─── Operation Selector: Job ───────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['job'],
                        },
                    },
                    options: [
                        {
                            name: 'Submit Job',
                            value: 'processJob',
                            action: 'Submit a job',
                            description: 'Submit a batch job containing multiple documents in a ZIP file to the DocuProx API for background processing',
                        },
                        {
                            name: 'Get Job Status',
                            value: 'jobStatus',
                            action: 'Get job status',
                            description: 'Get the current processing status, progress percentage, and result metadata for a submitted batch job',
                        },
                        {
                            name: 'Get Job Results',
                            value: 'jobResults',
                            action: 'Get job results',
                            description: 'Retrieve the fully extracted structured data (JSON/CSV) for all documents contained in a completed batch job',
                        },
                    ],
                    default: 'processJob',
                    required: true,
                },
                // ─── Shared: Template ID (Process + Submit Job) ────────────────────
                {
                    displayName: 'Template ID',
                    name: 'templateId',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'Enter Template ID',
                    description: 'The unique extraction template ID from your DocuProx dashboard. Example: "29ce218f-c9d2-4d4a-b7fd-167ed9bb086f".',
                    displayOptions: {
                        show: {
                            operation: ['process', 'processJob'],
                        },
                    },
                },
                // ─── Shared: Job ID (Job Status + Job Results) ─────────────────────
                {
                    displayName: 'Job ID',
                    name: 'jobId',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'e.g. 29ce218f-c9d2-4d4a-b7fd-167ed9bb086f',
                    description: 'The unique UUID of the batch processing job, returned when you "Submit Job". Required for status and result retrieval.',
                    displayOptions: {
                        show: {
                            operation: ['jobStatus', 'jobResults'],
                        },
                    },
                },
                // ─── PROCESS: Image Source ─────────────────────────────────────────
                {
                    displayName: 'Image Source',
                    name: 'imageSource',
                    type: 'options',
                    required: true,
                    default: 'upload',
                    options: [
                        {
                            name: 'Upload Image File',
                            value: 'upload',
                            description: 'Upload an image file from binary data',
                        },
                        {
                            name: 'Base64 String',
                            value: 'base64',
                            description: 'Provide image as Base64 encoded string',
                        },
                    ],
                    description: 'Select how you want to provide the image',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process', 'process_agent'],
                        },
                    },
                },
                // ─── PROCESS: Binary Property Name (upload mode only) ──────────────
                {
                    displayName: 'Binary Property Name',
                    name: 'binaryPropertyName',
                    type: 'string',
                    required: true,
                    default: 'data',
                    placeholder: 'data',
                    description: 'Name of the binary property that contains the image file',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process', 'process_agent'],
                            imageSource: ['upload'],
                        },
                    },
                },
                // ─── PROCESS: Base64 Image ─────────────────────────────────────────
                {
                    displayName: 'Base64 Image',
                    name: 'base64Image',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'Enter Base64 encoded image string',
                    description: 'Provide the Base64 encoded image data (with or without data URI prefix)',
                    typeOptions: {
                        rows: 5,
                    },
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process', 'process_agent'],
                            imageSource: ['base64'],
                        },
                    },
                },
                // ─── PROCESS: Static Values (optional) ────────────────────────────
                {
                    displayName: 'Static Values',
                    name: 'staticValues',
                    type: 'json',
                    required: false,
                    default: '',
                    placeholder: '{"name_1": "monika", "city": "dewas"}',
                    description: 'Optional static key-value pairs to send along with the document (object format)',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process'],
                        },
                    },
                },
                {
                    displayName: 'Selection Method',
                    name: 'selectionMethod',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                        },
                    },
                    options: [
                        {
                            name: 'Structured (Form)',
                            value: 'structured',
                            description: 'Add properties individually using fields',
                        },
                        {
                            name: 'Manual (JSON)',
                            value: 'manual',
                            description: 'Provide payload as a raw JSON blob',
                        },
                    ],
                    default: 'structured',
                    description: 'Select how you want to provide the agent payload',
                },
                {
                    displayName: 'Document Type',
                    name: 'documentType',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'e.g. passport',
                    description: 'The type or category of document being processed (e.g. "passport", "invoice"), used to guide the AI model\'s extraction logic',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                            selectionMethod: ['structured'],
                        },
                    },
                },
                {
                    displayName: 'Custom Instructions',
                    name: 'customInstructions',
                    type: 'string',
                    required: false,
                    default: '',
                    placeholder: 'e.g. Please extract all the relevant fields carefully',
                    description: 'Provide specific natural language guidance for the AI Agent (e.g. "Extract all dates in YYYY-MM-DD" or "Ignore blurred marks")',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                            selectionMethod: ['structured'],
                        },
                    },
                },
                {
                    displayName: 'Prompts',
                    name: 'prompts',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    placeholder: 'Add Prompt',
                    default: {
                        values: [
                            {
                                key: '',
                                value: '',
                            },
                        ],
                    },
                    options: [
                        {
                            name: 'values',
                            displayName: 'Values',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                    placeholder: 'e.g. passport_number',
                                    description: 'The logical name (e.g. "total_amount") that will represent this field in the final result object',
                                },
                                {
                                    displayName: 'Instruction',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                    placeholder: 'e.g. extract the passport number from the top right',
                                    description: 'Detailed instructions for the AI on how to find or interpret this specific value within the document',
                                },
                            ],
                        },
                    ],
                    description: 'A list of individual field definitions and instructions for the AI Agent to locate and extract from the document image',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                            selectionMethod: ['structured'],
                        },
                    },
                },
                {
                    displayName: 'Static Values',
                    name: 'staticValuesAgent',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    placeholder: 'Add Static Value',
                    default: {},
                    options: [
                        {
                            name: 'values',
                            displayName: 'Static Values',
                            values: [
                                {
                                    displayName: 'Key',
                                    name: 'key',
                                    type: 'string',
                                    default: '',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
                    description: 'Static key-value metadata pairs to include alongside the AI Agent\'s extraction results',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                            selectionMethod: ['structured'],
                        },
                    },
                },
                {
                    displayName: 'Payload',
                    name: 'payload',
                    type: 'json',
                    required: true,
                    default: '',
                    placeholder: '{\n  "document_type": "passport",\n  "custom_instructions": "",\n  "prompt_json": {\n    "passport": "extract passport number"\n  }\n}',
                    displayOptions: {
                        show: {
                            resource: ['document'],
                            operation: ['process_agent'],
                            selectionMethod: ['manual'],
                        },
                    },
                },
                // ─── SUBMIT JOB: Binary Property Name ─────────────────────────────
                {
                    displayName: 'Binary Property Name',
                    name: 'binaryPropertyName',
                    type: 'string',
                    required: true,
                    default: 'data',
                    placeholder: 'data',
                    description: 'Name of the binary property that contains the ZIP file',
                    displayOptions: {
                        show: {
                            resource: ['job'],
                            operation: ['processJob'],
                        },
                    },
                },
                // ─── SUBMIT JOB: Static Values (optional) ─────────────────────────
                {
                    displayName: 'Static Values',
                    name: 'staticValues',
                    type: 'json',
                    required: false,
                    default: '',
                    placeholder: '{"name_1": "monika", "city": "dewas"}',
                    description: 'Optional static key-value pairs to send along with the job (object format)',
                    displayOptions: {
                        show: {
                            resource: ['job'],
                            operation: ['processJob'],
                        },
                    },
                },
                // ─── JOB RESULTS: Result Format ────────────────────────────────────
                {
                    displayName: 'Result Format',
                    name: 'resultFormat',
                    type: 'options',
                    required: true,
                    default: 'json',
                    options: [
                        {
                            name: 'JSON',
                            value: 'json',
                            description: 'Return results as JSON',
                        },
                        {
                            name: 'CSV',
                            value: 'csv',
                            description: 'Return results as CSV',
                        },
                    ],
                    description: 'The format of the returned results',
                    displayOptions: {
                        show: {
                            resource: ['job'],
                            operation: ['jobResults'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f;
        const items = this.getInputData();
        const returnData = [];
        const BASE_URL = "https://api.docuprox.com/v1";
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                const credentials = await this.getCredentials('docuProxApi', i);
                console.log(`[DocuProx] i=${i} | Resource=${resource} | Operation=${operation} | API Key: ${credentials.apiKey}`);
                // ─── PROCESS ───────────────────────────────────────────────────
                if (resource === 'document' && operation === 'process') {
                    const templateId = this.getNodeParameter('templateId', i);
                    const imageSource = this.getNodeParameter('imageSource', i);
                    if (!templateId || templateId.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i, description: 'Find your Template ID in the DocuProx dashboard: https://app.docuprox.com/login' });
                    }
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(templateId.trim())) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID must be a valid UUID (e.g. 29ce218f-c9d2-4d4a-b7fd-167ed9bb086f)', { itemIndex: i, description: 'Find your Template ID in the DocuProx dashboard: https://app.docuprox.com/login' });
                    }
                    let imageData;
                    if (imageSource === 'upload') {
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                        if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required when using Upload Image', { itemIndex: i, description: 'This is the property name of the binary data from the previous node. Default is "data".' });
                        }
                        if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`, { itemIndex: i, description: 'Connect a node that outputs a file (e.g. Read Binary File, HTTP Request, Google Drive) before this node.' });
                        }
                        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                        imageData = buffer.toString('base64');
                    }
                    else {
                        imageData = this.getNodeParameter('base64Image', i);
                        if (!imageData || imageData.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Base64 Image is required when using Base64 String option', { itemIndex: i, description: 'Provide a valid Base64 encoded string. Make sure it includes the image data after the base64, prefix.' });
                        }
                        if (imageData.includes('base64,')) {
                            imageData = imageData.split('base64,')[1];
                        }
                    }
                    // ── Optional static_values ──────────────────────────────────
                    const rawStaticValues = this.getNodeParameter('staticValues', i, null);
                    const staticValues = parseStaticValues(rawStaticValues, 'Document Process');
                    // ── Build request body ──────────────────────────────────────
                    const requestBody = {
                        template_id: templateId,
                        actual_image: imageData,
                    };
                    if (staticValues) {
                        requestBody.static_values = staticValues;
                    }
                    console.log(`[DocuProx] process → template_id: ${templateId} | imageLength: ${imageData.length} | static_values: ${staticValues ? JSON.stringify(staticValues) : 'not provided'}`);
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'docuProxApi', {
                        method: 'POST',
                        url: `${BASE_URL}/process`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: requestBody,
                        json: true,
                        timeout: 60000,
                    });
                    const processOutput = {
                        success: true,
                        templateId,
                        response,
                        timestamp: new Date().toISOString(),
                    };
                    if (staticValues) {
                        processOutput.staticValues = staticValues;
                    }
                    returnData.push({
                        json: processOutput,
                        pairedItem: { item: i },
                    });
                }
                // ─── PROCESS AGENT ─────────────────────────────────────────────
                else if (resource === 'document' && operation === 'process_agent') {
                    const imageSource = this.getNodeParameter('imageSource', i);
                    const selectionMethod = this.getNodeParameter('selectionMethod', i, 'structured');
                    let payload;
                    if (selectionMethod === 'manual') {
                        const payloadRaw = this.getNodeParameter('payload', i);
                        try {
                            if (typeof payloadRaw === 'string') {
                                payload = JSON.parse(payloadRaw);
                            }
                            else {
                                payload = payloadRaw;
                            }
                        }
                        catch (e) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid JSON in Payload field', { itemIndex: i, description: 'Ensure the JSON is valid. Use a tool like jsonlint.com to check your syntax.' });
                        }
                    }
                    else {
                        // Structured Mode: Build payload from individual fields
                        const documentType = this.getNodeParameter('documentType', i, '');
                        const customInstructions = this.getNodeParameter('customInstructions', i, '');
                        const prompts = this.getNodeParameter('prompts', i, { values: [] });
                        const staticValuesArr = this.getNodeParameter('staticValuesAgent', i, { values: [] });
                        payload = {
                            document_type: documentType,
                            custom_instructions: customInstructions,
                            prompt_json: {},
                            static_values: {},
                        };
                        // Build prompt_json object
                        if (prompts.values) {
                            for (const prompt of prompts.values) {
                                if (prompt.key) {
                                    payload.prompt_json[prompt.key] = prompt.value;
                                }
                            }
                        }
                        // Build static_values object
                        if (staticValuesArr.values) {
                            for (const val of staticValuesArr.values) {
                                if (val.key) {
                                    payload.static_values[val.key] = val.value;
                                }
                            }
                        }
                    }
                    if (!payload || typeof payload !== 'object') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Payload must be a valid JSON object', { itemIndex: i, description: 'Ensure the JSON is valid. Use a tool like jsonlint.com to check your syntax.' });
                    }
                    let imageData;
                    if (imageSource === 'upload') {
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                        if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required', { itemIndex: i, description: 'This is the property name of the binary data from the previous node. Default is "data".' });
                        }
                        if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}"`, { itemIndex: i, description: 'Connect a node that outputs a file (e.g. Read Binary File, HTTP Request, Google Drive) before this node.' });
                        }
                        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                        imageData = buffer.toString('base64');
                    }
                    else {
                        imageData = this.getNodeParameter('base64Image', i);
                        if (!imageData || imageData.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Base64 Image is required', { itemIndex: i, description: 'Provide a valid Base64 encoded string. Make sure it includes the image data after the base64, prefix.' });
                        }
                        if (imageData.includes('base64,')) {
                            imageData = imageData.split('base64,')[1];
                        }
                    }
                    console.log(`[DocuProx] process-agent → payload: ${JSON.stringify(payload)} | imageLength: ${imageData.length}`);
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'docuProxApi', {
                        method: 'POST',
                        url: `${BASE_URL}/process-agent`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: {
                            actual_image: imageData,
                            payload: payload,
                        },
                        json: true,
                        timeout: 120000,
                    });
                    returnData.push({
                        json: {
                            success: true,
                            response,
                            timestamp: new Date().toISOString(),
                        },
                        pairedItem: { item: i },
                    });
                }
                // ─── SUBMIT JOB ────────────────────────────────────────────────
                else if (resource === 'job' && operation === 'processJob') {
                    const templateId = this.getNodeParameter('templateId', i);
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                    if (!templateId || templateId.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i, description: 'Find your Template ID in the DocuProx dashboard: https://app.docuprox.com/login' });
                    }
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(templateId.trim())) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID must be a valid UUID (e.g. 29ce218f-c9d2-4d4a-b7fd-167ed9bb086f)', { itemIndex: i, description: 'Find your Template ID in the DocuProx dashboard: https://app.docuprox.com/login' });
                    }
                    if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required', { itemIndex: i, description: 'This is the property name of the binary data from the previous node. Default is "data".' });
                    }
                    if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`, { itemIndex: i, description: 'Connect a node that outputs a file (e.g. Read Binary File, HTTP Request, Google Drive) before this node.' });
                    }
                    const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const zipBase64 = buffer.toString('base64');
                    // ── Optional static_values ────────────────────────────────
                    const rawStaticValues = this.getNodeParameter('staticValues', i, null);
                    const staticValues = parseStaticValues(rawStaticValues, 'Submit Job');
                    // ── Build request body ────────────────────────────────────
                    const requestBody = {
                        template_id: templateId,
                        actual_image: zipBase64,
                    };
                    if (staticValues) {
                        requestBody.static_values = staticValues;
                    }
                    console.log(`[DocuProx] process-job → template_id: ${templateId} | zipBase64Length: ${zipBase64.length} | static_values: ${staticValues ? JSON.stringify(staticValues) : 'not provided'}`);
                    let response;
                    try {
                        response = await this.helpers.httpRequestWithAuthentication.call(this, 'docuProxApi', {
                            method: 'POST',
                            url: `${BASE_URL}/process-job`,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: requestBody,
                            json: true,
                            timeout: 120000,
                        });
                    }
                    catch (error) {
                        console.error('========== DocuProx ERROR ==========');
                        console.error('Message:', error.message);
                        console.error('API Response Body:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.body) || ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || 'N/A');
                        console.error('Status Code:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.statusCode) || 'N/A');
                        console.error('====================================');
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `DocuProx API Error: ${error.message}`, { itemIndex: i, description: 'Check your API key credentials or visit https://app.docuprox.com/login' });
                    }
                    console.log('========== DocuProx RESPONSE ==========');
                    console.log(JSON.stringify(response, null, 2));
                    console.log('=======================================');
                    const jobOutput = {
                        success: true,
                        templateId,
                        response,
                        timestamp: new Date().toISOString(),
                    };
                    if (staticValues) {
                        jobOutput.staticValues = staticValues;
                    }
                    returnData.push({
                        json: jobOutput,
                        pairedItem: { item: i },
                    });
                }
                // ─── JOB STATUS ────────────────────────────────────────────────
                else if (resource === 'job' && operation === 'jobStatus') {
                    const jobId = this.getNodeParameter('jobId', i);
                    if (!jobId || jobId.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i, description: 'The Job ID is returned when you run Submit Job. Check your previous workflow execution.' });
                    }
                    console.log(`[DocuProx] jobStatus → job_id: ${jobId}`);
                    let response;
                    try {
                        response = await this.helpers.httpRequestWithAuthentication.call(this, 'docuProxApi', {
                            method: 'GET',
                            url: `${BASE_URL}/job-status`,
                            headers: {
                                'Accept': 'application/json',
                            },
                            qs: {
                                job_id: jobId,
                            },
                            json: true,
                            timeout: 30000,
                        });
                    }
                    catch (error) {
                        console.error('========== DocuProx ERROR ==========');
                        console.error('Message:', error.message);
                        console.error('API Response Body:', ((_d = error.response) === null || _d === void 0 ? void 0 : _d.body) || ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || 'N/A');
                        console.error('Status Code:', ((_f = error.response) === null || _f === void 0 ? void 0 : _f.statusCode) || 'N/A');
                        console.error('====================================');
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `DocuProx API Error: ${error.message}`, { itemIndex: i, description: 'Check your API key credentials or visit https://app.docuprox.com/login' });
                    }
                    console.log('========== DocuProx RESPONSE ==========');
                    console.log(JSON.stringify(response, null, 2));
                    console.log('=======================================');
                    returnData.push({
                        json: {
                            success: true,
                            jobId,
                            response,
                            timestamp: new Date().toISOString(),
                        },
                        pairedItem: { item: i },
                    });
                }
                // ─── JOB RESULTS ───────────────────────────────────────────────
                else if (resource === 'job' && operation === 'jobResults') {
                    const jobId = this.getNodeParameter('jobId', i);
                    const resultFormat = this.getNodeParameter('resultFormat', i);
                    if (!jobId || jobId.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i, description: 'The Job ID is returned when you run Submit Job. Check your previous workflow execution.' });
                    }
                    console.log(`[DocuProx] jobResults → job_id: ${jobId} | format: ${resultFormat}`);
                    const isJson = resultFormat === 'json';
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'docuProxApi', {
                        method: 'POST',
                        url: `${BASE_URL}/job-results`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': isJson ? 'application/json' : 'text/csv',
                        },
                        body: {
                            job_id: jobId,
                            result_format: resultFormat,
                        },
                        json: isJson,
                        encoding: isJson ? undefined : 'utf8',
                        timeout: 60000,
                    });
                    if (isJson) {
                        const dataArray = Array.isArray(response) ? response : [response];
                        returnData.push({
                            json: {
                                success: true,
                                jobId,
                                resultFormat,
                                total_records: dataArray.length,
                                results: dataArray,
                                timestamp: new Date().toISOString(),
                            },
                            pairedItem: { item: i },
                        });
                    }
                    else {
                        const csvString = typeof response === 'string' ? response : String(response);
                        const rows = csvString.split('\n').filter(line => line.trim() !== '');
                        const totalRecords = rows.length > 1 ? rows.length - 1 : 0;
                        returnData.push({
                            json: {
                                success: true,
                                jobId,
                                resultFormat,
                                total_records: totalRecords,
                                results_csv: csvString,
                                timestamp: new Date().toISOString(),
                            },
                            binary: {
                                data: await this.helpers.prepareBinaryData(Buffer.from(csvString, 'utf8'), `job_${jobId}_results.csv`, 'text/csv'),
                            },
                            pairedItem: { item: i },
                        });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.DocuProx = DocuProx;
