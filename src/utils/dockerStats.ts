import * as http from 'http';
import * as fs from 'fs';
import { execSync } from 'child_process';

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
            console.log(`No container found with the name: ${name}`);
        } else {
            console.log(`Container ID for ${name}: ${containerId}`);
        }
    } catch (error) {
        console.error('Error fetching container ID:', error);
    }

    return containerId;
}

function startStreamingDockerStats(identifier: string) {
    console.log('Starting to stream Docker stats...');
    const options: http.RequestOptions = {
        socketPath: '/var/run/docker.sock',
        path: `/containers/${getContainerId(containerName)}/stats?stream=true`,
        method: 'GET',
    };

    req = http.request(options, (res) => {
        res.on('data', (chunk) => {
            if (endRequest && req) {
                req.destroy(); // Properly abort the request
                saveMetricsCsv('outputs/stats-run-autosave');
                console.log("Request aborted and metrics saved.");
                return; // Exit the function
            }

            try {
                const stats = JSON.parse(chunk.toString());
                const timestamp = new Date().toISOString();
                const data = {
                    identifier: identifier,
                    timestamp: timestamp,
                    cpu_usage: stats.cpu_stats?.cpu_usage.total_usage,
                    memory_usage: stats.memory_stats?.usage,
                    memory_limit: stats.memory_stats?.limit,
                };
                // Store the continuous stream of data in memory
                statsData.push(data);
                const line = `${identifier},${timestamp},${data.cpu_usage},${data.memory_usage},${data.memory_limit}`;
                addLineToCsvFile('outputs/stats-run.csv', line);

                console.log("updating:", data);
            } catch (error) {
                console.error('Error parsing stats data:', error);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

function addLineToCsvFile(filePath: string, line: string) {
    try {
        fs.appendFileSync(filePath, line + '\n', 'utf8');
    } catch (error) {
        console.error('Failed to add line to CSV file:', error);
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
        console.log(`Metrics saved to CSV at ${filePath}`);
    } catch (error) {
        console.error('Failed to save metrics to CSV:', error);
    }
}

export function startDockerStats(identifier: string): void {
    endRequest = false;
    statsData = [];
    startStreamingDockerStats(identifier);
}

export function stopDockerStats(): void {
    endRequest = true;
    if (req) {
        req.destroy(); // Properly abort the request
        saveMetricsCsv('outputs/stats-run-autosave');
        console.log("Streaming stopped and metrics saved.");
    }
}
