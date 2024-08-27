import { Executable } from "../../types";


export interface TelemetryEnablerImpl {
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
    ordersOfMagnitude: number;
}

export interface TelemetryIntervalConfig {
    baseURL: string;
    telemetryInApp: boolean;
    concurrentUsers: number;
    requests: number;
    requestDelay: number;
    ordersOfMagnitude: number;
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
        this.testTypeImpl.config = config;
        await this.testTypeImpl.startApp();
        console.log("App started");
        await this.testTypeImpl.checkAppStarted();
        console.log("App checked");
        await this.testTypeImpl.checkTelemetryStatus();
        await this.testTypeImpl.runTests();
        await this.testTypeImpl.stopApp();
    }
}


export class TelemetryIntervalsRunner implements Executable {
    testTypeImpl: TelemetryIntervalsImpl
    constructor(testTypeImpl: TelemetryIntervalsImpl) {
        this.testTypeImpl = testTypeImpl;
    }
    run = async (config: TelemetryIntervalConfig) => {
        this.testTypeImpl.config = config;
        await this.testTypeImpl.startApp();
        await this.testTypeImpl.checkAppStarted();
        await this.testTypeImpl.checkTelemetryStatus();
        await this.testTypeImpl.runTests();
        await this.testTypeImpl.stopTelemetry();
        await this.testTypeImpl.runTests();
        await this.testTypeImpl.startTelemetry();
        await this.testTypeImpl.runTests();
        await this.testTypeImpl.stopApp();
    }
}
