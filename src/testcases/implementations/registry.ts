import axios from "axios";
import { checkTelemetryEndpoint, executeCommand } from "../../utils";
import { runTests } from "../../utils/apiPecker";
import { TelemetryEnablerConfig, TelemetryEnablerImpl, TelemetryIntervalConfig, TelemetryIntervalsImpl } from "../definitions";
import path from "path";
import { logger } from "../../utils/logger";

const DOCKERFILE_PATH = path.resolve(process.env.DOCKERFILE_PATH || "../../bluejay-infrastructure/docker-bluejay/docker-compose.yaml");
const ENV_PATH = path.resolve(process.env.ENV_FILE_PATH || "../../bluejay-infrastructure/.env");
const MAX_TIME_AVAILABLE = 45000

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



export const registryTelemetryEnablerImpl: TelemetryEnablerImpl = {
    config: null,
    startApp(): Promise<void> {
        return _startApp(this.config.telemetryInApp);
    },
    checkAppStarted(): Promise<boolean> {
        return _checkAppStarted(this.config.baseURL);
    },
    checkTelemetryStatus(): Promise<boolean> {
        return checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    },
    runTests(): Promise<void> {
        let url = myUrlBuilder(this.config.orderOfMagnitude, this.config.baseURL, this.config.agreementId);
        const responseTime = this.config.orderOfMagnitude.secureResponseTime;
        let config = { ...this.config, url, iterations: getNumberOfRequestsInAvailableSeconds(responseTime) , delay: responseTime, testname: "RegistryTELEMETRY" };
        return runTests(config);
    },
    stopApp(): Promise<void> {
        return _stopDockerContainer();
    },
    startTelemetry: function (): unknown {
        return axios.get(`${this.config.baseURL}/telemetry/start`);
    }
}

export const registryTelemetryIntervalImpl: TelemetryIntervalsImpl = {

    config: null,
    startApp(): Promise<void> {
        return _startApp(this.config.telemetryInApp);
    },
    checkAppStarted(): Promise<boolean> {
        return _checkAppStarted(this.config.baseURL);
    },
    checkTelemetryStatus(): Promise<boolean> {
        return checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    },
    runTests(): Promise<void> {
        let url = myUrlBuilder(this.config.orderOfMagnitude, this.config.baseURL, this.config.agreementId);
        const responseTime = this.config.orderOfMagnitude.secureResponseTime;
        let config = { ...this.config, requests: getNumberOfRequestsInAvailableSeconds(responseTime), url, delay: responseTime, testname: "RegistryINTERVAL" };
        return runTests(config);
    },
    startTelemetry(): Promise<void> {
        return axios.get(`${this.config.baseURL}/telemetry/start`);
    },
    stopTelemetry(): Promise<void> {
        return axios.get(`${this.config.baseURL}/telemetry/stop`);
    },
    stopApp(): Promise<void> {
        return _stopDockerContainer();
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


