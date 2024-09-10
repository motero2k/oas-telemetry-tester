const http = require('http');
const { execSync } = require('child_process');

// Replace with your container name
const containerName = 'ks-api'; 

// Function to get the container ID by name
function getContainerId(name) {
    let containerId = '';

    try {
        // Run Docker command to get container ID based on the container name
        const result = execSync(`docker ps -qf "name=${name}"`, { encoding: 'utf-8' });
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

// Function to calculate CPU percentage
function calculateCPUPercentUnix(stats) {
    let cpuPercent = 0.0;
    const previousCPU = stats.precpu_stats.cpu_usage.total_usage;
    const previousSystem = stats.precpu_stats.system_cpu_usage;
    // Calculate the difference between the current and previous CPU usage
    const cpuDelta = parseFloat(stats.cpu_stats.cpu_usage.total_usage) - parseFloat(previousCPU);

    // Calculate the difference between the current and previous system usage
    const systemDelta = parseFloat(stats.cpu_stats.system_cpu_usage) - parseFloat(previousSystem);

    if (systemDelta > 0.0 && cpuDelta > 0.0) {
        // Calculate the CPU percentage based on the number of CPUs and the delta values
        cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;
    }
    return cpuPercent;
}

// Function to start streaming Docker stats and log the CPU percentage
function startStreamingDockerStats( printFullJson = false) {
    console.log('Starting to stream Docker stats...');

    const options = {
        socketPath: '/var/run/docker.sock', // Docker socket path
        path: `/containers/${getContainerId(containerName)}/stats?stream=true`, // API path to stream container stats
        method: 'GET',
    };

    let previousCPU = 0;
    let previousSystem = 0;

    const req = http.request(options, (res) => {
        res.on('data', (chunk) => {
            try {
                const stats = JSON.parse(chunk.toString());

                if(printFullJson){
                    console.log(JSON.stringify(stats, null, 2));
                    //destroy the request
                    req.destroy();
                }

                // Log the calculated CPU percentage
                const cpuPercent = calculateCPUPercentUnix(stats);
                console.log(`CPU Usage: ${cpuPercent.toFixed(2)}%`);

                // Update previous values for next calculation
                previousCPU = stats.cpu_stats.cpu_usage.total_usage;
                previousSystem = stats.cpu_stats.system_cpu_usage;
            } catch (error) {
                console.error('Error parsing stats data:', error);
            }
        });
    });

    req.on('error', (error) => {
        console.error(`Request error: ${error.message}`);
    });

    req.end(); // End the request to start streaming
}

// Start streaming Docker stats
startStreamingDockerStats(printFullJson = true);
