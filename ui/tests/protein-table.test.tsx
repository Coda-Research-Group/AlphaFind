import { describe } from "node:test";
import ProteinTable from "../src/components/ProteinTable";
import { QueryObject, QueryObjectContext } from "../src/pages/ProteinSearch/ProteinSearch";
import { fireEvent, render, screen } from "@testing-library/react";
import { Record } from "../src/components/ProteinTable/ProteinTable";
import { expect, it } from "vitest";
import { act } from "react-dom/test-utils";

const data: Record[] = [{
    uniProtId: "A",
    experimentalStructuresExists: true,
    tmScore: 1,
    rmsd: 8,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 1",
    name: "Name A",
    isReviewed: true,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}, {
    uniProtId: "B",
    experimentalStructuresExists: true,
    tmScore: 0.9,
    rmsd: 7,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 2",
    name: "Name B",
    isReviewed: false,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}, {
    uniProtId: "C",
    experimentalStructuresExists: true,
    tmScore: .8,
    rmsd: 5,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 2",
    name: "Name C",
    isReviewed: false,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}, {
    uniProtId: "D",
    experimentalStructuresExists: true,
    tmScore: .7,
    rmsd: 4,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 3",
    name: "Name D",
    isReviewed: false,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}, {
    uniProtId: "E",
    experimentalStructuresExists: true,
    tmScore: .6,
    rmsd: 2,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 3",
    name: "Name E",
    isReviewed: false,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}, {
    uniProtId: "F",
    experimentalStructuresExists: true,
    tmScore: .5,
    rmsd: 1,
    alignedLength: 3,
    identicalAAs: 4,
    organism: "Organism 2",
    name: "Name F",
    isReviewed: false,
    gene: "Gene A",
    sequence: "ASJDHAJKLSHDKJLASHD",
    taxId: 1,
    experimentalStructures: [],
}];

describe("ProteinTable", () => {
    it("0", () => {
        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        act(() => {
            render(
                <QueryObjectContext.Provider value={queryObject}>
                    <ProteinTable data={data} setExperimentalStructuresModalValue={() => {}} />
                </QueryObjectContext.Provider>
            );
        });

        const container = document.querySelector("body");
        if (container === null)
            expect.fail("container is null");

        const table = container.querySelector(".protein-table");
        if (table === null)
            expect.fail("table is null");

        expect(table).exist;
        expect(table?.querySelector("tbody")?.childNodes.length).equal(3);

        expect(table?.querySelector("tbody tr:first-child td:first-child .text-truncate")?.textContent).contains("Organism 1");
        expect(table?.querySelector("tbody tr:first-child td:first-child button svg")?.getAttribute("data-icon")).eq("angle-right");
        expect(table?.querySelector("tbody tr:first-child td:first-child span")?.textContent).eq("(1)");
        expect(table?.querySelector("tbody tr:first-child td:nth-child(2) a")?.innerHTML).equal("A");

        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child .text-truncate")?.textContent).contains("Organism 2");
        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child span")?.textContent).eq("(3)");
        expect(table?.querySelector("tbody tr:nth-child(2) td:nth-child(2) a")?.innerHTML).equal("F");

        expect(table?.querySelector("tbody tr:nth-child(3) td:first-child .text-truncate")?.textContent).contains("Organism 3");
        expect(table?.querySelector("tbody tr:nth-child(3) td:first-child span")?.textContent).eq("(2)");
        expect(table?.querySelector("tbody tr:nth-child(3) td:nth-child(2) a")?.innerHTML).equal("E");
        
        const expander = container.querySelector(".expand-all");
        fireEvent.click(expander!);
        
        expect(table?.querySelector("tbody")?.childNodes.length).eq(9);
        expect(table?.querySelector("tbody tr:first-child td:first-child .text-truncate")?.textContent).contains("Organism 1");
        expect(table?.querySelector("tbody tr:first-child td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:first-child td:first-child span")?.textContent).eq("(1)");

        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child .text-truncate")?.textContent).eq("Name A");

        expect(table?.querySelector("tbody tr:nth-child(3) td:first-child .text-truncate")?.textContent).eq("Organism 2");
        expect(table?.querySelector("tbody tr:nth-child(3) td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");

        expect(table?.querySelector("tbody tr:nth-child(4) td:first-child .text-truncate")?.textContent).eq("Name B");
        expect(table?.querySelector("tbody tr:nth-child(5) td:first-child .text-truncate")?.textContent).eq("Name C");
        expect(table?.querySelector("tbody tr:nth-child(6) td:first-child .text-truncate")?.textContent).eq("Name F");

        expect(table?.querySelector("tbody tr:nth-child(7) td:first-child .text-truncate")?.textContent).eq("Organism 3");
        expect(table?.querySelector("tbody tr:nth-child(7) td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");

        expect(table?.querySelector("tbody tr:nth-child(8) td:first-child .text-truncate")?.textContent).eq("Name D");
        expect(table?.querySelector("tbody tr:nth-child(9) td:first-child .text-truncate")?.textContent).eq("Name E");
    });

    it("1", () => {
        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        act(() => {
            render(
                <QueryObjectContext.Provider value={queryObject}>
                    <ProteinTable data={data} setExperimentalStructuresModalValue={() => {}} />
                </QueryObjectContext.Provider>
            );
        });

        const container = document.querySelector("body");
        if (container === null)
            expect.fail("container is null");

        const table = container.querySelector(".protein-table");
        if (table === null)
            expect.fail("table is null");
        
        const expander = table.querySelector(".expand-all");
        fireEvent.click(expander!);

        const filter = container.querySelector(".protein-table thead tr:nth-child(2) .organism .filter") as HTMLInputElement;
        fireEvent.change(filter, { target: { value: "1" } });
        
        expect(table?.querySelector("tbody")?.childNodes.length).eq(2);

        expect(table?.querySelector("tbody tr:first-child td:first-child .text-truncate")?.textContent).contains("Organism 1");
        expect(table?.querySelector("tbody tr:first-child td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:first-child td:first-child span")?.textContent).eq("(1)");

        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child .text-truncate")?.textContent).eq("Name A");

        const tablePreContent = container.querySelector(".table-pre .disabled");
        expect(tablePreContent?.textContent).contains("(showing 1 filtered out of 6)");
    });

    it("2", () => {
        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        act(() => {
            render(
                <QueryObjectContext.Provider value={queryObject}>
                    <ProteinTable data={data} setExperimentalStructuresModalValue={() => {}} />
                </QueryObjectContext.Provider>
            );
        });

        const container = document.querySelector("body");
        if (container === null)
            expect.fail("container is null");

        const table = container.querySelector(".protein-table");
        if (table === null)
            expect.fail("table is null");
        
        const expander = table.querySelector(".expand-all");
        fireEvent.click(expander!);

        const filter = container.querySelector(".protein-table thead tr:nth-child(2) .uniProtId .filter") as HTMLInputElement;
        fireEvent.change(filter, { target: { value: "E" } });
        
        expect(table?.querySelector("tbody")?.childNodes.length).eq(2);

        expect(table?.querySelector("tbody tr:first-child td:first-child .text-truncate")?.textContent).contains("Organism 3");
        expect(table?.querySelector("tbody tr:first-child td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:first-child td:first-child span")?.textContent).eq("(1)");

        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child .text-truncate")?.textContent).eq("Name E");

        const tablePreContent = container.querySelector(".table-pre .disabled");
        expect(tablePreContent?.textContent).contains("(showing 1 filtered out of 6)");
    });

    it("3", () => {
        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        act(() => {
            render(
                <QueryObjectContext.Provider value={queryObject}>
                    <ProteinTable data={data} setExperimentalStructuresModalValue={() => {}} />
                </QueryObjectContext.Provider>
            );
        });

        const container = document.querySelector("body");
        if (container === null)
            expect.fail("container is null");

        const table = container.querySelector(".protein-table");
        if (table === null)
            expect.fail("table is null");
        
        const expander = table.querySelector(".expand-all");
        fireEvent.click(expander!);

        const tmscore_asc = table.querySelector("th.tmScore span.cursor-pointer");
        fireEvent.click(tmscore_asc!);
        
        expect(table?.querySelector("tbody")?.childNodes.length).eq(9);

        expect(table?.querySelector("tbody tr:first-child td:first-child .text-truncate")?.textContent).contains("Organism 3");
        expect(table?.querySelector("tbody tr:first-child td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:first-child td:first-child span")?.textContent).eq("(2)");

        expect(table?.querySelector("tbody tr:nth-child(2) td:first-child .text-truncate")?.textContent).eq("Name E");
        expect(table?.querySelector("tbody tr:nth-child(3) td:first-child .text-truncate")?.textContent).eq("Name D");

        expect(table?.querySelector("tbody tr:nth-child(4) td:first-child .text-truncate")?.textContent).eq("Organism 2");
        expect(table?.querySelector("tbody tr:nth-child(4) td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:nth-child(4) td:first-child span")?.textContent).eq("(3)");


        expect(table?.querySelector("tbody tr:nth-child(5) td:first-child .text-truncate")?.textContent).eq("Name F");
        expect(table?.querySelector("tbody tr:nth-child(6) td:first-child .text-truncate")?.textContent).eq("Name C");
        expect(table?.querySelector("tbody tr:nth-child(7) td:first-child .text-truncate")?.textContent).eq("Name B");

        expect(table?.querySelector("tbody tr:nth-child(8) td:first-child .text-truncate")?.textContent).eq("Organism 1");
        expect(table?.querySelector("tbody tr:nth-child(8) td:first-child button svg")?.getAttribute("data-icon")).eq("angle-down");
        expect(table?.querySelector("tbody tr:nth-child(8) td:first-child span")?.textContent).eq("(1)");

        expect(table?.querySelector("tbody tr:nth-child(9) td:first-child .text-truncate")?.textContent).eq("Name A");
    });
});
