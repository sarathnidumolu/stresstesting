# Service Bus Publish Test - Stress Testing

A k6 load testing script for stress testing Azure Service Bus message publishing with custom payloads.

## Overview

This project provides a stress testing framework using k6 to publish messages to an Azure Service Bus queue. It simulates multiple virtual users (VUs) sending messages with data loaded from a CSV file, useful for performance and load testing of Service Bus infrastructure.

## Prerequisites

- **k6** - Load testing tool (v0.48.0 or later)
- **Node.js** - For running related utilities (optional)
- **Azure Service Bus** - Active Service Bus namespace with a queue
- **SAS Token** - Service Bus access credentials

## Installation

1. Install k6: https://k6.io/docs/getting-started/installation/
2. Clone or download this project

## Configuration

### Environment Variables

Set the following environment variables before running the test:

```bash
SERVICE_BUS_NAMESPACE=mybus.servicebus.windows.net
SERVICE_BUS_QUEUE_NAME=my-queue-name
SERVICE_BUS_SAS_TOKEN=SharedAccessSignature=...
```

### Test Data

The `testdata.csv` file contains the message payloads with the following format:

```csv
projectId,requestId,url
project-123,request-456,https://example.com/document.pdf
project-789,request-012,https://example.com/another.pdf
```

### Load Testing Options

In `servicebus_publish_test.js`, modify the `options` object:

```javascript
export const options = {
    vus: 20,           // Number of virtual users
    iterations: 20     // Iterations per VU
};
```

## Running the Test

Execute the k6 test with environment variables:

```bash
k6 run --env SERVICE_BUS_NAMESPACE=mybus.servicebus.windows.net --env SERVICE_BUS_QUEUE_NAME=my-queue --env SERVICE_BUS_SAS_TOKEN="your-sas-token" servicebus_publish_test.js
```

Or set environment variables in your shell and run:

```bash
k6 run servicebus_publish_test.js
```

## Output

The script generates:

- **HTML Report** - Visual summary of test results
- **Text Summary** - Console output with performance metrics
- **Console Logs** - Detailed request/response information for debugging

## Files

- `servicebus_publish_test.js` - Main k6 load testing script
- `testdata.csv` - CSV file containing message payload data
- `README.md` - This file

## Success Criteria

The test validates:

- HTTP 201 (Accepted) response status
- No 401 (Unauthorized) responses
- No 403 (Forbidden) responses
- No 400 (Bad Request) responses
