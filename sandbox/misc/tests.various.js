const axios = require('axios');
const fs = require('fs');

logger = {
    log: function (message) {
        let time = new Date().toISOString();
        console.log(time + ":", message);
    }
}

function getElapsedTime(start) {
    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsedTime = seconds * 1e3 + nanoseconds / 1e6; // Convierte a milisegundos
    return elapsedTime;
}

function deleteTpas() {


    for (let i = 0; i < 100; i++) {
        //delete
        axios.delete(`https://registry.bluejay.governify.io/api/v6/agreements/tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v${i}`)
            .then(res => {
                logger.log(res.data);
            })
            .catch(err => {
                logger.log(err);
            });
    }
}
//{ problemSize: number; baseURL: any; agreementId: any; }
function myUrlBuilder(problemSize, baseURL, agreementId) {
    //problemSize is hours.
    //2024-01-01T00:00:00.000Z
    const startDate = new Date(2024, 1, 1, 5, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * problemSize - 1);
    const url = `${baseURL}/api/v6/states/${agreementId}/guarantees?from=${startDate.toISOString()}&to=${endDate.toISOString()}&newPeriodsFromGuarantees=false`;
    logger.log(url);
    return url;
}


async function testResposetimes(offset, count) {
    let results = [];
    let needsToStop = false;
    for (let i = offset; i < offset + count; i++) {
        try {


            let secondUntilReady = getSecondsUntilNextMinute();
            const latestTime = results[results.length - 1]?.time == null ? 0 : results[results.length - 1].time;
            if (secondUntilReady * 1000 - latestTime * 1.1 <= 15000) { //suppose nextTime = latestTime + 10%
                logger.log("secondUntilReady: " + secondUntilReady + " latestTime: " + latestTime);
                logger.log("Waiting " + secondUntilReady + " seconds to start test to avoid collector reset");
                await new Promise((resolve) => setTimeout(resolve, secondUntilReady * 1000));
            }


            let url = myUrlBuilder(i, 'https://registry.bluejay.governify.io', `tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1`);
            logger.log(url);
            let start = process.hrtime();
            res = await axios.get(url, { timeout: 31000 });
            logger.log(res.data != null);
            let end = getElapsedTime(start);
            logger.log(`Problem size: ${i}, time: ${end - start}`);
            results.push({ problemSize: i, time: end - start });
            addLineToCSV(`${i},${end - start}`);
            if (results[results.length]?.time > 30000) {
                needsToStop = true;
            }


            if (needsToStop) {
                break;
            }


        }
        catch (err) {
            logger.log(err);
        }
    }
}




function addLineToCSV(line) {
    fs.appendFileSync('sandbox/responseTimes.csv', line + '\n');
}

function getSecondsUntilNextMinute(secondOffset = 5, now = new Date().getSeconds()) {
    let remainingSeconds = Math.abs(60 - now + secondOffset) % 60;
    return remainingSeconds;
}

async function awaitCollectorReset() {
    let secondUntilReady = getSecondsUntilNextMinute();
    logger.log("Waiting " + secondUntilReady + " seconds to start test to avoid collector reset");
    await new Promise((resolve) => setTimeout(resolve, secondUntilReady * 1000));
}





async function meanResponseTime(iterations, hoursArray) {
    for (let hours of hoursArray) {
        logger.log(`Starting test for ${hours} hours`);
        let results = [];
        let url = myUrlBuilder(hours, 'http://localhost:5400', `tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v0`);
        console.log(url);

        for (let i = 0; i < iterations; i++) {
            try {
                logger.log(`Iteration: ${i}`);
                let secondsUntilNextMinute = getSecondsUntilNextMinute();
                let lastRequest = results[results.length - 1];

                let lastRequestTime = 0;
                if (lastRequest != null) lastRequestTime = lastRequest.time;
                if (secondsUntilNextMinute * 1000 - lastRequestTime * 1.05 < 10000) {
                    await awaitCollectorReset();
                }
                let start = process.hrtime();
                let res = await axios.get(url, { timeout: 31000 });
                let elapsedTime = getElapsedTime(start);
                logger.log(`Iteration: ${i}, time: ${elapsedTime}`);
                results.push({ iteration: i, time: elapsedTime });
            }
            catch (err) {
                logger.log(err.message);
            }
        }
        let mean = results.reduce((acc, curr) => acc + curr.time, 0) / results.length;
        let stdv = Math.sqrt(results.reduce((acc, curr) => acc + Math.pow(curr.time - mean, 2), 0) / results.length);
        let vc = stdv / mean;
        let max = Math.max(...results.map(r => r.time));
        let min = Math.min(...results.map(r => r.time));
        const text = `Iterations: ${iterations},Hours: ${hours} Mean: ${mean}, Stdv: ${stdv}, VC: ${vc}, Max: ${max}, Min: ${min}, Results: ${results.map(r => r.time)}`;
        logger.log(text);
        addLineToCSV(text);

    }
}






//checks if collector events is conected. jsut printe to conosle time and status of the petition
function ckeckCollectorStatus(period = 500) {
    setInterval(async () => {
        try {
            let res = await axios.get('https://event.collector.bluejay.governify.io/docs', { timeout: 31000 });
            let currentSeconds = new Date().getSeconds();
            logger.log(`Time: ${currentSeconds}, Status: ${res.status}`);
        }
        catch (err) {
            logger.log(err.message);
        }
    }, period);
}
const { run } = require('apipecker');
function showApiPeckerResponses(){
    console.log("showApiPeckerResponses");
    run({
        concurrentUsers: 1,
        iterations: 5,
        delay: 500,
        url: "https://google.com",
        verbose: true,
        loggerLogging: true,
        resultsHandler: myResultsHandler
    })
}

function myResultsHandler(results){
    console.log(JSON.stringify(results, null, 2));
}




// deleteTpas();
// testResposetimes(1,500);
// meanResponseTime(iterations = 20, [24*2]);
// ckeckCollectorStatus(500);
// showApiPeckerResponses();
