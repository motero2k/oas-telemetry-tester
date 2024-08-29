import axios from "axios";
import { checkTelemetryEndpoint, executeCommand } from "../../utils";
import { runTests } from "../../utils/apiPecker";
import { TelemetryEnablerConfig, TelemetryEnablerImpl, TelemetryIntervalConfig, TelemetryIntervalsImpl } from "../definitions";
import path from "path";

const DOCKERFILE_PATH = path.resolve(process.env.DOCKERFILE_PATH || "../../bluejay-infrastructure/docker-bluejay/docker-compose.yaml");
const ENV_PATH = path.resolve(process.env.ENV_FILE_PATH || "../../bluejay-infrastructure/.env");


function myUrlBuilder( problemSize: number, baseURL: any, agreementId: any) {
    //problemSize is hours. Start date is a year ago, end date is start date + problemSize (in hours)
    const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();
    const endDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 + 1000 * 60 * 60 * problemSize).toISOString();
    return `${baseURL}/api/v6/states/${agreementId}/guarantees?from=${startDate}&to=${endDate}&newPeriodsFromGuarantees=false`;
}
/**
 * 
 * @param i iteration number of apiPecker
 * @param size number of requests before a big delay
 * Regisrty calls the collector, which is restarted every minute for performance reasons.
 * We have to make some requests and then wait for the collector to restart.
 */
let delay = (i: number, size = 5) => {//i starts from 1
    return (i % (size + 1) === 0) ? 20000 : 5000;
}

const getRegistryResponseTime = (orderOfMagnitude: number) => {
    if (orderOfMagnitude === 1) return 10000;
    if (orderOfMagnitude === 128) return 15000;
    if (orderOfMagnitude === 238) return 20000;
}

const calculateNumberOfRequestsInAvailableSeconds = (orderOfMagnitude: number) => {
    let responseTime = getRegistryResponseTime(orderOfMagnitude);
    return Math.floor(45000 / responseTime); //45 seconds available 0-10 reseting, 5margin, 45 available
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
        const availableRequestCount = calculateNumberOfRequestsInAvailableSeconds(this.config.orderOfMagnitude);
        let delay2 = (i: number, size = availableRequestCount) => {
            let delayWhenCollectorResets = 60000 - availableRequestCount * getRegistryResponseTime(this.config.orderOfMagnitude); //0-10. 
            return (i % (size + 1) === 0) ? delayWhenCollectorResets : getRegistryResponseTime(this.config.orderOfMagnitude);
        };
        let config = { ...this.config, url, delay: delay2, testname: "RegistryTELEMETRY" };
        return runTests(config);
    },
    stopApp(): Promise<void> {
        return Promise.resolve(); //Docker start updates the app. Stopping is not necessary.
    },
    startTelemetry: function (): unknown {
        return axios.get(`${this.config.baseURL}/telemetry/start`);
    }
}

export const registryTelemetryIntervalImpl: TelemetryIntervalsImpl ={

    config: null,
    startApp(): Promise<void> {
        return  _startApp(this.config.telemetryInApp);
    },
    checkAppStarted(): Promise<boolean> {
        return  _checkAppStarted(this.config.baseURL);
    },
    checkTelemetryStatus(): Promise<boolean> {
        return   checkTelemetryEndpoint(this.config.baseURL + "/telemetry", 200);
    },
    runTests(): Promise<void> {
        let requests = Math.floor(this.config.requests / 3);
        let url = myUrlBuilder(this.config.orderOfMagnitude,this.config.baseURL, this.config.agreementId);
        const size2 = calculateNumberOfRequestsInAvailableSeconds(this.config.orderOfMagnitude);
        let delay2 = (i: number, size = size2) => {
            return (i % (size + 1) === 0) ? 20000 : getRegistryResponseTime(this.config.orderOfMagnitude);
        };
        let config = { ...this.config, requests, url, delay: delay2 , testname: "RegistryINTERVAL" };
        return  runTests(config);
    },
    startTelemetry(): Promise<void> {
        return  axios.get(`${this.config.baseURL}/telemetry/start`);
    },
    stopTelemetry(): Promise<void> {
        return  axios.get(`${this.config.baseURL}/telemetry/stop`);
    },
    stopApp(): Promise<void> {
        return Promise.resolve(); //Docker start updates the app. Stopping is not necessary.
    }

}




async function _startApp(telemetryInApp: boolean): Promise<void> {
     _stopDockerContainer();
    let DOCKER_START_COMMAND = `export NEW_RELIC_LICENSE_KEY="" && export TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    if( process.platform === "win32"){
        DOCKER_START_COMMAND = `set NEW_RELIC_LICENSE_KEY="" && set TELEMETRY_ENABLED=${telemetryInApp} && docker-compose -f ${DOCKERFILE_PATH} --env-file ${ENV_PATH} up -d bluejay-registry`;
    }

    await executeCommand(DOCKER_START_COMMAND);
    console.log('Docker containers started successfully.');
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
            console.log('App started successfully.');
            return true;
        } catch (error) {
            console.log('Waiting for app to start...');
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
            console.log('Docker container "bluejay-registry" stopped successfully.');
    } catch (error) {
        console.error('Failed to stop Docker container:', error.message);
    }
}


