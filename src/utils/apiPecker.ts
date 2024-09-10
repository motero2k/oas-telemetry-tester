import { run } from 'apipecker';
import fs from 'fs';
import axios from 'axios';
import { HeapStats, ApiPeckerResults, TestConfig, HeapAndResponseTimesConfig } from '../types';
import { ArrayConfig, flattenObject } from '.';
import { logger } from './logger';



export const getHeapStatsAndResopnseTimes = async function (testConfig: TestConfig, runConfig: HeapAndResponseTimesConfig): Promise<void> {

    try {
        const heapStatsBefore: HeapStats = (await axios.get(testConfig.baseURL + "/heapStats")).data;
        
        logger.log("Starting " + testConfig.testname + " test at " + new Date().toISOString() + " requesting " + runConfig.requests + " times");
        return new Promise<void>((resolve, reject) => {
            run({
                concurrentUsers: testConfig.concurrentUsers,
                iterations: runConfig.requests,
                delay: runConfig.delay,
                url: runConfig.url,
                verbose: true,
                consoleLogging: true,
                timeout: testConfig.orderOfMagnitude.secureResponseTime,
                resultsHandler: (results: any) => myResultsHandler(results, heapStatsBefore, testConfig, runConfig).then(() => resolve()).catch((error) => reject(error)),
            })
        });
    } catch (error) {
        logger.log("Error getting heapStats before: " + error.message);
    }
}




async function myResultsHandler(results: ApiPeckerResults, heapStatsBefore: HeapStats, testConfig: TestConfig, runConfig: HeapAndResponseTimesConfig): Promise<void> {
    logger.log("Getting heapStats after " + testConfig.testname);
    axios.get(testConfig.baseURL + "/heapStats").then((response) => {
        let heapStatsAfter = response.data;

        const selectedKeys = ["total_heap_size", "total_heap_size_executable", "used_heap_size", "heap_size_limit", "malloced_memory"];
        const apiPeckerPrintableProperties = [...testConfig.printableProperties];
        const flattenTestConfig = flattenObject(testConfig, { arrays: ArrayConfig.SKIP });
        const headersKeys = ["timestamp", "responseTime", ...apiPeckerPrintableProperties, ...Object.keys(runConfig), ...selectedKeys.map(e => e + "_before"), ...selectedKeys.map(e => e + "_after")];
        const headers = headersKeys.join(',') + "\n";

        fs.writeFileSync("outputs/response-times-tc01-03.csv", headers, { flag: 'a+' });
        for (const stat of results.lotStats) {
            const timestamp = stat.result.summary.startTimeISO
            const responseTime = stat.result.summary.mean //its just one user, so mean is the same as the value
            const line =
                `${timestamp},${responseTime},`
                + apiPeckerPrintableProperties.map( e => flattenTestConfig[e]).join(',') + ','
                + Object.values(runConfig).join(',') + ','
                + Object.keys(heapStatsBefore).filter(e => selectedKeys.includes(e)).map(e => heapStatsBefore[e]).join(',') + ','
                + Object.keys(heapStatsAfter).filter(e => selectedKeys.includes(e)).map(e => heapStatsAfter[e]).join(',') + "\n";


            fs.writeFileSync("outputs/response-times-tc01-03.csv", line, { flag: 'a+' });
        }
        logger.log("Finished " + testConfig.testname);
        Promise.resolve();
    }).catch((error) => {
        logger.log("Error getting heapStats after: " + error);
        Promise.reject();
    });
}



//Heap stats headers csv: total_heap_size,total_heap_size_executable,total_physical_size,total_available_size,used_heap_size,heap_size_limit,malloced_memory,peak_malloced_memory,does_zap_garbage,number_of_native_contexts,number_of_detached_contexts,total_global_handles_size,used_global_handles_size,external_memory
//Heap after headers csv: total_heap_size_after,total_heap_size_executable_after,total_physical_size_after,total_available_size_after,used_heap_size_after,heap_size_limit_after,malloced_memory_after,peak_malloced_memory_after,does_zap_garbage_after,number_of_native_contexts_after,number_of_detached_contexts_after,total_global_handles_size_after,used_global_handles_size_after,external_memory_after

