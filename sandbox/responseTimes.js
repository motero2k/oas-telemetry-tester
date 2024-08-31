const axios = require('axios');
const fs = require('fs');

function deleteTpas() {


    for (let i = 0; i < 100; i++) {
        //delete
        axios.delete(`https://registry.bluejay.governify.io/api/v6/agreements/tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v${i}`)
            .then(res => {
                console.log(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    }
}
//{ problemSize: number; baseURL: any; agreementId: any; }
function myUrlBuilder(problemSize, baseURL, agreementId) {
    //problemSize is hours.
    //2024-01-01T00:00:00.000Z
    const startDate = new Date(2024, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * problemSize);
    return `${baseURL}/api/v6/states/${agreementId}/guarantees?from=${startDate.toISOString()}&to=${endDate.toISOString()}&newPeriodsFromGuarantees=false`;
}

async function testResposetimes(offset, count) {
    let results = [];
    let needsToStop = false;
    for (let i = offset; i < offset+count; i++) {
        try {

            let secondUntilReady = Math.abs(60 + 10 - new Date().getSeconds()) % 60;
            const latestTime = results[results.length - 1]?.time == null ? 0 : results[results.length - 1].time;
            if (secondUntilReady * 1000 - latestTime * 1.1 <= 15000) { //suppose nextTime = latestTime + 10%
                console.log("secondUntilReady: " + secondUntilReady + " latestTime: " + latestTime);
                console.log("Waiting " + secondUntilReady + " seconds to start test to avoid collector reset");
                await new Promise((resolve) => setTimeout(resolve, secondUntilReady * 1000));
            }

            let url = myUrlBuilder(i, 'https://registry.bluejay.governify.io', `tpa-Load-test-GH-motero2k_Bluejay-test-TPA-23-24-v1`);
            console.log(url);
            let start = new Date().getTime();
            res = await axios.get(url, { timeout: 31000 });
            console.log(res.data != null);
            let end = new Date().getTime();
            console.log(`Problem size: ${i}, time: ${end - start}`);
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
            console.log(err);
        }
    }
}


function addLineToCSV(line) {
    fs.appendFileSync('results.csv', line + '\n');
}

// deleteTpas();
testResposetimes(1,500);
// printResultsToCSV([{ problemSize: 1, time: 1000 }, { problemSize: 2, time: 2000 }, { problemSize: 3, time: 3000 }]);