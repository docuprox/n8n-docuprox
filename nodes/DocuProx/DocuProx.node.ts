import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class DocuProx implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DocuProx',
		name: 'docuProx',
		icon: 'file:douprox-logo.png',
		group: ['transform'],
		version: 1,
		description: 'Process documents using DocuProx API',
		defaults: {
			name: 'DocuProx',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'docuProxApi',
				required: true,
			},
		],
		properties: [
			// Template ID Field
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Enter Template ID',
				description: 'The ID of the template to use for document processing',
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
				// Get all required parameters
				const templateId = this.getNodeParameter('templateId', i) as string;
				const imageSource = this.getNodeParameter('imageSource', i) as string;

				// Validate required fields
				if (!templateId || templateId.trim() === '') {
					throw new NodeOperationError(
						this.getNode(),
						'Template ID is required',
						{ itemIndex: i }
					);
				}

				let imageData: string;

				// Handle image based on source type
				if (imageSource === 'upload') {
					// Get image from binary data
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					
					if (!binaryPropertyName || binaryPropertyName.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Binary Property Name is required when using Upload Image',
							{ itemIndex: i }
						);
					}

					// Get binary data
					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					
					// Convert to base64
					imageData = buffer.toString('base64');
				} else {
					// Get image from base64 input
					imageData = this.getNodeParameter('base64Image', i) as string;
					
					if (!imageData || imageData.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Base64 Image is required when using Base64 String option',
							{ itemIndex: i }
						);
					}

					// Remove data URI prefix if present
					if (imageData.includes('base64,')) {
						imageData = imageData.split('base64,')[1];
					}
				}

				// Prepare API request body
				const requestBody = {
					template_id: templateId,
					actual_image: imageData,
				};

				console.log('Payload for API:', requestBody);

				// Make API call to DocuProx with credentials
				const response = await this.helpers.requestWithAuthentication.call(
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

				// Return the API response
				returnData.push({
					json: {
						success: true,
						templateId: templateId,
						response: response,
						timestamp: new Date().toISOString(),
					},
					pairedItem: { item: i },
				});

			} catch (error: any) {
				// Handle errors
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

				// Log error details
				console.error('DocuProx API Error:', error.message);
				if (error.response) {
					console.error('Response Status:', error.response.statusCode);
					console.error('Response Body:', error.response.body);
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


