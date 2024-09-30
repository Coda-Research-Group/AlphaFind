import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryObject, QueryObjectContext } from "../src/pages/ProteinSearch/ProteinSearch";
import SearchMetaBox from "../src/components/SearchMetaBox";

describe('LoadInfoBox', () => {
    it('0', () => {
        const loading = false;
        const originalInput = "P69905";
        const searchTime = 1;

        const { container } = render(<SearchMetaBox loading={loading} originalInput={originalInput} searchTime={searchTime} setExperimentalStructuresModalValue={() => {}} />);

        const el = container.querySelector('.load-info');
        expect(el).exist;
        expect(el?.querySelectorAll("li").length).equal(2);
        expect(el?.querySelectorAll("li")[0].textContent).contain("Query");
        expect(el?.querySelectorAll("li")[1].textContent).contain("Search Time");
    });

    it('1', () => {
        const loading = false;
        const originalInput = "P69905";
        const searchTime = 1;

        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        const { container } = render(
            <QueryObjectContext.Provider value={queryObject}>
                <SearchMetaBox loading={loading} originalInput={originalInput} searchTime={searchTime} setExperimentalStructuresModalValue={() => {}} />
            </QueryObjectContext.Provider>
        );

        const el = container.querySelector('.load-info');
        expect(el).exist;
        expect(el?.querySelectorAll("li").length).equal(5);
        expect(el?.querySelectorAll("li")[0].textContent).contain("Query");
        expect(el?.querySelectorAll("li")[1].textContent).contain("Name: BBB");
        expect(el?.querySelectorAll("li")[2].textContent).contain("Organism: CCC");
        expect(el?.querySelectorAll("li")[3].textContent).contain("AAA in UniProt");
        expect(el?.querySelectorAll("li")[4].textContent).contain("Search Time");
    });

    it('1', () => {
        const loading = true;
        const originalInput = "P69905";
        const searchTime = 1;

        const queryObject: QueryObject = {
            uniProtId: "AAA",
            name: "BBB",
            organism: "CCC",
        };

        const { container } = render(
            <QueryObjectContext.Provider value={queryObject}>
                <SearchMetaBox loading={loading} originalInput={originalInput} searchTime={searchTime} setExperimentalStructuresModalValue={() => {}} />
            </QueryObjectContext.Provider>
        );

        const el = container.querySelector('.load-info');
        expect(el).exist;
        expect(el?.querySelectorAll("li").length).equal(5);
        expect(el?.querySelectorAll("li")[0].textContent).contain("Query");
        expect(el?.querySelectorAll("li")[1].textContent).contain("Name: BBB");
        expect(el?.querySelectorAll("li")[2].textContent).contain("Organism: CCC");
        expect(el?.querySelectorAll("li")[3].textContent).contain("AAA in UniProt");
        expect(el?.querySelectorAll("li")[4].textContent).contain("Search Time");
        
        const spinner = container.querySelector('.spinner-border');
        expect(spinner).exist;
    });
});
