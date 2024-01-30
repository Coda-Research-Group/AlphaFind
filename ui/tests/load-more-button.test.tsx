import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadMoreButton from "../src/components/LoadMoreButton";

describe("LoadMoreButton", () => {
    it('0', () => {
        const { container } = render(<LoadMoreButton isLoading={false} loadMoreFn={() => {}} queue={undefined} currentDataLength={50} />);

        const el = container.querySelector('.load-more');

        expect(el?.textContent).contain("Load 50 More Structures");
        expect(el?.querySelectorAll("div").length).toBe(0);
        expect(el?.attributes.getNamedItem("disabled")).not.exist;
    });

    it('1', () => {
        const { container } = render(<LoadMoreButton isLoading={true} loadMoreFn={() => {}} queue={undefined} currentDataLength={50} />);

        const el = container.querySelector('.load-more');

        expect(el?.textContent).not.contain("Load 50 More Structures");
        // @ts-expect-error classList indeed exists
        expect(el?.firstChild?.classList.contains("spinner-border")).true;
        expect(el?.nextSibling).exist;
        expect(el?.attributes.getNamedItem("disabled")).exist;
    });

    it('2', () => {
        const { container } = render(<LoadMoreButton isLoading={false} loadMoreFn={() => {}} queue={undefined} currentDataLength={980} />);

        const el = container.querySelector('.load-more');

        expect(el?.textContent).contain("Load 20 More Structures");
        expect(el?.querySelectorAll("div").length).toBe(0);
        expect(el?.nextSibling).not.exist
        expect(el?.attributes.getNamedItem("disabled")).not.exist;
    });
});
