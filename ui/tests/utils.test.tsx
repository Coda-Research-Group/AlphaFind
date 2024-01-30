import { expect, describe, it, vi } from 'vitest';
import { calcOffsetLimit, makeUrlUpdateObject, useUrlParams } from '../src/common/utils.ts';
import { renderHook } from '@testing-library/react';
import { DEFAULT_LIMIT } from '../src/pages/ProteinSearch/ProteinSearch.tsx';
import { MemoryRouter, useSearchParams } from 'react-router-dom';


describe('calcOffsetLimit', () => {
    it('0', () => {
        const currentCount = 0;
        const totalLimit = 10;
        const expected = [0, totalLimit];

        const result = calcOffsetLimit(currentCount, totalLimit);

        expect(result).toEqual(expected);
    });

    it('1', () => {
        const currentCount = 5;
        const totalLimit = 10;
        const expected = [currentCount, totalLimit - currentCount];

        const result = calcOffsetLimit(currentCount, totalLimit);

        expect(result).toEqual(expected);
    });
});

describe("useUrlParams", () => {
    it("0", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });

        expect(result.current[0]).toEqual({
            searchQuery: null,
            limit: DEFAULT_LIMIT,
        });
    });

    it("1", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search?q=test"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });

        expect(result.current[0]).toEqual({
            searchQuery: "TEST",
            limit: DEFAULT_LIMIT,
        });
    });

    it("2", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search?q=test&limit=100"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });

        expect(result.current[0]).toEqual({
            searchQuery: "TEST",
            limit: 100,
        });
    });

    it("3", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search?q=test&limit=1001"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });

        expect(result.current[0]).toEqual({
            searchQuery: "TEST",
            limit: DEFAULT_LIMIT,
        });
    });

    it("4", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search?limit=1001"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });

        expect(result.current[0]).toEqual({
            searchQuery: null,
            limit: DEFAULT_LIMIT,
        });
    });

    it("5", () => {
        const wrapper = ({ children }: {children: JSX.Element}) => <MemoryRouter initialEntries={["/search?limit=100"]}>{children}</MemoryRouter>;
        const { result } = renderHook(useUrlParams, { wrapper });
        
        expect(result.current[0]).toEqual({
            searchQuery: null,
            limit: 100,
        });
    });

    // it("6", () => {
    //     let mockSearchParam = '';

    //     vi.mock('react-router-dom', async (importOriginal) => {
    //         const actual: object = await importOriginal();

    //         return {
    //             ...actual,
    //             useSearchParams: () => {
    //                 const [params, setParams] = useState<URLSearchParams>(new URLSearchParams(mockSearchParam));
    //                 return [params, (newParams: string) => {
    //                         mockSearchParam = newParams;

    //                         setParams(new URLSearchParams(newParams));
    //                     }
    //                 ];
    //             }
    //         };
    //     });

    //     // console.log(mockSearchParam);
    // });
});