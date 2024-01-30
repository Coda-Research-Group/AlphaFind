import { Record } from "../../components/ProteinTable/ProteinTable";
import { calcOffsetLimit } from "../../common/utils";
import { callUniProtMapping, canBePdbID } from "./pdbToUniProtMapping";
import getGeneMapping from "./geneToUniProtMapping";


type ParsedAPIResponse = {
    data: Record[];
    queuePosition?: number;
    searchTime: number;
    originalSearchValue: string;
    isValueValidUniProtID: boolean;
    isInAlphaFoldDB: boolean;
};

type APIRawResponseRecord = {
    object_id: string;
    rmsd: number;
    tm_score: number;
    aligned_percentage: number;
    sequence_aligned_percentage: number;
};

type APIRawResponse = {
    results: APIRawResponseRecord[];
    queue_position?: number;
    search_time?: number;
};

// Needed to pass the potentially changed value (query id) from fetchBackend (pdb -> uniprot)
type CallBackendResponse = {
    apiResponse: APIRawResponse;
    originalSearchValue: string;
    // Used to display whether the query is a valid UniProt ID when the backend returns no results
    isValueValidUniProtID: boolean;
    // Used to display whether the query is in the AlphaFold DB when the backend returns no results
    // and the query is a valid UniProt ID
    isInAlphaFoldDB: boolean;
};

/** 
 * Actual call to the backend.
 */
async function fetchLMI(queryValue: string, currentRowCount: number, limit: number): Promise<APIRawResponse> {
    const paginationParams = calcOffsetLimit(currentRowCount, limit);

    const baseApiUrl = import.meta.env.VITE_API_URL;
    const res = await fetch(`${baseApiUrl}/search?query=${queryValue}&offset=${paginationParams[0]}&limit=${paginationParams[1]}`);

    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);

    const json: APIRawResponse = await res.json();

    return json;
}

async function isValidUniProtID(value: string): Promise<boolean> {
    const res = await fetch(`https://rest.uniprot.org/uniprotkb/${value}.json`);

    return res.status === 200;
}

async function isInAlphaFoldDB(value: string): Promise<boolean> {
    const res = await fetch(`https://www.alphafold.ebi.ac.uk/api/prediction/${value}?key=AIzaSyCeurAJz7ZGjPQUtEaerUkBZ3TaBkXrY94`);
    
    return res.status === 200;
}

async function tryMapping(queryValue: string, mutableResult: CallBackendResponse) {
    let uniProtId = "";

    // can the input be a pdb id? -> make a call to uniProt mapping
    if (canBePdbID(queryValue))
        uniProtId = await callUniProtMapping(queryValue)

    // if that failed, the input can be a gene symbol
    if (uniProtId === "")
        uniProtId = await getGeneMapping(queryValue)

    // if that failed, the input may still be valid UniProt ID but it is not in our database
    if (uniProtId === "") {
        mutableResult.isValueValidUniProtID = await isValidUniProtID(queryValue);

        // if it is valid, we can check whether it is in the AlphaFold DB
        if (mutableResult.isValueValidUniProtID)
            mutableResult.isInAlphaFoldDB = await isInAlphaFoldDB(queryValue);

        return uniProtId;
    }

    // Mapping was successful
    console.log(`Changing PDB ID/Gene symbol: ${queryValue} to UniProtID: ${uniProtId}`);

    return uniProtId;
}

async function rec(queryValue: string, fn: (v: string) => Promise<APIRawResponse>, mutableResult: CallBackendResponse) {
    const response = await fn(queryValue);

    // No matter what there is waiting queue
    if (response.queue_position !== undefined) {
        mutableResult.apiResponse.queue_position = response.queue_position;
        return response;
    }

    // We got results
    if (response.results.length > 0) {
        mutableResult.originalSearchValue = queryValue;
        return response;
    }

    // We got no results, try mapping
    const newQueryValue = await tryMapping(queryValue, mutableResult);

    // Mapping was not successful -> there are indeed no results
    if (newQueryValue === "")
        return response;

    // Mapping was successful -> try again the same function with new value to handle possible waiting queue
    return rec(newQueryValue, fn, mutableResult);
}

/**
 * Function checks whether the query is a PDB ID and if so, it makes a call to UniProt mapping.
 * If the mapping is successful, the function makes a call to the backend via custom funtion call.
 * 
 * @param queryValue - The value to search for.
 * @param currentRowCount - The current number of rows.
 * @param limit - The total fetch limit.
 * @returns A promise that resolves to a CallBackendResponse object.
 */
export async function fetchBackend(queryValue: string, currentRowCount: number, limit: number): Promise<CallBackendResponse> {
    const fn = (v: string) => fetchLMI(v, currentRowCount, limit);

    const result: CallBackendResponse = {
        apiResponse: {
            results: [],
        },
        originalSearchValue: queryValue,
        isValueValidUniProtID: false,
        isInAlphaFoldDB: false,
    };

    const response = await rec(queryValue, fn, result);
    result.apiResponse.results = response.results;
    if (response.search_time !== undefined)
        result.apiResponse.search_time = response.search_time;

    return result;
}

/**
 * Fetches single metadata for an object using the AlphaFold API based on UniProtID.
 * @param object - The API result object.
 * @returns A promise that resolves to the prepared row containing the fetched metadata.
 */
async function fetchSingleMetadata(object: APIRawResponseRecord): Promise<Record> {
    const res = await fetch(`https://www.alphafold.ebi.ac.uk/api/prediction/${object.object_id}?key=AIzaSyCeurAJz7ZGjPQUtEaerUkBZ3TaBkXrY94`);
    
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);

    const json = await res.json();

    const record: Record = {
        rmsd: object.rmsd,
        tmScore: object.tm_score,
        alignedLength: object.aligned_percentage,
        identicalAAs: object.sequence_aligned_percentage,
        experimentalStructuresExists: false,
        organism: json['0']['organismScientificName'],
        uniProtId: object.object_id,
        name: json['0']['uniprotDescription'],
    };

    return record;
}

/**
 * Fetches metadata for a list of objects.
 * @param objects - The list of objects to fetch metadata for.
 * @returns A promise that resolves to an array of prepared rows.
 */
export async function fetchMetadata(objects: APIRawResponseRecord[]): Promise<Record[]> {
    const requests = objects.map(o => fetchSingleMetadata(o));

    const promises = await Promise.all(requests);

    return promises;
}

/** 
 * Returns the metadata for objectId used in as the query object.
 */
export async function fetchQueryObjectMetadata(objectId: string) {
    const data: APIRawResponseRecord = {
        object_id: objectId,
        // Rest is unused in this context
        rmsd: 0,
        tm_score: 0,
        aligned_percentage: 0,
        sequence_aligned_percentage: 0,
    };

    return fetchSingleMetadata(data);
}

export async function fetchData(queryValue: string, currentData: Record[], limit: number): Promise<ParsedAPIResponse> {
    const response: ParsedAPIResponse = {
        data: [],
        searchTime: 0,
        originalSearchValue: queryValue,
        isValueValidUniProtID: false,
        isInAlphaFoldDB: false,
    };

    const backendResponse = await fetchBackend(queryValue, currentData?.length, limit);

    response.originalSearchValue = backendResponse.originalSearchValue;
    response.isInAlphaFoldDB = backendResponse.isInAlphaFoldDB;
    response.isValueValidUniProtID = backendResponse.isValueValidUniProtID;
    response.searchTime = backendResponse.apiResponse.search_time ?? 0;

    if (backendResponse.apiResponse.queue_position !== undefined)
        response.queuePosition = backendResponse.apiResponse.queue_position;

    // No need to fetch metadata if no result (or queue)
    if (backendResponse.apiResponse.results.length === 0)
        return response;

    const metadataResponse = await fetchMetadata(backendResponse.apiResponse.results);

    response.data = currentData === undefined ? metadataResponse : currentData.concat(metadataResponse);

    return response;
}
