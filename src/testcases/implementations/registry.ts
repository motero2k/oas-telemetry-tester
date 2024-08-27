import axios from "axios";
import { checkTelemetryEndpoint, executeCommand } from "../../utils";
import { runTests } from "../../utils/apiPecker";
import { TelemetryEnablerConfig, TelemetryEnablerImpl, TelemetryIntervalConfig, TelemetryIntervalsImpl } from "../definitions";
import path from "path";

const DOCKERFILE_PATH = path.resolve(process.env.DOCKERFILE_PATH || "../../bluejay-infrastructure/docker-bluejay/docker-compose.yaml");
const ENV_PATH = path.resolve(process.env.ENV_FILE_PATH || "../../bluejay-infrastructure/.env");


function myUrlBuilder(config: { problemSize: number; baseURL: any; agreementId: any; }) {
    //problemSize is hours. Start date is a year ago, end date is start date + problemSize (in hours)
    const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();
    const endDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 + 1000 * 60 * 60 * config.problemSize).toISOString();
    return `${config.baseURL}/agreements/${config.agreementId}/guarantees?from=${startDate}&to=${endDate}&newPeriodsFromGuarantees=false`;
}
/**
 * 
 * @param i iteration number of apiPecker
 * @param size number of requests before a big delay
 * Regisrty calls the collector, which is restarted every minute for performance reasons.
 * We have to make some requests and then wait for the collector to restart.
 */
const delay = (i: number, size = 5) => {//i starts from 1
    return (i % (size + 1) === 0) ? 2000 : 500;
}


export const registryTelemetryEnablerImpl: TelemetryEnablerImpl = {

    config: null,
    async startApp(): Promise<void> {
        return await _startApp(this.config.telemetryInApp);
    },
    async checkAppStarted(): Promise<boolean> {
        return await _checkAppStarted(this.config.baseURL);
    },
    async checkTelemetryStatus(): Promise<boolean> {
        return await checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    },
    async runTests(): Promise<void> {
        return await runTests(this.config);
    },
    async stopApp(): Promise<void> {
        return Promise.resolve(); //Docker start updates the app. Stopping is not necessary.
    }
}

export class RegistryTelemetryIntervalTestType implements TelemetryIntervalsImpl {
    constructor(config: TelemetryIntervalConfig) {
        this.config = config;
    }
    config: TelemetryIntervalConfig;
    async startApp(): Promise<void> {
        return await _startApp(this.config.telemetryInApp);
    }
    async checkAppStarted(): Promise<boolean> {
        return await _checkAppStarted(this.config.baseURL);
    }
    async checkTelemetryStatus(): Promise<boolean> {
        return  await checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    }
    async runTests(): Promise<void> {
        let requests = this.config.requests / 3;
        let config = { ...this.config, requests };
        return await runTests(config);
    }
    async startTelemetry(): Promise<void> {
        return await axios.post(`${this.config.baseURL}/telemetry/start`);
    }
    async stopTelemetry(): Promise<void> {
        return await axios.post(`${this.config.baseURL}/telemetry/stop`);
    }
    stopApp(): Promise<void> {
        return Promise.resolve(); //Docker start updates the app. Stopping is not necessary.
    }

}




async function _startApp(telemetryInApp: boolean): Promise<void> {
    await _stopDockerContainer();
    let DOCKER_START_COMMAND = `export NEW_RELIC_LICENSE_KEY="" && exort TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    if( process.platform === "win32"){
        DOCKER_START_COMMAND = `set NEW_RELIC_LICENSE_KEY="" && set TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    }

    await executeCommand(DOCKER_START_COMMAND);
    console.log('Docker containers started successfully.');

}

async function _checkAppStarted(baseURL: string): Promise<boolean> {
    //Polling the endpoint until it returns 200
    const MAX_SECONDS = 100;
    const INTERVAL = 1000;
    let i = 0;
    while (i < MAX_SECONDS) {
        try {
            await axios.get(baseURL);
            console.log('App started successfully.');
            return true;
        } catch (error) {
            console.log('Waiting for app to start...');
        }
        await new Promise(resolve => setTimeout(resolve, INTERVAL));
        i++;
    }

}
async function _stopDockerContainer(): Promise<void> {
    const DOCKER_STOP_COMMAND = `docker stop bluejay-registry`;
    try {
        await executeCommand(DOCKER_STOP_COMMAND);
        console.log('Docker container "bluejay-registry" stopped successfully.');
    } catch (error) {
        console.error('Failed to stop Docker container:', error.message);
    }
}


