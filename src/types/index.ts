export interface TestConfig {
    printableProperties: string[];
    repeatTestCount: number;
    currentIteration: number;
    minutesPerTest: number; //Used for long duration tests (does not stop the app)
    executableTest: any;
    telemetryStatus: string;
    testname: string;
    baseURL: string;
    telemetryInApp: boolean;
    concurrentUsers: number;
    orderOfMagnitude: orderOfMagnitude;
    agreementId: string;
}
export interface Executable {
    config: TestConfig;
    run(): Promise<void>;
}

export type CombinableParameters = {
    [key: string]: any[]
}


export interface TestCaseConfig {
    fixed: { [key: string]: any },
    combinations: CombinableParameters;
}
export type HeapStats = {
    "total_heap_size": 57.348,
    "total_heap_size_executable": 2,
    "total_physical_size": 57.348,
    "total_available_size": 4099.035,
    "used_heap_size": 43.971,
    "heap_size_limit": 4144,
    "malloced_memory": 1.145,
    "peak_malloced_memory": 5.889,
    "does_zap_garbage": 0,
    "number_of_native_contexts": 0,
    "number_of_detached_contexts": 0,
    "total_global_handles_size": 0.016,
    "used_global_handles_size": 0.006,
    "external_memory": 2.574,
    "units": "MB"
}

export type ApiPeckerResults = {
    lotStats: any[],
    summary: {
        count: number,
        min: number,
        max: number,
        mean: number,
        std: number
    }
}



export interface orderOfMagnitude {
    value: number;
    name: string;
    estimatedResponseTime: number;
    secureResponseTime: number;
}

export interface HeapAndResponseTimesConfig {
    requests: number;
    delay: number;
    url: string;
}


export const dockerStats = {
    "read": "2024-09-09T18:12:38.089898747Z",
    "preread": "0001-01-01T00:00:00Z",
    "pids_stats": {
      "current": 18
    },
    "num_procs": 0,
    "storage_stats": {},
    "cpu_stats": {
      "cpu_usage": {
        "total_usage": 1015983707,
        "percpu_usage": [
          229651667,
          70033962,
          471032027,
          88072882,
          68268051,
          63567518,
          11336933,
          14020667
        ],
        "usage_in_kernelmode": 110000000,
        "usage_in_usermode": 910000000
      },
      "system_cpu_usage": 165866492020000000,
      "online_cpus": 8,
      "throttling_data": {
        "periods": 0,
        "throttled_periods": 0,
        "throttled_time": 0
      }
    },
    "precpu_stats": {
      "cpu_usage": {
        "total_usage": 0,
        "usage_in_kernelmode": 0,
        "usage_in_usermode": 0
      },
      "throttling_data": {
        "periods": 0,
        "throttled_periods": 0,
        "throttled_time": 0
      }
    },
    "memory_stats": {
      "usage": 39550976,
      "max_usage": 55717888,
      "stats": {
        "active_anon": 34467840,
        "active_file": 0,
        "cache": 0,
        "dirty": 0,
        "hierarchical_memory_limit": 9223372036854772000,
        "hierarchical_memsw_limit": 0,
        "inactive_anon": 0,
        "inactive_file": 0,
        "mapped_file": 0,
        "pgfault": 36861,
        "pgmajfault": 0,
        "pgpgin": 34386,
        "pgpgout": 25992,
        "rss": 34377728,
        "rss_huge": 0,
        "total_active_anon": 34467840,
        "total_active_file": 0,
        "total_cache": 0,
        "total_dirty": 0,
        "total_inactive_anon": 0,
        "total_inactive_file": 0,
        "total_mapped_file": 0,
        "total_pgfault": 36861,
        "total_pgmajfault": 0,
        "total_pgpgin": 34386,
        "total_pgpgout": 25992,
        "total_rss": 34377728,
        "total_rss_huge": 0,
        "total_unevictable": 0,
        "total_writeback": 0,
        "unevictable": 0,
        "writeback": 0
      },
      "limit": 33554694144
    },
    "name": "/ks-api",
    "id": "9deee180d1ae426ae999beef61c1aa7f9d5abeaf78e4f40809ac7db55e6465db",
    "networks": {
      "eth0": {
        "rx_bytes": 1156,
        "rx_packets": 14,
        "rx_errors": 0,
        "rx_dropped": 0,
        "tx_bytes": 0,
        "tx_packets": 0,
        "tx_errors": 0,
        "tx_dropped": 0
      }
    }
  }