type Mapping = {
    entity_id: number;
    chain_id: string;
    struct_asym_id: string;
    unp_start: number;
    unp_end: number;
    start: {
        residue_number: number;
        author_residue_number: any;
        author_insertion_code: string;
    };
    end: {
        residue_number: number;
        author_residue_number: any;
        author_insertion_code: string;
    };
};

type UniProtMapping = {
    name: string;
    mappings: Mapping[];
    identifier: string;
};

type ApiResponseUniprot = {
    [pdbId: string]: {
        UniProt: {
            [uniProtId: string]: UniProtMapping;
        };
    };
};

function canBePdbID(str: string) {
    // PDB ID should be either 4 characters alphanumeric or 8 characters prefixed by 'pdb'
    // from `https://www.rcsb.org/docs/general-help/identifiers-in-pdb`
    if (typeof str === 'string') {
        // Check for 4 characters alphanumeric PDB ID
        if (str.length === 4 && /^[a-zA-Z0-9]+$/.test(str))
            return true;

        // Check for 5 characters alphanumeric + ':' with optional chain specification
        if (str.length > 4 && /^[a-zA-Z0-9]+:[a-zA-Z0-9]+$/.test(str))
            return true;

        // Check for 8 characters PDB ID prefixed by 'pdb'
        if (str.length === 8 && /^pdb[A-Za-z0-9]+$/.test(str))
            return true;
    }

    return false;
}

async function getPdbMapping(pdbId: string, chainId: string): Promise<string> {
    const apiUrl = `https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${pdbId}`;
    let data: ApiResponseUniprot;
    
    try {
        const response = await fetch(apiUrl);

        if (!response.ok)
            return "";

        data = await response.json();
    } catch (error) {
        // Handle errors during the API call
        console.error('Error during API call:', error);

        return "";
    }

    // Iterate through the UniProt IDs in the response
    for (const uniProtId in data[pdbId.toLowerCase()]['UniProt']) {
        for (const mapping of data[pdbId.toLowerCase()]['UniProt'][uniProtId].mappings) {
            // No chain specified -> return the first UniProt ID
            if (chainId === '')
                return uniProtId;
            
            // Chain specified
            if (chainId === mapping.chain_id || chainId === mapping.struct_asym_id)
                return uniProtId;
        }
    }

    return "";
}

async function callUniProtMapping(value: string): Promise<string> {
    let pdb = value;
    let chain_id = '';

    // The chain is specified
    if (value.includes(':')) {
        pdb = value.split(':')[0];
        chain_id = value.split(':')[1];
    }

    return await getPdbMapping(pdb, chain_id);
}

export { callUniProtMapping, canBePdbID };
