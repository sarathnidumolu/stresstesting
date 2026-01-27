import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { SharedArray } from "k6/data";

const csvData = new SharedArray("payloads", function () {
    return open("./payloads.csv")
        .trim()
        .split("\n")
        .slice(1) // remove header
        .map(line => {
            const [projectId, requestId, name, id, url] = line.split(",");
            return { projectId, requestId, name, id, url };
        });
});
export const options = {
    scenarios: {
        stress_test: {
            executor: "ramping-vus",

            stages: [
                { duration: "1m", target: 5 },
                { duration: "4m", target: 60 },
                { duration: "1m", target: 0 },
            ]
        },
    },
};
const NAMESPACE = __ENV.SB_NAMESPACE;
const QUEUE = __ENV.SB_QUEUE;
const SAS_TOKEN = __ENV.SB_SAS_TOKEN;
const BASE_URL = `https://${NAMESPACE}.servicebus.windows.net/${QUEUE}`;


export default function () {
    const load = csvData[__VU - 1];
    console.log(`VU: ${__VU} using payload: ${JSON.stringify(load)}`);
    const payload = JSON.stringify({
        projectId: load.projectId,
        requestId: load.requestId,
        planSets: [
            {
                name: load.name,
                id: load.id,
                url: load.url,
            },
        ],
    });

    const sendRes = http.post(
        `${BASE_URL}/messages`,
        payload,
        {
            headers: {
                Authorization: SAS_TOKEN,
                "Content-Type": "application/json",
            },
        }
    );


    console.log(`passed payload: ${payload}`);
    console.log(`response status: ${sendRes.status}`);
    console.log(`response body: ${sendRes.body}`);
    console.log(`response headers: ${JSON.stringify(sendRes.headers)}`);
    console.log(`response Json: ${sendRes.json()}`);

    check(sendRes, {
        "message sent": (r) => r.status === 201,
    });

    sleep(1); // allow SB to enqueue

}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
        "summary.txt": textSummary(data, { indent: " ", enableColors: false }),
        "summary.html": htmlReport(data)
    };
}


