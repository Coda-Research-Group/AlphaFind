import { useSearchParams } from "react-router-dom";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../pages/ProteinSearch/ProteinSearch";
import { useCallback } from "react";

export type ColorHEX = `#${string}`;

/**
 * Calculates the offset and limit for pagination.
 * @param currentCount The current count of items.
 * @param totalLimit The total limit of items.
 * @returns A tuple containing the offset and limit.
 */
export function calcOffsetLimit(currentCount: number, totalLimit: number): [number, number] {
    if (currentCount === 0)
        return [0, totalLimit];

    return [currentCount, totalLimit - currentCount];
}

export function makePositionString(position: number) {
    switch (position) {
        case 1:
            return "1st";
        case 2:
            return "2nd";
        case 3:
            return "3rd";
        default:
            return `${position}th`;
    }
}

/**
 * Calculates the estimated search time based on the given limit.
 * @param limit - The limit value for the search.
 * @returns The estimated search time in seconds.
 */
export function calcEstimatedSearchTime(limit: number) {
    if (limit <= 50)
        return 6;

    if (limit <= 100)
        return 8;

    if (limit <= 200)
        return 10;

    if (limit <= 300)
        return 14;

    return 40;
}

/**
 * Converts HSL (Hue, Saturation, Lightness) color values to RGB (Red, Green, Blue) color values.
 * @param h - The hue value (0-360).
 * @param s - The saturation value (0-100).
 * @param l - The lightness value (0-100).
 * @returns An array containing the RGB color values [r, g, b].
 */
export function hsl2rgb(h: number, s: number, l: number) {
    h = (h % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, Math.round(s)));
    l = Math.max(0, Math.min(100, Math.round(l)));

    s = Math.round((s + Number.EPSILON) * 100) / 10000;
    l = Math.round((l + Number.EPSILON) * 100) / 10000;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), - 1);

    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);

    return [r, g, b];
}

/**
 * Generates an array of colors based on the specified length and default color.
 * @param length The number of colors to generate.
 * @param defaultColor The default color to start with.
 * @returns An array of colors.
 */
export function makeColors(length: number, defaultColor: ColorHEX) {
    const colors: ColorHEX[] = [defaultColor];

    const hue = 216;
    const saturatinStep = Math.floor(80 / length);
    const lightStep = Math.floor(40 / length);

    for (let i = 1; i < length; i++) {
        const saturation = 20 + saturatinStep * i;
        const light = 90 - lightStep * i;

        const rgb = hsl2rgb(hue, saturation, light);
        const rgbHexStr = ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);

        colors.push(`#${rgbHexStr}`);
    }

    return colors;
}

/**
 * Scales a value from one range to another.
 * 
 * @param value - The value to be scaled.
 * @param inputRangeMin - The minimum value of the input range.
 * @param inputRangeMax - The maximum value of the input range.
 * @param outputRangeMin - The minimum value of the output range.
 * @param outputRangeMax - The maximum value of the output range.
 * @returns The scaled value.
 */
function scale(value: number, inputRangeMin: number, inputRangeMax: number, outputRangeMin: number, outputRangeMax: number) {
    return (value - inputRangeMin) * (outputRangeMax - outputRangeMin) / (inputRangeMax - inputRangeMin) + outputRangeMin;
}

/**
 * Maps a count to a range based on the given index.
 * @param count The total count.
 * @param i The index; must be between 0 and count.
 * @returns The mapped value within the range.
 */
function mapCountToRange(count: number, i: number) {
    if (!Number.isInteger(count) || count < 0)
        throw new Error("Count must be a positive integer");

    const minRange = 100;
    const maxRange = 255;

    const mappedValue = minRange + ((i / count) * (maxRange - minRange));

    return mappedValue;
}

/**
 * Generates an array of color transitions based on the given count.
 * @param count The number of color transitions to generate.
 * @returns An array of color codes representing the transitions.
 */
export function makeColorTransitions(count: number): ColorHEX[] {
    if (!Number.isInteger(count) || count < 0)
        throw new Error("Count must be a positive integer");

    const colorArray: ColorHEX[] = [];

    for (let i = 0; i < count; i++) {
        const grayscale = Math.round(mapCountToRange(count, i));
        const hexValue = grayscale.toString(16).padStart(2, '0');
        const colorCode: ColorHEX = `#${hexValue}${hexValue}${hexValue}`;

        colorArray.push(colorCode);
    }

    return colorArray;
}

/**
 * Generates an array of transparency values for creating transitions.
 * @param count - The number of transparency values to generate.
 * @returns An array of transparency values.
 */
export function makeTransparencyTransitions(count: number): number[] {
    if (!Number.isInteger(count) || count < 0)
        throw new Error("Count must be a positive integer");

    const min = 0.2;
    const max = 0.8;

    const stepSize = (max - min) / count;
    const steps: number[] = [];

    for (let i = count - 1; i >= 0; i--) {
        const stepValue = min + i * stepSize;
        steps.push(stepValue);
    }

    return steps;
}

/** 
 * Helper function for creating URL update objects.
 */
export function makeUrlUpdateObject(searchQuery: null | string, limit: null | number) {
    const params: {
        q?: string;
        limit?: string;
    } = {};

    if (searchQuery !== null)
        params.q = searchQuery;

    if (limit !== null)
        params.limit = limit.toString();

    return params;
}

/**
 * Custom hook that retrieves and manages URL parameters related to search query and limit.
 * @returns An array containing the URL parameters and a function to update them.
 */
export function useUrlParams() {
    const [searchParams, setSearchParams] = useSearchParams();

    let searchQuery = searchParams.get("q");
    const limit_string = searchParams.get("limit");
    let limit = DEFAULT_LIMIT;

    if (searchQuery !== null)
        searchQuery = searchQuery.toUpperCase().replace(/\s/g, "");

    if (limit_string !== null) {
        const parsedLimit = parseInt(limit_string);

        // Fix invalid URL params
        if (Number.isNaN(parsedLimit) || parsedLimit > MAX_LIMIT || parsedLimit < 10)
            setSearchParams(makeUrlUpdateObject(searchQuery, null));
        else
            limit = parsedLimit;
    }

    const setParams = useCallback((searchQuery: string | null, limit: number | null) => {
        setSearchParams(makeUrlUpdateObject(searchQuery, limit));
    }, []);

    const urlParams = {
        searchQuery,
        limit,
    };

    return [urlParams, setParams] as const;
}

/**
 * Converts a decimal value to a percentage string representation.
 * @param value - The decimal value to convert.
 * @returns The percentage string representation of the value.
 */
export function displayPercentage(value: string) {
    const percentage = (100 * parseFloat(value)).toFixed(1) + '%';

    if (percentage === '100.0%')
        return '100%';

    return percentage;
}
