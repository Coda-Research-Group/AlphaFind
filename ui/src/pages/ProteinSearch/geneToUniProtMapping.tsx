type SubmitMapping = {
    jobId: string;
};

type StatusMapping = {
    jobStatus: string;
};

type Mapping = {
    from: string;
    to: string;
};

type ResponseMapping = {
    results: Mapping[];
};

async function waitForMappingReady(jobStatusUrl: string) {
    const POLLING_INTERVAL = 2000;
    
    try {
        const response = await fetch(jobStatusUrl);
        const data: StatusMapping = await response.json();

        if ('jobStatus' in data) {
            if (data.jobStatus === 'RUNNING') {
                console.log(`Gene symbol to UniProtID mapping: Retrying in ${POLLING_INTERVAL / 1000}s`);

                await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                
                return waitForMappingReady(jobStatusUrl);
            }

            if (data.jobStatus === 'FINISHED')
                return true;
        }

        // the 'status' call gets translated into 'results' call once the job is finished
        if ('results' in data)
            return true;

        throw new Error(`Unexpected response from server: ${data}`);
    } catch (error) {
        console.error('Error:', error);

        return false;
    }
}

const getGeneMapping = async (geneSymbol: string): Promise<string> => {
    const baseUrl = 'https://rest.uniprot.org/idmapping'
    const jobSubmitUrl = baseUrl + '/run';
    const jobStatusUrl = baseUrl + '/status';
    const jobResultsUrl = baseUrl + '/stream';
    const formData = new FormData();
    formData.append('from', 'Gene_Name');
    formData.append('to', 'UniProtKB');
    formData.append('ids', geneSymbol);

    try {
        // Making the API call using the fetch function
        const response = await fetch(jobSubmitUrl, {
            method: 'POST',
            body: formData
          });

        // Check if the response status is OK (status code 200)
        if (!response.ok)
            return '';

        // Submit the job
        const jobSubmitData: SubmitMapping = await response.json();
        
        // Check if the job is finished
        const isJobFinished: boolean = await waitForMappingReady(jobStatusUrl + '/' + jobSubmitData.jobId);
        
        if (isJobFinished) {
            // Get the results
            const response = await fetch(jobResultsUrl + '/' + jobSubmitData.jobId);
            const data: ResponseMapping = await response.json();
            
            if (data.results.length === 0)
                return '';

            // even if there are multiple results (e.g. for `NLGN1`), we only return the first one
            return data.results[0].to;
        }

        console.error('"Job finished" check returned false');
        return '';

    } catch (error) {
        // Handle errors during the API call
        console.error('Error during API call:', error);

        return '';
    }
};

export default getGeneMapping;
