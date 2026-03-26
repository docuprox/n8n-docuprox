# n8n-nodes-docuprox

[![npm version](https://img.shields.io/npm/v/n8n-nodes-docuprox.svg)](https://www.npmjs.com/package/n8n-nodes-docuprox)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-orange)](https://www.npmjs.com/package/n8n-nodes-docuprox)

An **n8n community node** for AI-powered document processing and data extraction via the [DocuProx API](https://docuprox.com). Extract structured data from documents using manual or AI-generated prompts — no template required.

> Automate document data extraction in your n8n workflows. Supports invoices, passports, ID cards, receipts, contracts, and more.

## What is DocuProx?

[DocuProx](https://docuprox.com) is an AI-powered document extraction platform. This n8n node lets you integrate DocuProx directly into your automation workflows — extract structured fields from any document image in real-time or process thousands of documents via batch jobs.

## Features

- **AI Agent Extraction** — Extract any field using natural language prompts. No dashboard template needed.
- **Template-Based Extraction** — Use a pre-built Template ID (UUID) from your DocuProx dashboard for consistent, structured extraction.
- **Batch Processing** — Submit a ZIP of documents for high-volume background processing and retrieve results in JSON or CSV.
- **Flexible Input** — Supports binary file uploads and Base64 encoded images.
- **Real-Time Results** — Synchronous processing returns structured data immediately.

## Supported Document Types

Works with any document type, including:

- Passports & ID Cards
- Invoices & Receipts
- Contracts & Agreements
- Bank Statements
- Medical Records
- Custom document types via AI prompts

## Installation

### Via n8n Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Search for `n8n-nodes-docuprox`
4. Click **Install**
5. Restart n8n

### Manual Installation

```bash
npm install n8n-nodes-docuprox
```

## Credentials Setup

1. Go to **Settings → Credentials** in your n8n instance
2. Create a new credential of type **DocuProx API**
3. Enter your [DocuProx API key](https://docuprox.com)
4. Save the credential

## Usage

### Document → Process Agent _(AI extraction, no template needed)_

Use natural language prompts to extract any field from a document without creating a dashboard template.

1. Select **Resource**: `Document`
2. Select **Operation**: `Process Agent`
3. Choose **Selection Method**: `Structured Form`
4. Set **Document Type** (e.g. `passport`, `invoice`)
5. Add **Prompts** — define fields to extract:
   - Key: `passport_number` → Instruction: `Extract the passport number`
   - Key: `full_name` → Instruction: `Extract the full name`
6. Upload your document image

### Document → Process _(Template-based extraction)_

Use a Template ID (UUID) from your DocuProx dashboard for structured extraction.

1. Select **Resource**: `Document`
2. Select **Operation**: `Process`
3. Enter your **Template ID** (UUID)
4. Upload your document image

### Job → Batch Processing

Submit a ZIP file containing multiple documents for high-volume background processing.

1. **Submit Job** — Upload ZIP + Template ID → returns a `Job ID`
2. **Get Job Status** — Poll with `Job ID` until status is `SUCCESS`
3. **Get Job Results** — Retrieve extracted data in JSON or CSV format

## Node Properties

**Document → Process**
| Field | Required | Description |
|---|---|---|
| Template ID | Yes | UUID from your DocuProx dashboard |
| Image Source | Yes | Binary file upload or Base64 string |
| Static Values | No | Additional key-value metadata |

**Document → Process Agent**
| Field | Required | Description |
|---|---|---|
| Selection Method | Yes | Structured Form or Manual JSON |
| Document Type | Yes | e.g. `passport`, `invoice`, `receipt` |
| Custom Instructions | No | Natural language guidance for the AI |
| Prompts | Yes | Field name + extraction instruction pairs |
| Static Values | No | Additional key-value metadata |

**Job → Submit Job**
| Field | Required | Description |
|---|---|---|
| Template ID | Yes | UUID from your DocuProx dashboard |
| Binary Property Name | Yes | Property containing the ZIP file |
| Static Values | No | Additional key-value metadata |

**Job → Get Job Status / Get Job Results**
| Field | Required | Description |
|---|---|---|
| Job ID | Yes | UUID returned from Submit Job |
| Result Format | No | `json` (default) or `csv` |

## Job Status Values

| Status | Description |
|---|---|
| `NEW` | Job created and queued for processing |
| `UNZIP FILE` | Extracting files from the uploaded ZIP archive |
| `UNZIP FILE SUCCESS` | ZIP extraction completed successfully |
| `UNZIP FILE FAILED` | ZIP extraction failed |
| `PROCESS IMAGE` | Processing document images for data extraction |
| `PROCESS IMAGE SUCCESS` | Image processing completed successfully |
| `PROCESS IMAGE FAILED` | Image processing failed |
| `SUCCESS` | Job completed — results are ready to retrieve |
| `FAILED` | Job processing failed |

## API Reference

### Input

| Operation | Key Inputs |
|---|---|
| Process | Template ID (UUID), Image (binary or Base64), Static Values (optional) |
| Process Agent | Document Type, Custom Instructions, Prompts (key-value), Image |
| Submit Job | Template ID (UUID), ZIP file (binary), Static Values (optional) |
| Get Job Status | Job ID (UUID) |
| Get Job Results | Job ID (UUID), Result Format (JSON or CSV) |

### Output

| Operation | Output Fields |
|---|---|
| Process | `success`, `templateId`, `response`, `timestamp` |
| Process Agent | `success`, `response`, `timestamp` |
| Submit Job | `success`, `templateId`, `response`, `timestamp` |
| Get Job Status | `success`, `jobId`, `response`, `timestamp` |
| Get Job Results | `success`, `jobId`, `resultFormat`, `total_records`, `results` / `results_csv` |

### Error Handling

The node includes built-in error handling. Enable **Continue on Fail** in the node settings to handle errors gracefully within your workflow.

## Resources

- [DocuProx Documentation](https://docuprox.com/docs/)
- [Getting Started Guide](https://docuprox.com/docs/getting-started/)
- [n8n Integration Guide](https://docuprox.com/docs/integration/n8n/)
- [DocuProx Dashboard](https://app.docuprox.com/login)

## Development

```bash
npm install       # Install dependencies
npm run build     # Build TypeScript
npm run dev       # Watch mode
```

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
└── README.md
```

### Release & npm Publish

1. Add `NPM_TOKEN` to GitHub repository secrets
2. Bump `version` in `package.json`
3. Push a tag in `vX.Y.Z` format (e.g. `v1.0.9`)
4. GitHub Actions will build and run `npm publish --provenance`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
