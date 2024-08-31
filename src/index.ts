import dotenv from 'dotenv';
dotenv.config();// Load environment variables from .env file
import { TelemetryEnablerRunner, TelemetryIntervalsRunner } from "./testcases/definitions";
import { registryTelemetryEnablerImpl, registryTelemetryIntervalImpl } from "./testcases/implementations/registry";
import { TestCaseConfig } from "./types";
import { runTestCase } from "./utils";


const configTC001: TestCaseConfig = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 3,
        concurrentUsers: 1,
        requests: 60, // 10 seconds minimun. max 4 requests per minute (40 available seconds)
        requestDelay: 5000,//not used in registry (uses a delay function)
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1"
    },
    combinations: {
        telemetryInApp: [true, false],
        orderOfMagnitude: [1, 128, 238] //hours 10, 15, 20 seconds response time
        //1,192,312
    }
}
const configTC002 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 3,
        concurrentUsers: 1,
        requests: 60,
        requestDelay: 5000,//not used in registry (uses a delay function)
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1",
        telemetryInApp: true,
    },
    combinations: {
        orderOfMagnitude: [1, 128, 238] //hours 10, 15, 20 seconds response time
    }
}

const multiplier = 5;
const configTC003 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        concurrentUsers: 1,
        requests: 60 * multiplier,
        requestDelay: 5000,//not used in registry (uses a delay function)
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1",
    },
    combinations: {
        orderOfMagnitude: [1, 128, 238], //hours 10, 15, 20 seconds response time
        telemetryInApp: [true, false],
    }
}

const configDocker1 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        concurrentUsers: 1,
        requests: 30,
        requestDelay: 5000,//not used in registry (uses a delay function)
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1",
        telemetryInApp: false,
    },
    combinations: {
        orderOfMagnitude: [1, 128, 238], //hours 10, 15, 20 seconds response time
    }
}
const configDocker2 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        concurrentUsers: 1,
        requests: 30,
        requestDelay: 5000,//not used in registry (uses a delay function)
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1",
        telemetryInApp: true,
    },
    combinations: {
        orderOfMagnitude: [1, 128, 238], //hours 10, 15, 20 seconds response time
    }
}


//TC-001 Registry works for linux only (see implementation)
async function runTests() {
    // await runTestCase(configTC001, new TelemetryEnablerRunner(registryTelemetryEnablerImpl));
    // await runTestCase(configTC002, new TelemetryIntervalsRunner(registryTelemetryIntervalImpl));
    // await runTestCase(configTC003, new TelemetryEnablerRunner(registryTelemetryEnablerImpl));
    await runTestCase(configDocker1, new TelemetryEnablerRunner(registryTelemetryEnablerImpl));

    await runTestCase(configDocker2, new TelemetryIntervalsRunner(registryTelemetryIntervalImpl));
}
runTests();