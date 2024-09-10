import axios from "axios";
import { checkTelemetryEndpoint, executeCommand } from "../../utils";
import { getHeapStatsAndResopnseTimes } from "../../utils/apiPecker";
import { TelemetryEnabler, TelemetryIntervals } from "../definitions";
import path from "path";
import { logger } from "../../utils/logger";
import { startDockerStats, stopDockerStats } from "../../utils/dockerStats";
import { HeapAndResponseTimesConfig, TestConfig } from "../../types";

const DOCKERFILE_PATH = path.resolve(process.env.DOCKERFILE_PATH || "../../bluejay-infrastructure/docker-bluejay/docker-compose.yaml");
const ENV_PATH = path.resolve(process.env.ENV_FILE_PATH || "../../bluejay-infrastructure/.env");
const MAX_TIME_AVAILABLE = 45000

function getSecondsUntilNextMinute(secondOffset = 5, now = new Date().getSeconds()) {
    let remainingSeconds = Math.abs(60 - now + secondOffset) % 60;
    return remainingSeconds;
}

async function awaitCollectorReset() {
    let secondUntilReady = getSecondsUntilNextMinute();
    logger.log("Waiting " + secondUntilReady + " seconds to start test to avoid collector reset");
    await new Promise((resolve) => setTimeout(resolve, secondUntilReady * 1000));
}

function myUrlBuilder(problemSize: number, baseURL: any, agreementId: any) {
    //problemSize is hours.
    const startDate = new Date(2024, 1, 1, 5, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * problemSize - 1);
    const url = `${baseURL}/api/v6/states/${agreementId}/guarantees?from=${startDate.toISOString()}&to=${endDate.toISOString()}&newPeriodsFromGuarantees=false`;
    logger.log(url);
    return url;
}

/**
 * 
 * @param secureResponseTime More than the maximum response time of the request to registry
 * @returns 
 */
const getNumberOfRequestsInAvailableSeconds = (secureResponseTime: number) => {
    //45 seconds available 55-10 reseting
    return Math.floor(MAX_TIME_AVAILABLE / secureResponseTime);
}



export class RegistryTelemetryEnabler extends TelemetryEnabler {

    startApp(): Promise<void> {
        return _startApp(this.config.telemetryInApp);
    }
    checkAppStarted(): Promise<boolean> {
        return _checkAppStarted(this.config.baseURL);
    }
    checkTelemetryStatus(): Promise<boolean> {
        return checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    }
    runTests(): Promise<void> {
        return _runTests(this.config);
    }
    stopApp(): Promise<void> {
        return _stopDockerContainer();
    }
    startTelemetry(): Promise<void> {
        return axios.get(`${this.config.baseURL}/telemetry/start`);
    }

}

export class RegistryTelemetryInterval extends TelemetryIntervals {

    startApp(): Promise<void> {
        return _startApp(this.config.telemetryInApp);
    }
    checkAppStarted(): Promise<boolean> {
        return _checkAppStarted(this.config.baseURL);
    }
    checkTelemetryStatus(): Promise<boolean> {
        return checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    }
    runTests(): Promise<void> {
        return _runTests(this.config);
    }
    startTelemetry(): Promise<void> {
        return axios.get(`${this.config.baseURL}/telemetry/start`);
    }
    stopTelemetry(): Promise<void> {
        return axios.get(`${this.config.baseURL}/telemetry/stop`);
    }
    stopApp(): Promise<void> {
        return _stopDockerContainer();
    }

}

async function _runTests(config: TestConfig): Promise<void> {
    for(let i = 0; i < config.minutesPerTest; i++) {
        logger.log("Starting test for minute " + (i+1) + " of " + config.minutesPerTest);
        await awaitCollectorReset();
        startDockerStats(config);
        let url = myUrlBuilder(config.orderOfMagnitude.value, config.baseURL, config.agreementId);
        const responseTime = config.orderOfMagnitude.secureResponseTime;
        let runConfig : HeapAndResponseTimesConfig = { requests: getNumberOfRequestsInAvailableSeconds(responseTime), url, delay: responseTime };
        await getHeapStatsAndResopnseTimes(config,runConfig);
        stopDockerStats();
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}


async function _startApp(telemetryInApp: boolean): Promise<void> {
    _stopDockerContainer();
    let DOCKER_START_COMMAND = `export NEW_RELIC_LICENSE_KEY="" && export TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    if (process.platform === "win32") {
        DOCKER_START_COMMAND = `set NEW_RELIC_LICENSE_KEY="" && set TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    }

    await executeCommand(DOCKER_START_COMMAND);
    logger.log('Docker containers started successfully.');
    return Promise.resolve();

}

async function _checkAppStarted(baseURL: string): Promise<boolean> {
    //Polling the endpoint until it returns 200
    const MAX_SECONDS = 100;
    const INTERVAL = 1000;
    let i = 0;
    while (i < MAX_SECONDS) {
        try {
            await axios.get(baseURL);
            logger.log('App started successfully.');
            return true;
        } catch (error) {
            logger.log('Waiting for app to start...');
        }
        await new Promise(resolve => setTimeout(resolve, INTERVAL));
        i++;
    }
    return false;

}
async function _stopDockerContainer(): Promise<void> {
    const DOCKER_STOP_COMMAND = `docker stop bluejay-registry`;
    try {
        executeCommand(DOCKER_STOP_COMMAND);
        logger.log('Docker container "bluejay-registry" stopped successfully.');
    } catch (error) {
        logger.error('Failed to stop Docker container:', error.message);
    }
}


