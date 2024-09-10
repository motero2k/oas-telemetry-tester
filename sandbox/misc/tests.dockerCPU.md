## Testing docker CPU usage formula
 
git clone https://github.com/pafmon/ks-api.git
cd ks-api/
docker run -d -p 1234:80 --name ks-api ks-api:latest

/home/ubuntu/governify/telemetry-testing/oas-telemetry-tester# node sandbox/misc/tests.dockerCPU.js

curl http://localhost:1234/api/v1/stress/10/10

CPU Usage: 0.03%
CPU Usage: 0.00%
CPU Usage: 0.00%

curl http://localhost:1234/api/v1/stress/1000000/1000000

CPU Usage: 96.55%
CPU Usage: 120.76%
CPU Usage: 116.66%
CPU Usage: 138.01%
CPU Usage: 121.65%
CPU Usage: 187.63%
CPU Usage: 0.00%
CPU Usage: 0.00%
CPU Usage: 0.01%
CPU Usage: 0.00%
CPU Usage: 0.00%
CPU Usage: 0.01%
CPU Usage: 0.00%


curl http://localhost:1234/api/v1/stress/1000000/1000000

CPU Usage: 67.06%
CPU Usage: 131.80%
CPU Usage: 146.72%
CPU Usage: 78.88%
CPU Usage: 0.02%
CPU Usage: 0.00%
CPU Usage: 0.00%

2016  docker container rm -f ks-api