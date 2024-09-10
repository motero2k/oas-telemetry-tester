import { Executable, TestConfig } from "../../types";
import { logger } from "../../utils/logger";

export abstract class TelemetryEnabler implements Executable {
    
    config: TestConfig;

    abstract startApp(): Promise<void>;
    abstract checkAppStarted(): Promise<boolean>;
    abstract checkTelemetryStatus(): Promise<boolean>;
    abstract runTests(): Promise<void>;
    abstract stopApp(): Promise<void>;
    abstract startTelemetry(): Promise<void>;

    async run () {
        try {
            await this.startApp();
            logger.log("App started");
            await this.checkAppStarted();
            logger.log("App checked");
            if (this.config.telemetryInApp) {
                await this.checkTelemetryStatus();
                logger.log("Telemetry checked");
                await this.startTelemetry();
            }
            
            await this.runTests();
            logger.log("Tests run");
            await this.stopApp();
            logger.log("App stopped");

            
            return;
        } catch (error) {
            logger.log("Error", error);
        }
    }
}



export abstract class TelemetryIntervals implements Executable {
    
    config: TestConfig;

    abstract startApp(): Promise<void>;
    abstract checkAppStarted(): Promise<boolean>;
    abstract checkTelemetryStatus(): Promise<boolean>;
    abstract runTests(): Promise<void>;
    abstract stopApp(): Promise<void>;
    abstract startTelemetry(): Promise<void>;
    abstract stopTelemetry(): Promise<void>;

    async run(){
        try {
        await this.startApp();
        logger.log("App started");
        await this.checkAppStarted();
        logger.log("App checked");
        await this.checkTelemetryStatus();
        logger.log("Telemetry checked");

        this.config.telemetryStatus = "1 STARTED";
        await this.startTelemetry();
        logger.log("Telemetry started");
        logger.log("Tests run 1 of 3");
        await this.runTests();
        

        await this.stopTelemetry();
        this.config.telemetryStatus = "2 STOPPED";
        logger.log("Telemetry stopped");
        logger.log("Tests run 2 of 3");
        await this.runTests();

        this.config.telemetryStatus = "3 RESTARTED";
        await this.startTelemetry();
        logger.log("Telemetry started");
        logger.log("Tests run 3 of 3");
        await this.runTests();
        
        this.config.telemetryStatus = "UNKNOWN";
        
        await this.stopApp();
        logger.log("App stopped");

        return;
        } catch (error) {
            logger.log("Error", error);
        }
    }
}
