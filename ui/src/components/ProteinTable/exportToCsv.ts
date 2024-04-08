import { Row } from "@tanstack/react-table";
import { FormEvent } from "react";
import { Record } from "./ProteinTable";
import { displayPercentage } from "../../common/utils";

function makeHeader() {
    return `UniProtID;Name;Organism;TM-Score;RMSD;Aligned Residues;Taxonomy ID;Experimental PDB IDs;Sequence;Gene;Is Reviewed (SwissProt)\n`;
}

function prepareDataForExport(data: Row<Record>[]) {
    let output = makeHeader();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        const tmScore: string = (row.getValue("tmScore") as number).toFixed(4);
        const rmsd: string = (row.getValue("rmsd") as number).toFixed(3);
        const aligned_residues: string = displayPercentage(row.getValue("alignedLength"));
        const experimentalStructures = row.original.experimentalStructures === null ? "[]" : JSON.stringify(row.original.experimentalStructures);        
        

        output += `${row.original.uniProtId};"${row.original.name}";"${row.original.organism}";${tmScore};${rmsd};${aligned_residues};`;
        output += `${row.original.taxId};${experimentalStructures};${row.original.sequence};${row.original.gene};${row.original.isReviewed}`;

        if (i < data.length - 1)
            output += "\n";
    }

    output += "\n";

    return output;
}

function makeFilename(resultsSize: number, query: string) {
    let filename = "alphafind-export_";
    const now = new Date();
    const datetime = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    filename += query + "_" + resultsSize + "__" + datetime + ".csv";
    return filename;
}

export default function exportToCsv(event: FormEvent, resultsSize: number, query: string, data: Row<Record>[]) {
    event.preventDefault();
    const blob = new Blob([prepareDataForExport(data)], {
        type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    // Perform download using virtual tag
    const tempLink = document.createElement("a");
    tempLink.download = makeFilename(resultsSize, query);
    tempLink.href = url;
    tempLink.click();
}
