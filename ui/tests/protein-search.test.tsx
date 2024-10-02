import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProteinSearch } from "../src/pages/ProteinSearch/ProteinSearch";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("ProteinSearch", () => {
    it("0", () => {
        const queryClient = new QueryClient();
        const { container } = render(<>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={["/search"]}>
                    <ProteinSearch />
                </MemoryRouter>
            </QueryClientProvider>
        </>);

        const el = container.querySelector('.examples');
        expect(el).exist;
        expect(el?.childNodes.length).equal(3);

        const input = container.querySelector('#search');
        expect(input).exist;
        expect(input?.classList.contains("is-invalid")).false;
        
        const span = container.querySelector('.input-group-text');
        expect(span?.classList.contains("is-invalid")).false;

        const form = container.querySelector('form');
        expect(form?.classList.contains("large")).true;
    });

    it.skip("1", async () => {
        const queryClient = new QueryClient();
        const { container } = render(<>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={["/search?q=uniProtId"]}>
                    <ProteinSearch />
                </MemoryRouter>
            </QueryClientProvider>
        </>);

        const el = container.querySelector('.examples');
        expect(el).not.exist;

        const input = container.querySelector('#search');
        expect(input).exist;

        await new Promise((r) => setTimeout(r, 5000));
        
        expect(input?.classList.contains("is-invalid")).true;

        const span = container.querySelector('.input-group-text');
        expect(span?.classList.contains("is-invalid")).true;

        const form = container.querySelector('form');
        expect(form?.classList.contains("large")).false;

        const box = container.querySelector('.load-info');
        expect(box).exist;
        expect(box?.querySelectorAll("li").length).equal(2);

        expect(container.querySelector(".search-info")?.nextSibling).exist;
        expect(screen.getByText(/This protein is unknown to AlphaFind or it does not exist./)).exist;

        expect(container.querySelector(".table-pre")).not.exist;
        expect(container.querySelector(".protein-table")).not.exist;
        expect(container.querySelector(".table-post")).not.exist;
        expect(container.querySelector(".load-more_container")).not.exist;
    });
});
