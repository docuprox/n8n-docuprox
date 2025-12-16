import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionTypes,
} from 'n8n-workflow';

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
			// Resource Selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Document',
						value: 'document',
						description: 'Work with documents using DocuProx',
					},
				],
				default: 'document',
				required: true,
			},
			// Operation Selector
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
						description: 'Process a document with a template',
					},
				],
				default: 'process',
				required: true,
			},
			// Template ID Field
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Enter Template ID',
				description: 'The ID of the template to use for document processing',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['process'],
					},
				},
			},
			// Image Source Selection
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
			// Binary Property Name (for file upload)
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
			// Base64 Image Input
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'document' && operation === 'process') {
					const templateId = this.getNodeParameter('templateId', i) as string;
					const imageSource = this.getNodeParameter('imageSource', i) as string;

					if (!templateId || templateId.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Template ID is required',
							{ itemIndex: i }
						);
					}

					let imageData: string;

					if (imageSource === 'upload') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						
						if (!binaryPropertyName || binaryPropertyName.trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								'Binary Property Name is required when using Upload Image',
								{ itemIndex: i }
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
								{ itemIndex: i }
							);
						}

						if (imageData.includes('base64,')) {
							imageData = imageData.split('base64,')[1];
						}
					}

					const requestBody = {
						template_id: templateId,
						actual_image: imageData,
					};

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'docuProxApi',
						{
							method: 'POST',
							url: 'https://api.docuprox.com/v1/process',
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/json',
							},
							body: requestBody,
							json: true,
							timeout: 60000,
						}
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
					{ itemIndex: i }
				);
			}
		}

		return [returnData];
	}
}
