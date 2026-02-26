import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionTypes,
} from 'n8n-workflow';

function getMimeType(filename: string): string {
	if (!filename || filename.indexOf('.') === -1) {
		return 'application/octet-stream';
	}

	const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

	const mimeTypes: Record<string, string> = {
		'.zip':  'application/zip',
		'.pdf':  'application/pdf',
		'.jpg':  'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png':  'image/png',
		'.gif':  'image/gif',
		'.webp': 'image/webp',
		'.tiff': 'image/tiff',
		'.tif':  'image/tiff',
		'.bmp':  'image/bmp',
	};

	return mimeTypes[ext] || 'application/octet-stream';
}
export class DocuProx implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'DocuProx',
		name: 'docuProx',
		icon: 'file:douprox-logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Process documents using DocuProx API',
		defaults: {
			name: 'DocuProx',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
						operation: ['process'],
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
						operation: ['process'],
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
						operation: ['process'],
						imageSource: ['base64'],
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

			// ─── SUBMIT JOB: Static Values ─────────────────────────────────────
			{
				displayName: 'Static Values',
				name: 'staticValues',
				type: 'json',
				required: false,
				default: '{}',
				placeholder: '{"name_1": "monika12", "city": "dewas"}',
				description: 'Optional static key-value pairs to send along with the job',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// ── Base API URL ────────────────────────────────────────────────────────
		const BASE_URL = 'https://awcgg2gryd.execute-api.us-east-1.amazonaws.com/staging/v1';

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// ── Debug: log credentials ──────────────────────────────────────
				const credentials = await this.getCredentials('docuProxApi', i);
				console.log(`[DocuProx] i=${i} | Resource=${resource} | Operation=${operation} | API Key: ${credentials.apiKey}`);

				// ─── PROCESS ───────────────────────────────────────────────────
				if (resource === 'document' && operation === 'process') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const imageSource = this.getNodeParameter('imageSource', i) as string;

					if (!templateId || templateId.trim() === '') {
						throw new NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i });
					}

					let imageData: string;

					if (imageSource === 'upload') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

						if (!binaryPropertyName || binaryPropertyName.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Binary Property Name is required when using Upload Image',
								{ itemIndex: i },
							);
						}

						if (!items[i].binary || !items[i].binary![binaryPropertyName]) {
							throw new NodeOperationError(
								this.getNode(),
								`No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`,
								{ itemIndex: i },
							);
						}

						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						imageData = buffer.toString('base64');

					} else {
						imageData = this.getNodeParameter('base64Image', i) as string;

						if (!imageData || imageData.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Base64 Image is required when using Base64 String option',
								{ itemIndex: i },
							);
						}

						if (imageData.includes('base64,')) {
							imageData = imageData.split('base64,')[1];
						}
					}

					console.log(`[DocuProx] process → template_id: ${templateId} | imageLength: ${imageData.length}`);

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'docuProxApi',
						{
							method: 'POST',
							url: `${BASE_URL}/process`,
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/json',
							},
							body: {
								template_id: templateId,
								actual_image: imageData,
							},
							json: true,
							timeout: 60000,
						},
					);

					returnData.push({
						json: {
							success: true,
							templateId,
							response,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
				}


		// ─── SUBMIT JOB ──────────────────────────────────────────────────────────
		else if (resource === 'job' && operation === 'processJob') {
		const templateId = this.getNodeParameter('templateId', i) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

		if (!templateId || templateId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Template ID is required', { itemIndex: i });
		}

		if (!binaryPropertyName || binaryPropertyName.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Binary Property Name is required', { itemIndex: i });
		}

		if (!items[i].binary || !items[i].binary![binaryPropertyName]) {
			throw new NodeOperationError(
			this.getNode(),
			`No binary data found for property "${binaryPropertyName}". Make sure the previous node outputs a file.`,
			{ itemIndex: i },
			);
		}

		const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		const zipBase64 = buffer.toString('base64');

		console.log(`[DocuProx] process-job → template_id: ${templateId} | zipBase64Length: ${zipBase64.length}`);

		let response: any;
		try {
			response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'docuProxApi',
			{
				method: 'POST',
				url: `${BASE_URL}/process-job`,
				headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				},
				body: {
				template_id: templateId,
				actual_image: zipBase64,
				},
				json: true,
				timeout: 120000,
			},
			);
		} catch (error: any) {
			console.error('========== DocuProx ERROR ==========');
			console.error('Message:', error.message);
			console.error('API Response Body:', error.response?.body || error.response?.data || 'N/A');
			console.error('Status Code:', error.response?.statusCode || 'N/A');
			console.error('====================================');
			throw new NodeOperationError(
			this.getNode(),
			`DocuProx API Error: ${error.message}`,
			{ itemIndex: i },
			);
		}

		console.log('========== DocuProx RESPONSE ==========');
		console.log(JSON.stringify(response, null, 2));
		console.log('=======================================');

		returnData.push({
			json: {
			success: true,
			templateId,
			response,
			timestamp: new Date().toISOString(),
			},
			pairedItem: { item: i },
		});
	}
				
			// ─── JOB STATUS ──────────────────────────────────────────────────────────
			else if (resource === 'job' && operation === 'jobStatus') {
			const jobId = this.getNodeParameter('jobId', i) as string;

			if (!jobId || jobId.trim() === '') {
				throw new NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
			}

			console.log(`[DocuProx] jobStatus → job_id: ${jobId}`);

			let response: any;
			try {
				response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'docuProxApi',
				{
					method: 'GET',
					url: `${BASE_URL}/job-status`,
					headers: {
					'Accept': 'application/json',
					},
					qs: {
					job_id: jobId,   // ✅ sends as ?job_id=xxx
					},
					json: true,
					timeout: 30000,
				},
				);
			} catch (error: any) {
				console.error('========== DocuProx ERROR ==========');
				console.error('Message:', error.message);
				console.error('API Response Body:', error.response?.body || error.response?.data || 'N/A');
				console.error('Status Code:', error.response?.statusCode || 'N/A');
				console.error('====================================');
				throw new NodeOperationError(
				this.getNode(),
				`DocuProx API Error: ${error.message}`,
				{ itemIndex: i },
				);
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
					const jobId = this.getNodeParameter('jobId', i) as string;
					const resultFormat = this.getNodeParameter('resultFormat', i) as string;

					if (!jobId || jobId.trim() === '') {
						throw new NodeOperationError(this.getNode(), 'Job ID is required', { itemIndex: i });
					}

					console.log(`[DocuProx] jobResults → job_id: ${jobId} | format: ${resultFormat}`);

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'docuProxApi',
						{
							method: 'POST',
							url: `${BASE_URL}/job-results`,
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/json',
							},
							body: {
								job_id: jobId,
								result_format: resultFormat,
							},
							json: true,
							timeout: 60000,
						},
					);

					returnData.push({
						json: {
							success: true,
							jobId,
							resultFormat,
							response,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
				}

			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message,
							errorDetails: error.response?.body || error.response?.data || null,
							timestamp: new Date().toISOString(),
						},
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`DocuProx API Error: ${error.message}`,
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}
}