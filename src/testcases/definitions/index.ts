import axios from "axios";
import { Executable } from "../../types";


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
        axios.get("http://localhost:3000/start").then(() => {console.log("DockerStats started")}).catch((err) => {console.log("Error starting DockerStats", err)});

        await this.testTypeImpl.runTests();
        console.log("Tests run");
        await this.testTypeImpl.stopApp();
        console.log("App stopped");

        axios.get("http://localhost:3000/stop").then(() => {console.log("DockerStats stopped")}).catch((err) => {console.log("Error stopping DockerStats", err)});
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

        axios.get("http://localhost:3000/start").then(() => {console.log("DockerStats started")}).catch((err) => {console.log("Error starting DockerStats", err)});

        await this.testTypeImpl.startTelemetry();
        console.log("Telemetry started");
        await this.testTypeImpl.runTests();
        console.log("Tests run 1 of 3");

        await this.testTypeImpl.stopTelemetry();
        console.log("Telemetry stopped");
        await this.testTypeImpl.runTests();
        console.log("Tests run 2 of 3");

        await this.testTypeImpl.startTelemetry();
        console.log("Telemetry started");
        await this.testTypeImpl.runTests();
        console.log("Tests run 3 of 3");
        
        await this.testTypeImpl.stopApp();
        console.log("App stopped");

        axios.get("http://localhost:3000/stop").then(() => {console.log("DockerStats stopped")}).catch((err) => {console.log("Error stopping DockerStats", err)});
        return;
        } catch (error) {
            console.log("Error", error);
        }
    }
}
