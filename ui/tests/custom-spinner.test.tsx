import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CustomSpinner from "../src/components/CustomSpinner";

describe('CustomSpinner', () => {
    it('0', () => {
        const queue = {
            position: 10,
            readyUrl: 'http://localhost:5173/search?q=P69905',
            estimatedTime: 1
        };

        const { container } = render(<CustomSpinner queue={queue} />);

        const spinner = container.querySelector('.custom-spinner');

        expect(spinner).exist;
        // @ts-expect-error classList indeed exists
        expect(spinner?.firstChild?.classList.contains("spinner-border")).true;
        expect(spinner?.querySelector(".spinner-border")).exist;
        expect(spinner?.querySelector("a")?.textContent).contain("Link to the results");
        expect(spinner?.querySelector("a")?.href).equal(queue.readyUrl);
    });

    it('1', () => {
        const queue = {
            position: 10,
            readyUrl: null,
            estimatedTime: 1
        };

        const { container } = render(<CustomSpinner queue={queue} />);

        const spinner = container.querySelector('.custom-spinner');

        expect(spinner).exist;
        // @ts-expect-error classList indeed exists
        expect(spinner?.firstChild?.classList.contains("spinner-border")).true;
        expect(spinner?.querySelector(".spinner-border")).exist;
        expect(spinner?.querySelector("a")).not.exist;
    });
});
