const baseUrl = 'https://rest.uniprot.org/idmapping';
const jobSubmitUrl = '/run';
const jobStatusUrl = '/status';
const jobResultsUrl = '/stream';
const POLLING_INTERVAL = 2000;

type SubmitMapping = {
    jobId: string;
};

type StatusMapping = {
    jobStatus: string;
    results?: unknown[];
};

type Mapping = {
    from: string;
    to: string;
};

export type ResponseMapping = {
    results: Mapping[];
};

async function submitJob(payload: FormData) {
    const url = baseUrl + jobSubmitUrl;

    const response = await fetch(url, {
        method: 'POST',
        body: payload,
    });

    if (!response.ok)
        throw new Error(`Failed to submit mapping job: ${response.statusText}`);

    const data: SubmitMapping = await response.json();

    return data.jobId;
}

async function isJobFinished(jobId: string) {
    const url = `${baseUrl}${jobStatusUrl}/${jobId}`;

    const response = await fetch(url);

    if (!response.ok)
        throw new Error(`Failed to check job status: ${response.statusText}`);

    const data: StatusMapping = await response.json();

    if ("jobStatus" in data) { 
        if (data.jobStatus === "RUNNING") {
            console.log(`UniProt ID to PDB ID mapping: Retrying in ${POLLING_INTERVAL / 1000}s`);

            return false;
        }

        if (data.jobStatus === "FINISHED")
            return true;
    }

    if ("results" in data)
        return true;

    throw new Error(`Unexpected response from server: ${data}`);
}

async function getResults<T>(jobId: string) {
    const url = `${baseUrl}${jobResultsUrl}/${jobId}`;

    const response = await fetch(url);

    if (!response.ok)
        throw new Error(`Failed to get mapping results: ${response.statusText}`);

    const data: T = await response.json();

    return data;
}

async function performAction<T>(payload: FormData) {
    const jobId = await submitJob(payload);

    if (!jobId)
        throw new Error('Failed to perform action');

    await new Promise(resolve => setTimeout(resolve, 1000));

    while (!await isJobFinished(jobId))
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await getResults<T>(jobId);

    return result;
}

export async function getPdbIds(uniProtId: string) {
    const formData = new FormData();
    formData.append('from', 'UniProtKB_AC-ID');
    formData.append('to', 'PDB');
    formData.append('ids', uniProtId);

    let results;
    try {
        results = await performAction<ResponseMapping>(formData);
    } catch (error) {
        const resp: ResponseMapping = {
            results: []
        };
        
        return resp;
    }

    return results;
}

export async function mapGeneToUniProt(geneSymbol: string) {
    const formData = new FormData();
    formData.append('from', 'Gene_Name');
    formData.append('to', 'UniProtKB');
    formData.append('ids', geneSymbol);

    let results;
    try {
        results = await performAction<ResponseMapping>(formData);
    } catch (error) {
       return "";
    }
    
    if (results.results.length === 0)
        return "";

    return results.results[0].to;
}