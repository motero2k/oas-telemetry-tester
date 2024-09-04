import dotenv from 'dotenv';
dotenv.config();// Load environment variables from .env file
import { TelemetryEnablerRunner, TelemetryIntervalsRunner } from "./testcases/definitions";
import { registryTelemetryEnablerImpl, registryTelemetryIntervalImpl } from "./testcases/implementations/registry";
import { TestCaseConfig , orderOfMagnitude} from "./types";
import { runTestCase } from "./utils";
import axios from 'axios';



const ordersOfMagnitude : orderOfMagnitude[]= [
    {
        value: 1,
        name: "small",
        estimatedResponseTime: 1500,
        secureResponseTime: 3000,
    },
    {
        value: 180,
        name: "medium",
        estimatedResponseTime: 4500,
        secureResponseTime: 6000,
    },
    {
        value: 340,
        name: "large",
        estimatedResponseTime: 7500,
        secureResponseTime: 10000,
    }
]


const configTC001: TestCaseConfig = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 3, // minutes
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0"
    },
    combinations: {
        telemetryInApp: [true, false],
        orderOfMagnitude: ordersOfMagnitude //hours 1.5, 4.5, 7.5 seconds response time
    }
}
const configTC002 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0",
        telemetryInApp: true,
    },
    combinations: {
        orderOfMagnitude: ordersOfMagnitude //hours 1.5, 4.5, 7.5 seconds response time
    }
}


const configTC003 = {
    fixed: {
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 10, // minutes. Long duration tests
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0",
    },
    combinations: {
        orderOfMagnitude: ordersOfMagnitude, //hours 1.5, 4.5, 7.5 seconds response time
        telemetryInApp: [true, false],
    }
}



//TC-001 Registry works for linux only (see implementation)
async function runTests() {

    await runTestCase(configTC001, new TelemetryEnablerRunner(registryTelemetryEnablerImpl));
    await runTestCase(configTC002, new TelemetryIntervalsRunner(registryTelemetryIntervalImpl));
    await runTestCase(configTC003, new TelemetryEnablerRunner(registryTelemetryEnablerImpl));
}
runTests();