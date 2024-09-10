import * as http from 'http';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { ArrayConfig, flattenObject } from '.';
import { logger } from './logger';
import { TestConfig } from '../types';

const containerName = 'bluejay-registry'; // Replace with your container ID
let statsData: any[] = []; // Array to store the streamed metrics
let endRequest = false;
let req: http.ClientRequest | null = null;

function getContainerId(name: string): string {
    let containerId = '';

    try {
        // Run a Docker command to get the container ID based on the container name
        const result = execSync(`docker ps -qf "name=${name}"`, { encoding: 'utf-8' });

        // Remove any trailing newlines or spaces from the result
        containerId = result.trim();

        if (!containerId) {
            logger.log(`No container found with the name: ${name}`);
        } else {
            logger.log(`Container ID for ${name}: ${containerId}`);
        }
    } catch (error) {
        logger.error('Error fetching container ID:', error);
    }

    return containerId;
}
let iteration = 0;
function startStreamingDockerStats(configColums: TestConfig): void {
    iteration = 0;
    logger.log('Starting to stream Docker stats...');
    const options: http.RequestOptions = {
        socketPath: '/var/run/docker.sock',
        path: `/containers/${getContainerId(containerName)}/stats?stream=true`,
        method: 'GET',
    };
    const dockerPrintableProperties = ['timestamp', ...configColums.printableProperties];
    const flattenColumns = flattenObject(configColums, { arrays: ArrayConfig.SKIP });
    delete flattenColumns.printableProperties;

    req = http.request(options, (res) => {
        res.on('data', (chunk) => {

            try {
                if (iteration != 0) {// skip the first iteration (HAS LESS DATA PROPERTIES)
                    const stats = JSON.parse(chunk.toString());
                    const timestamp = new Date().toISOString();
                    const data = {
                        timestamp: timestamp,
                        ...flattenColumns,
                        cpu_stats: stats.cpu_stats,
                        memory_stats: stats.memory_stats,
                        precpu_stats: stats.precpu_stats,
                    };
                    const flattenData = flattenObject(data, { arrays: ArrayConfig.SKIP });
                    // statsData.push(flattenData);
                    if (iteration == 1) {
                        const headers = Object.keys(flattenData);
                        const headerLine = headers.join(',');
                        addLineToCsvFile('outputs/docker-stats.csv', headerLine);
                    }
                    const line = Object.keys(flattenData).map((key: string) => flattenData[key]).join(',');
                    addLineToCsvFile('outputs/docker-stats.csv', line);
                    
                }
                iteration++;
            } catch (error) {
                logger.error('Error parsing stats data:', error);
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

function addLineToCsvFile(filePath: string, line: string) {
    try {
        fs.appendFileSync(filePath, line + '\n', 'utf8');
    } catch (error) {
        logger.error('Failed to add line to CSV file:', error);
    }
}

function saveMetricsCsv(filePath: string = 'outputs/stats') {
    // append date to the file name
    const date = new Date().toISOString().replace(/:/g, '-');
    filePath += `-${date}.csv`; // Append .csv extension to the file path

    try {
        const csvLines: string[] = [];

        if (statsData.length > 0) {
            // Extract the headers dynamically from the first object
            const headers = Object.keys(statsData[0]);
            csvLines.push(headers.join(',')); // Add the header line

            // Iterate over each object in statsData to create data rows
            statsData.forEach((stat) => {
                const values = headers.map((header) => stat[header]); // Map headers to corresponding values
                csvLines.push(values.join(',')); // Add the data row
            });
        }

        // Write all lines to the CSV file
        fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');
        logger.log(`Metrics saved to CSV at ${filePath}`);
    } catch (error) {
        logger.error('Failed to save metrics to CSV:', error);
    }
}

export function startDockerStats(configColums: TestConfig): void {
    endRequest = false;
    statsData = [];
    startStreamingDockerStats(configColums);
}

export function stopDockerStats(): void {
    if (req) {
        req.destroy(); // Properly abort the request
        // saveMetricsCsv('outputs/docker-stats-autosave');
        logger.log("Streaming stopped and metrics saved.");
    }
    endRequest = true;
    iteration = 0;
}
