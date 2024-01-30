import { Row } from "@tanstack/react-table";
import { FormEvent } from "react";
import { Record } from "./ProteinTable";
import { displayPercentage } from "../../common/utils";

function makeHeader() {
    return `UniProtID;Name;Organism;TM-Score;RMSD;Aligned Residues\n`;
}

function prepareDataForExport(data: Row<Record>[]) {
    let output = makeHeader();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        const tmScore: string = (row.getValue("tmScore") as number).toFixed(4);
        const rmsd: string = (row.getValue("rmsd") as number).toFixed(3);
        const aligned_residues: string = displayPercentage(row.getValue("alignedLength"));
        
        

        output += `${row.getValue("uniProtId")};${row.original.name};${row.getValue("organism")};${tmScore};${rmsd};${aligned_residues}`;

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
