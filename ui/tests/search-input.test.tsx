import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchInput from "../src/components/SearchInput";

describe("SearchInput", () => {
    it('0', () => {
        const { container } = render(<SearchInput large={true} invalid={false} onSearch={() => {}} inputValue={""} setInputValue={() => {}} />);

        const el = container.querySelector('input');

        expect(el).exist;
        expect(el?.attributes.getNamedItem("placeholder")?.value).equal("e.g. P10632, 1TQN or NLGN1");
        expect(el?.classList.contains("is-invalid")).false;

        const form = container.querySelector('form');

        expect(form).exist;
        expect(form?.classList.contains("large")).true;

        const span = container.querySelector('.input-group-text');
        expect(span).exist;
        expect(span?.classList.contains("is-invalid")).false;
    });

    it('1', () => {
        const { container } = render(<SearchInput large={true} invalid={true} onSearch={() => {}} inputValue={""} setInputValue={() => {}} />);

        const el = container.querySelector('input');

        expect(el).exist;
        expect(el?.classList.contains("is-invalid")).true;

        const form = container.querySelector('form');

        expect(form).exist;
        expect(form?.classList.contains("large")).true;

        const span = container.querySelector('.input-group-text');
        expect(span).exist;
        expect(span?.classList.contains("is-invalid")).true;
    });

    it('2', () => {
        const { container } = render(<SearchInput large={false} invalid={true} onSearch={() => {}} inputValue={""} setInputValue={() => {}} />);

        const el = container.querySelector('input');

        expect(el).exist;
        expect(el?.classList.contains("is-invalid")).true;

        const form = container.querySelector('form');

        expect(form).exist;
        expect(form?.classList.contains("large")).false;

        const span = container.querySelector('.input-group-text');
        expect(span).exist;
        expect(span?.classList.contains("is-invalid")).true;
    });

    it('3', () => {
        const { container } = render(<SearchInput large={false} invalid={false} onSearch={() => {}} inputValue={""} setInputValue={() => {}} />);

        const el = container.querySelector('input');

        expect(el).exist;
        expect(el?.classList.contains("is-invalid")).false;

        const form = container.querySelector('form');

        expect(form).exist;
        expect(form?.classList.contains("large")).false;

        const span = container.querySelector('.input-group-text');
        expect(span).exist;
        expect(span?.classList.contains("is-invalid")).false;
    });
});
