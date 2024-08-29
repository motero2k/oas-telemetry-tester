import { Executable, TestCaseConfig } from '../types';
import { exec, ExecException } from 'child_process';
import axios from 'axios';

export const runTestCase = async (config: TestCaseConfig, executableTest: Executable) => {
    const variants = _generateCombinations(config);
    for (let variant of variants) {
        for (let i = 0; i < variant.repeatTestCount; i++) {
            await executableTest.run(variant);
            console.log(`Test ${i + 1} of ${variant.repeatTestCount} for variant ${JSON.stringify(variant)} finished`);
        }
    }
}

export const executeCommand = (command: string) => {
    console.log(`Command: ${command}`);
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
function _generateCombinations(config: TestCaseConfig): any[] {
    let variations: any[] = [];
    _generateCombinationsRecursive(config.combinations, 0, {}, variations);
    return variations.map((variation) => {
        return { ...config.fixed, ...variation };
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
        let newCurrent = { ...current };
        newCurrent[key] = values[i];
        _generateCombinationsRecursive(parameters, index + 1, newCurrent, variations);
    }
}