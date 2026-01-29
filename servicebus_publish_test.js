import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";

// ---------- k6 Options ----------
export const options = {
    vus: 20,
    iterations: 20
};

const csvData = new SharedArray("payloads", function () {
    return open("./testdata.csv")
        .trim()
        .split("\n")
        .slice(1) // remove header
        .map(line => {
            const [projectId, requestId, url] = line.split(",");
            return { projectId, requestId, url };
        });
});

// ---------- ENV ----------
const SERVICE_BUS_NAMESPACE = __ENV.SERVICE_BUS_NAMESPACE;// mybus.servicebus.windows.net
const QUEUE_NAME = __ENV.SERVICE_BUS_QUEUE_NAME;
const SAS_TOKEN = __ENV.SERVICE_BUS_SAS_TOKEN;

if

    (!SERVICE_BUS_NAMESPACE || !QUEUE_NAME || !SAS_TOKEN) {
    throw new Error('Missing Service Bus environment variables');
}

// ---------- URL ----------
const SB_URL = `https://${SERVICE_BUS_NAMESPACE}/${QUEUE_NAME}/messages`;

// ---------- MAIN ----------
export default function () {

    const load = csvData[__VU - 1];
    const projectId = load.projectId;
    const requestId = load.requestId; // same logic as your Node script

    const planSets = [
        {
            name: 'MTP-5559_dfa6d23c-b4fc-48f1-9e5d-45f326cbf304.pdf',
            id: `plan_${__VU}_${__ITER}`,
            url: load.url,
        }
    ];

    // ---------- Message Body (EXACT MATCH) ----------
    const messageBody = {
        metadata: {
            eventDataVersion: '1.0',
            publisher: {
                additionalData: {},
                environment: 'dev',
                product: 'n8n',
                subsystem: 'Estimate Orchestration',
            },
            transactionId: uuidv4(),
        },
        eventData: {
            projectId,
            requestId,
            planSets,
        },
    };

    // ---------- Headers ----------
    const headers = {
        Authorization: SAS_TOKEN,
        'Content-Type': 'application/json',
    };

    console.log('Request ID:', requestId);
    console.log('URL:', SB_URL);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(messageBody, null, 2));

    // ---------- Send ----------
    const res = http.post(SB_URL, JSON.stringify(messageBody), { headers });

    console.log('Status:', res.status);
    console.log('Response Body:', res.body);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Full Response:', JSON.stringify({
        status: res.status,
        body: res.body,
        headers: res.headers,
    }, null, 2));

    check(res, {
        'message accepted (201)': (r) => r.status === 201,
        'status is not 401': (r) => r.status !== 401,
        'status is not 403': (r) => r.status !== 403,
        'status is not 400': (r) => r.status !== 400,
    });

    sleep(3);
}


export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
        "summary.txt": textSummary(data, { indent: " ", enableColors: false }),
        "summary.html": htmlReport(data)
    };
}
