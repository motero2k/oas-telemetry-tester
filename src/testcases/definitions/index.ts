import axios from "axios";
import { Executable } from "../../types";
import { startDockerStats, stopDockerStats } from "../../utils/dockerStats";


export interface TelemetryEnablerImpl {
    startTelemetry(): unknown;
    config: TelemetryEnablerConfig | null;
    startApp(): Promise<void>;
    checkAppStarted(): Promise<boolean>;
    checkTelemetryStatus(): Promise<boolean>;
    runTests(): Promise<void>;
    stopApp(): Promise<void>;
}

export interface TelemetryEnablerConfig {
    baseURL: string;
    telemetryInApp: boolean;
    concurrentUsers: number;
    requests: number;
    requestDelay: number;
    orderOfMagnitude: number;
}

export interface TelemetryIntervalConfig {
    agreementId: any;
    baseURL: string;
    telemetryInApp: boolean;
    concurrentUsers: number;
    requests: number;
    requestDelay: number;
    orderOfMagnitude: number;
}

export interface TelemetryIntervalsImpl {
    config: TelemetryIntervalConfig | null;
    startApp(): Promise<void>;
    checkAppStarted(): Promise<boolean>;
    checkTelemetryStatus(): Promise<boolean>;
    runTests(): Promise<void>;
    stopApp(): Promise<void>;
    startTelemetry(): Promise<void>;
    stopTelemetry(): Promise<void>;
}


export class TelemetryEnablerRunner implements Executable {
    testTypeImpl: TelemetryEnablerImpl
    constructor(testType: TelemetryEnablerImpl) {
        this.testTypeImpl = testType;
    }
    run = async (config: TelemetryEnablerConfig) => {
        try {
        this.testTypeImpl.config = config;
        await this.testTypeImpl.startApp();
        console.log("App started");
        await this.testTypeImpl.checkAppStarted();
        console.log("App checked");
        if(config.telemetryInApp){
        await this.testTypeImpl.checkTelemetryStatus();
        console.log("Telemetry checked");
        await this.testTypeImpl.startTelemetry();
        }
        startDockerStats("TelemetryEnabler-"+config.telemetryInApp);
        await this.testTypeImpl.runTests();
        console.log("Tests run");
        await this.testTypeImpl.stopApp();
        console.log("App stopped");

        stopDockerStats();
        return;
        } catch (error) {
            console.log("Error", error);
        }
    }
}


export class TelemetryIntervalsRunner implements Executable {
    testTypeImpl: TelemetryIntervalsImpl
    constructor(testTypeImpl: TelemetryIntervalsImpl) {
        this.testTypeImpl = testTypeImpl;
    }
    run = async (config: TelemetryIntervalConfig) => {
        try {
        this.testTypeImpl.config = config;
        await this.testTypeImpl.startApp();
        console.log("App started");
        await this.testTypeImpl.checkAppStarted();
        console.log("App checked");
        await this.testTypeImpl.checkTelemetryStatus();
        console.log("Telemetry checked");

        startDockerStats("TelemetryIntervals-"+"STARTED");
        await this.testTypeImpl.startTelemetry();
        console.log("Telemetry started");
        console.log("Tests run 1 of 3");
        await this.testTypeImpl.runTests();
        stopDockerStats();
        

        await this.testTypeImpl.stopTelemetry();
        startDockerStats("TelemetryIntervals-"+"STOPPED");
        console.log("Telemetry stopped");
        console.log("Tests run 2 of 3");
        await this.testTypeImpl.runTests();
        stopDockerStats();
        startDockerStats("TelemetryIntervals-"+"RESTARTED");
        await this.testTypeImpl.startTelemetry();
        console.log("Telemetry started");
        console.log("Tests run 3 of 3");
        await this.testTypeImpl.runTests();
        stopDockerStats();
        
        await this.testTypeImpl.stopApp();
        console.log("App stopped");

        axios.get("http://localhost:3000/stop").then(() => {console.log("DockerStats stopped")}).catch((err) => {console.log("Error stopping DockerStats", err)});
        return;
        } catch (error) {
            console.log("Error", error);
        }
    }
}
