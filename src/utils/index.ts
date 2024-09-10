import { Executable, TestCaseConfig, TestConfig } from '../types';
import { exec, ExecException } from 'child_process';
import axios from 'axios';
import { logger } from './logger';

export const runTestCase = async (executableTest: Executable, config: TestCaseConfig) => {
    const variants = _generateCombinations(config);
    for (let variant of variants) {
        variant.printableProperties.push("currentIteration", "telemetryStatus");
        for (let i = 0; i < variant.repeatTestCount; i++) {
            logger.log(`Running test ${i + 1} of ${variant.repeatTestCount} for variant ${JSON.stringify(variant)}`);
            variant.currentIteration = i + 1;
            variant.telemetryStatus = "UNKNOWN";
            executableTest.config = variant;
            await executableTest.run();
            logger.log(`Finished Test ${i + 1} of ${variant.repeatTestCount} for variant ${JSON.stringify(variant)}`);
        }
    }
}

export const executeCommand = (command: string) => {
    logger.log(`Command: ${command}`);
    return new Promise((resolve, reject) => {
        exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(stdout);
        });
    });
}

export const checkTelemetryEndpoint = async (URL: string, expectedStatus: number) => {
    try {
        const response = await axios.get(URL, { timeout: 8000 });
        if (response.status !== expectedStatus) {
            throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
        }
        return true;
    } catch (error: Error | any) {
        throw new Error(`Error checking telemetry endpoint: ${error.message}`);
    }
};

/**
 * 
 * @param parameters An object with keys as parameter names and values as arrays of possible values
 * @returns An array of objects with keys as parameter names and values as the selected values
 */
function _generateCombinations(config: TestCaseConfig): TestConfig[] {
    let variations: any[] = [];
    _generateCombinationsRecursive(config.combinations, 0, {}, variations);
    return variations.map((variation) => {
        return { ...structuredClone(config.fixed), ...variation };
    });
}

function _generateCombinationsRecursive(parameters: any, index: number, current: any, variations: any) {
    if (index == Object.keys(parameters).length) {
        variations.push(current);
        return;
    }
    let key = Object.keys(parameters)[index];
    let values = parameters[key];
    for (let i = 0; i < values.length; i++) {
        let newCurrent = { ...structuredClone(current) };
        newCurrent[key] = values[i];
        _generateCombinationsRecursive(parameters, index + 1, newCurrent, variations);
    }
}

export enum ArrayConfig {
    //Flatten is the default
    KEEP_ARRAYS,
    SKIP
}


export function flattenObject(obj: any, options?:{arrays: ArrayConfig},parentKey = '', result = {}): any {
    try {
        // Iterate over each key in the object
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            const value = obj[key];
            const newKey = parentKey ? `${parentKey}.${key}` : key;

            // Handle dates explicitly
            if (value instanceof Date) {
                result[newKey] = value.toISOString();
                continue;
            }

            // Handle arrays
            if (Array.isArray(value)) {
                if(options?.arrays === ArrayConfig.SKIP) continue;
                if (options?.arrays === ArrayConfig.KEEP_ARRAYS) {
                    result[newKey] = value;
                    continue;
                }
                // 
                value.forEach((item, index) => {
                    const arrayKey = `${newKey}.${index}`;
                    if (typeof item === 'object' && item !== null) {
                        flattenObject(item,options, arrayKey, result);
                    } else {
                        result[arrayKey] = item;
                    }
                });
                continue;
            }

            // Handle nested objects
            if (typeof value === 'object' && value !== null) {
                flattenObject(value,options, newKey, result);
                continue;
            }

            // Handle primitive values and nulls
            result[newKey] = value;
        }
        return result;
    } catch (error) {
        logger.log(error);
    }
}