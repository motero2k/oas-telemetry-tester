import dotenv from 'dotenv';
dotenv.config();// Load environment variables from .env file
import { RegistryTelemetryEnabler, RegistryTelemetryInterval } from "./testcases/implementations/registry";
import { TestCaseConfig, orderOfMagnitude } from "./types";
import { runTestCase } from "./utils";



const ordersOfMagnitude: orderOfMagnitude[] = [
    {
        value: 1,
        name: "small",
        estimatedResponseTime: 1500,
        secureResponseTime: 3000,
    },
    {
        value: 24,
        name: "medium",
        estimatedResponseTime: 4500,
        secureResponseTime: 6000,
    },
    {
        value: 24 * 2,
        name: "large",
        estimatedResponseTime: 7500,
        secureResponseTime: 10000,
    }
]

//flattened properites of the config object to be printed in the csv
let printableProperties = ["testname", "minutesPerTest","repeatTestCount","telemetryInApp", "orderOfMagnitude.name", "orderOfMagnitude.value","orderOfMagnitude.estimatedResponseTime","orderOfMagnitude.secureResponseTime", "baseURL", "concurrentUsers", "agreementId"];

//order of the parameters matters for the csv output header
const configTC001: TestCaseConfig = {
    fixed: {
        testname: "TC-001 Registry Enabler",
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 3,
        minutesPerTest: 1,
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0",
        printableProperties: printableProperties,
    },
    combinations: {
        telemetryInApp: [true, false],
        orderOfMagnitude: ordersOfMagnitude //hours 1.5, 4.5, 7.5 seconds response time
    },
}
const configTC002 = {
    fixed: {
        testname: "TC-002 Registry Intervals",
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        minutesPerTest: 1,
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0",
        telemetryInApp: true,
        printableProperties: printableProperties,
    },
    combinations: {
        orderOfMagnitude: ordersOfMagnitude //hours 1.5, 4.5, 7.5 seconds response time
    }
}


const configTC003 = {
    fixed: {
        testname: "TC-003 Registry Enabler Long Run",
        baseURL: "http://localhost:5400", //https://bluejay-registry.governify.io",
        repeatTestCount: 1,
        minutesPerTest: 30,// minutes. Long duration tests
        concurrentUsers: 1,
        agreementId: "tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0",
        printableProperties: printableProperties,
    },
    combinations: {
        telemetryInApp: [true, false],
        orderOfMagnitude: ordersOfMagnitude, //hours 1.5, 4.5, 7.5 seconds response time
    }
}



//TC-001 Registry works for linux only (see implementation)
async function runTests() {

    await runTestCase(new RegistryTelemetryEnabler(), configTC001);
    await runTestCase(new RegistryTelemetryInterval(), configTC002);
    await runTestCase(new RegistryTelemetryEnabler(), configTC003);
}
runTests();