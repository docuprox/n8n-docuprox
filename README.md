# n8n-nodes-docuprox

An n8n custom node for integrating with the DocuProx API to process documents using AI-powered document processing templates.

## Description

This n8n node allows you to process documents by providing a template ID and an image (either as a binary file upload or base64 encoded string). The node communicates with the DocuProx API to extract structured data from documents based on predefined templates.

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Copy the `dist` folder to your n8n custom nodes directory
6. Restart n8n

## Usage

1. Add the "DocuProx" node to your n8n workflow
2. Configure your DocuProx API credentials (see Configuration section)
3. Set the Template ID for the document processing template you want to use
4. Choose your image source:
   - **Upload Image File**: Provide the binary property name containing the image file
   - **Base64 String**: Directly input the base64 encoded image data
5. Execute the workflow

The node will return the processed document data from the DocuProx API.

## Configuration

### Credentials Setup

Before using the node, you need to set up your DocuProx API credentials:

1. Go to your n8n instance
2. Navigate to Settings > Credentials
3. Create a new credential of type "DocuProx API"
4. Enter your DocuProx API key
5. Save the credential

### Node Properties

- **Template ID** (required): The ID of the template to use for document processing
- **Image Source** (required):
  - Upload Image File: Upload an image file from binary data
  - Base64 String: Provide image as Base64 encoded string
- **Binary Property Name** (required when using Upload): Name of the binary property containing the image file
- **Base64 Image** (required when using Base64): The base64 encoded image data

## API Reference

### Input
- Template ID: String
- Image: Binary file or Base64 string

### Output
- Success status
- Template ID used
- API response data
- Timestamp

### Error Handling
The node includes comprehensive error handling and will return error details if the API call fails. You can configure the node to continue on failure or stop the workflow.

## Development

### Prerequisites
- Node.js
- npm
- n8n instance

### Scripts
- `npm run build`: Build the TypeScript code and copy assets
- `npm run dev`: Watch mode for development
- `npm run format`: Format code with Prettier
- `npm run lint`: Lint code with ESLint

### Project Structure
```
├── credentials/
│   └── DocuProxApi.credentials.ts    # API credentials definition
├── nodes/
│   └── DocuProx/
│       ├── DocuProx.node.ts          # Main node implementation
│       └── douprox-logo.svg          # Node icon
├── dist/                             # Built files
├── package.json
├── tsconfig.json
└── README.md
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
