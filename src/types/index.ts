export type TestConfig = {
    fixed: any;
    combinable: CombinableParameters;
    iterations: number;
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

export interface Executable {
    run(config:any): Promise<void>;
}

export interface orderOfMagnitude {
    value: number;
    name: string;
    estimatedResponseTime: number;
    secureResponseTime: number;
}