# n8n-nodes-docuprox

An n8n custom node for integrating with the DocuProx API to process documents using AI-powered document processing templates.

## Description

This n8n node allows you to process documents using the DocuProx API. It supports:

- **Real-time Processing**: Process individual documents with predefined templates.
- **Process Agent**: Use AI-powered extraction with custom prompts (no template needed).
- **Batch Jobs**: Submit a ZIP of files for background processing and retrieve results later.

Check out our full [Documentation & Usage Guide](https://docuprox.com/docs/) for more details.

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

1. **Add Node**: Drag the DocuProx node into your workflow.
2. **Configure Credentials**: Set up your DocuProx API key.
3. **Select Resource**:
   - **Document**: For real-time processing.
     - _Operation - Process_: Use a Template ID.
     - _Operation - Process Agent_: Use the **Structured Form** to add extraction prompts (e.g. key: `passport_no`, value: `extract the ID number`).
   - **Job**: For batch processing.
     - _Submit Job_: Upload a ZIP file and get a `Job ID`.
     - _Get Job Status_: Check if your batch is ready.
     - _Get Job Results_: Retrieve results in JSON or CSV format.
4. **Execute**: Run the node to get your structured document data.

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
