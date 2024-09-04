import { run } from 'apipecker';
import fs from 'fs';
import axios from 'axios';
import { HeapStats, ApiPeckerResults } from '../types';



export const runTests = async function (config: any): Promise<void> {

    const { concurrentUsers, requests, delay, url } = config;
    try {
        const heapStatsBefore: HeapStats = (await axios.get(config.baseURL + "/heapStats")).data;
        //wait until time is any minute but 5s (avoid collecotor reset )
        let secondUntilReady = Math.abs(60 + 5 - new Date().getSeconds() )%60;
        console.log("Waiting " + secondUntilReady + " seconds to start test to avoid collector reset");
        await new Promise((resolve) => setTimeout(resolve, secondUntilReady * 1000));
        console.log("Starting " + config.testname + " test at " + new Date().toISOString()+ "requesting " + requests + " times");
        return new Promise<void>((resolve, reject) => {
            const startTime = new Date().toISOString();
            config.startTime = startTime;
            run({
                concurrentUsers,
                iterations: requests,
                delay: delay,
                verbose: true,
                consoleLogging: true,
                url,
                resultsHandler: (results: any) => myResultsHandler(results, heapStatsBefore, config).then(() => resolve()).catch((error) => reject(error)),
            })
        });
    } catch (error) {
        console.log("Error getting heapStats before: " + error.message);
    }
}


async function myResultsHandler(results: ApiPeckerResults, heapStatsBefore: HeapStats, config: any): Promise<void> {
    let heapStatsAfter: HeapStats;
    axios.get(config.baseURL + "/heapStats").then((response) => {
        heapStatsAfter = response.data;
        if (typeof config.delay !== "number")config.delay = "variable";
        const timestampEND = new Date().toISOString();
        for(const stat of results.lotStats){
            const timestamp = new Date(stat.timestamp).toISOString();
            const responseTime = stat.result.summary.mean //its just one user, so mean is the same as the value
            const line = 
            `${timestamp},${config.testname}",${config.baseURL},${config.concurrentUsers},${config.requests},${config.delay},${config.telemetryInApp},${config.orderOfMagnitude.value},${responseTime}`
            +`,${heapStatsBefore.total_heap_size},${heapStatsBefore.total_heap_size_executable},${heapStatsBefore.used_heap_size},${heapStatsBefore.heap_size_limit},${heapStatsBefore.malloced_memory}`
            +`,${heapStatsAfter.total_heap_size},${heapStatsAfter.total_heap_size_executable},${heapStatsAfter.used_heap_size},${heapStatsAfter.heap_size_limit},${heapStatsAfter.malloced_memory}\n`;
    
            fs.writeFileSync("outputs/response-times-tc01-03.csv", line, { flag: 'a+' });
        }
        console.log("Finished " + config.testname);
        Promise.resolve();
    }).catch((error) => {
        console.log("Error getting heapStats after: " + error.message);
        Promise.reject();
    });
}



//Heap stats headers csv: total_heap_size,total_heap_size_executable,total_physical_size,total_available_size,used_heap_size,heap_size_limit,malloced_memory,peak_malloced_memory,does_zap_garbage,number_of_native_contexts,number_of_detached_contexts,total_global_handles_size,used_global_handles_size,external_memory
//Heap after headers csv: total_heap_size_after,total_heap_size_executable_after,total_physical_size_after,total_available_size_after,used_heap_size_after,heap_size_limit_after,malloced_memory_after,peak_malloced_memory_after,does_zap_garbage_after,number_of_native_contexts_after,number_of_detached_contexts_after,total_global_handles_size_after,used_global_handles_size_after,external_memory_after

