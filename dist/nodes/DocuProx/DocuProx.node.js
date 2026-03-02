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
function parseStaticValues(raw) {
    if (raw === null || raw === undefined)
        return undefined;
    // ✅ n8n returns [null] or [undefined] for empty json fields — reject any array
    if (Array.isArray(raw)) {
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
        return undefined;
    }
    // Reject empty objects
    if (Object.keys(parsed).length === 0) {
        return undefined;
    }
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
            description: 'Process documents using DocuProx API',
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
                // ─── Resource Selector ─────────────────────────────────────────────
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    options: [
                        {
                            name: 'Document',
                            value: 'document',
                            description: 'Real-time document processing',
                        },
                        {
                            name: 'Job',
                            value: 'job',
                            description: 'Background job submission and management',
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
                            name: 'Process',
                            value: 'process',
                            action: 'Process a document',
                            description: 'Process a document in real-time with a template',
                        },
                        {
                            name: 'Process Agent',
                            value: 'process_agent',
                            action: 'Process with agent',
                            description: 'Process a document using AI agent with custom instructions and extraction prompts',
                        },
                    ],
                    default: 'process',
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
                            description: 'Submit a batch job with a template ID and ZIP file',
                        },
                        {
                            name: 'Get Job Status',
                            value: 'jobStatus',
                            action: 'Get job status',
                            description: 'Get the status of a submitted job',
                        },
                        {
                            name: 'Get Job Results',
                            value: 'jobResults',
                            action: 'Get job results',
                            description: 'Retrieve the results of a completed job',
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
                    description: 'The ID of the template to use',
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
                    description: 'The ID of the job',
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
        const items = this.getInputData();
        const returnData = [];
        const BASE_URL = "https://api.docuprox.com/v1";
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                const credentials = await this.getCredentials('docuProxApi', i);
                // ─── PROCESS ───────────────────────────────────────────────────
                if (resource === 'document' && operation === 'process') {
                    const templateId = this.getNodeParameter('templateId', i);
                    const imageSource = this.getNodeParameter('imageSource', i);
                    if (!templateId || templateId.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i });
                    }
                    let imageData;
                    if (imageSource === 'upload') {
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                        if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required when using Upload Image', { itemIndex: i });
                        }
                        if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`, { itemIndex: i });
                        }
                        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                        imageData = buffer.toString('base64');
                    }
                    else {
                        imageData = this.getNodeParameter('base64Image', i);
                        if (!imageData || imageData.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Base64 Image is required when using Base64 String option', { itemIndex: i });
                        }
                        if (imageData.includes('base64,')) {
                            imageData = imageData.split('base64,')[1];
                        }
                    }
                    // ── Optional static_values ──────────────────────────────────
                    const rawStaticValues = this.getNodeParameter('staticValues', i, null);
                    const staticValues = parseStaticValues(rawStaticValues);
                    // ── Build request body ──────────────────────────────────────
                    const requestBody = {
                        template_id: templateId,
                        actual_image: imageData,
                    };
                    if (staticValues) {
                        requestBody.static_values = staticValues;
                    }
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
                    const payloadRaw = this.getNodeParameter('payload', i);
                    let payload;
                    try {
                        if (typeof payloadRaw === 'string') {
                            payload = JSON.parse(payloadRaw);
                        }
                        else {
                            payload = payloadRaw;
                        }
                    }
                    catch (e) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid JSON in Payload field', { itemIndex: i });
                    }
                    if (!payload || typeof payload !== 'object') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Payload must be a valid JSON object', { itemIndex: i });
                    }
                    let imageData;
                    if (imageSource === 'upload') {
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                        if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required', { itemIndex: i });
                        }
                        if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}"`, { itemIndex: i });
                        }
                        const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                        imageData = buffer.toString('base64');
                    }
                    else {
                        imageData = this.getNodeParameter('base64Image', i);
                        if (!imageData || imageData.trim() === '') {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Base64 Image is required', { itemIndex: i });
                        }
                        if (imageData.includes('base64,')) {
                            imageData = imageData.split('base64,')[1];
                        }
                    }
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i });
                    }
                    if (!binaryPropertyName || binaryPropertyName.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Binary Property Name is required', { itemIndex: i });
                    }
                    if (!items[i].binary || !items[i].binary[binaryPropertyName]) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`, { itemIndex: i });
                    }
                    const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
                    const zipBase64 = buffer.toString('base64');
                    // ── Optional static_values ────────────────────────────────
                    const rawStaticValues = this.getNodeParameter('staticValues', i, null);
                    const staticValues = parseStaticValues(rawStaticValues);
                    // ── Build request body ────────────────────────────────────
                    const requestBody = {
                        template_id: templateId,
                        actual_image: zipBase64,
                    };
                    if (staticValues) {
                        requestBody.static_values = staticValues;
                    }
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `DocuProx API Error: ${error.message}`, { itemIndex: i });
                    }
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
                    }
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `DocuProx API Error: ${error.message}`, { itemIndex: i });
                    }
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
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
                    }
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
