import { FormEvent, createContext, useCallback, useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import 'react-autocomplete-input/dist/bundle.css';
import { useQuery } from "@tanstack/react-query";
import ExampleVisualizations from "../../components/ExampleVisualizations";
import "./protein-search.scss";
import { calcEstimatedSearchTime, calcOffsetLimit, useUrlParams } from "../../common/utils";
import SearchInput from "../../components/SearchInput";
import ProteinVisualizer from "../../components/ProteinVisualizer";
import LoadInfoBox from "../../components/LoadInfoBox";
import CustomSpinner from "../../components/CustomSpinner";
import ProteinTable from "../../components/ProteinTable";
import LoadMoreButton from "../../components/LoadMoreButton";
import { LoadingState, Representation } from "../../common/enums";
import { fetchData, fetchQueryObjectMetadata } from "./data-loading";
import { Record } from "../../components/ProteinTable/ProteinTable";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 1_000;

type SearchResult = {
    data: Record[];
    meta: {
        searchTime: number;
    }
};

export type QueryObject = {
    uniProtId: string;
    name: string;
    organism: string;
};

export type onSearchHeader = (event: FormEvent, value: string | undefined) => void;
export type onLoadMoreHeader = (count: number) => void;

export const QueryObjectContext = createContext<QueryObject>({
    name: "",
    uniProtId: "",
    organism: "",
});

function renderNoResults(isQueryValidUniProtID: boolean, isInAlphaFoldDB: boolean) {
    return (
        <div className="text-center disabled">
            <i style={{ fontSize: 1.35 + 'rem' }}>
                {isQueryValidUniProtID ? (
                    isInAlphaFoldDB ?
                    "This protein is not yet included in the AlphaFind database." :
                    "This protein is not yet included in the AlphaFold database."
                ) :
                "This protein is unknown to AlphaFind or it does not exist."}
            </i>
        </div>
    );
}

export function ProteinSearch() {
    const [inputValue, setInputValue] = useState("");
    const searchParams = useRef<[string, number]>(["", DEFAULT_LIMIT]);

    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.Overview);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const timerStart = useRef(0);

    const [searchResult, setSearchResult] = useState<SearchResult>({
        data: [],
        meta: {
            searchTime: 0,
        }
    });

    const [urlParams, setUrlParams] = useUrlParams();

    const dataQ = useQuery({
        queryKey: ["data", searchParams.current[0], searchParams.current[1]],
        queryFn: () => fetchData(searchParams.current[0], searchResult.data, searchParams.current[1]),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        enabled: searchParams.current[0].length > 0,
        retry: false,
        staleTime: 1e15,
    });

    const originalSearchValue = dataQ.data?.originalSearchValue ?? searchParams.current[0];

    const queryMetadataQ = useQuery({
        queryKey: ["queryObjectMetadata", originalSearchValue],
        queryFn: () => fetchQueryObjectMetadata(originalSearchValue),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: dataQ.data !== undefined && dataQ.data.data.length > 0,
        retry: false,
    });


    /**
     * Responsible for handling the data from the main query.
     */
    useEffect(() => {
        // Make sure the query fn is done and results are ready
        if (dataQ.fetchStatus !== "idle")
            return;

        if (dataQ.status !== "success") {
            setSearchResult(prev => ({
                ...prev,
                rows: [],
            }));

            return;
        }

        // QUEUE
        if (dataQ.data?.queuePosition !== undefined) {
            let refetchTimer: NodeJS.Timeout;

            if (!isLoadingMore)
                setLoadingState(LoadingState.WaitingInQueue);

            if (searchParams.current[0] !== dataQ.data?.originalSearchValue)
                searchParams.current[0] = dataQ.data?.originalSearchValue;
            

            const queuePosition = dataQ.data.queuePosition;
            if (queuePosition <= 5)
                refetchTimer = setTimeout(() => dataQ.refetch(), 3000);
            else
                refetchTimer = setTimeout(() => dataQ.refetch(), 6000);

            return () => clearTimeout(refetchTimer);
        } else if (dataQ.data.data.length === 0) {
            // NO RESULTS - wrong input
            setLoadingState(LoadingState.ShowingResults);
            setSearchResult({
                data: [],
                meta: {
                    searchTime: (performance.now() - timerStart.current) / 1000,
                }
            });

            return;
        }

        // RESULTS
        setSearchResult({
            data: dataQ.data.data,
            meta: {
                searchTime: (performance.now() - timerStart.current) / 1000,
            }
        });

        if (isLoadingMore) {
            setIsLoadingMore(false);
            return;
        }

        setLoadingState(LoadingState.ShowingResults);

        return () => {};
    }, [JSON.stringify(dataQ.data), dataQ.status, dataQ.fetchStatus]);

    const queryObject: QueryObject = {
        uniProtId: originalSearchValue,
        name: queryMetadataQ.data?.name ?? "-",
        organism: queryMetadataQ.data?.organism ?? "-",
    };
    // Reset query object if the search value is not valid
    if (searchResult.data.length === 0) {
        queryObject.name = "";
        queryObject.uniProtId = "";
        queryObject.organism = "";
    }

    /** 
     * This is a fix for a bug where the window is unfocused and the user is in the queue.
     * Also, after coming back to the page after time, browser might have unloaded the page and so
     * the results are "empty" even though the state in showing results.
     */
    useEffect(() => {
        function windowFocusFixQueue() {
            if (loadingState === LoadingState.WaitingInQueue || loadingState === LoadingState.Fetching || isLoadingMore)
                dataQ.refetch();
        }

        window.addEventListener("focus", windowFocusFixQueue);

        return () => window.removeEventListener("focus", windowFocusFixQueue);
    }, [loadingState, isLoadingMore]);


    /** 
     * Responsible handling of URL parameters.
     * 
     * First use case is when the user uses URl with defined params -> automatic search
     * is performed.
     * 
     * Second use case is when the URL params change (e.g. user changes the URL manually).
     */
    useEffect(() => {
        if (loadingState !== LoadingState.Overview)
            return;

        if (urlParams.searchQuery === null)
            return;

        // Match typeable input with URL
        if (urlParams.searchQuery !== inputValue)
            setInputValue(urlParams.searchQuery);

        const searchQuery = urlParams.searchQuery;
        const timeoutPointer = setTimeout(() => {
            timerStart.current = performance.now();
            setLoadingState(LoadingState.Fetching);

            searchParams.current = [searchQuery, urlParams.limit !== null ? urlParams.limit : DEFAULT_LIMIT];
        }, 800);

        return () => clearTimeout(timeoutPointer);
    }, [urlParams.searchQuery, urlParams.limit]);

    /**
     * Main entrypoint for the search.
     */
    const onSearch = useCallback((event: FormEvent): void => {
        event.preventDefault();

        const parsedInputValue = inputValue.toUpperCase().replace(/\s/g, "");

        // Prevent search of the same value
        if (searchParams.current[0] === parsedInputValue)
            return;

        // Reset everything
        setLoadingState(LoadingState.Fetching);
        setSearchResult({
            data: [],
            meta: {
                searchTime: 0,
            }
        });
        setUrlParams(parsedInputValue, null);

        // Start timer
        timerStart.current = performance.now();
        // Trigger search
        searchParams.current = [parsedInputValue, DEFAULT_LIMIT];
    }, [inputValue, searchParams.current[0]]);

    /**
     * Entrypoint for loading more results (pressing the button)
     */
    const loadMore = useCallback((count: number): void => {
        setIsLoadingMore(true);

        const newLimit = searchParams.current[1] + count;

        setUrlParams(queryObject.uniProtId, newLimit);

        timerStart.current = performance.now();
        searchParams.current[1] = newLimit;
    }, [queryObject.uniProtId, searchParams.current[1]]);

    // SHORTCUTS for RENDERING
    const isQueryValidUniProtID = dataQ.data?.isValueValidUniProtID ?? true;
    const isInAlphaFoldDB = dataQ.data?.isInAlphaFoldDB ?? false;
    const showVisualizations = urlParams.searchQuery === null && dataQ.data === undefined;
    const isLoadingMoreFeedback = dataQ.isFetching || isLoadingMore;
    
    const fetchingLimit = calcOffsetLimit(searchResult.data.length, searchParams.current[1])[1];
    let queueInfo = undefined;
    if (dataQ.data?.queuePosition !== undefined && (
            (fetchingLimit <= 50 && dataQ.data?.queuePosition >= 2) ||
            (fetchingLimit > 50 && dataQ.data?.queuePosition >= 1)
    ))
        queueInfo = {
            position: dataQ.data.queuePosition,
            readyUrl: window.location.href,
            estimatedTime: calcEstimatedSearchTime(fetchingLimit) * dataQ.data?.queuePosition,
        };
    
    const isOverviewState = loadingState === LoadingState.Overview;
    const isShowingResultsState = loadingState === LoadingState.ShowingResults;
    const isFetchingState = loadingState === LoadingState.Fetching;
    const isWaitingInQueueState = loadingState === LoadingState.WaitingInQueue;

    const emptyResults = searchResult.data.length === 0;
    const isLoading = dataQ.isFetching || isLoadingMore || isFetchingState || isWaitingInQueueState;

    return (
        <QueryObjectContext.Provider value={queryObject}>
            <article>
                <section>
                    <Container>
                        <Row className="search-info">
                            <Col xs="12" xl="4" className="mb-4 d-flex align-items-center">
                                <SearchInput
                                    large={isOverviewState}
                                    invalid={isShowingResultsState && emptyResults}
                                    onSearch={onSearch}
                                    inputValue={inputValue}
                                    setInputValue={setInputValue}
                                />
                            </Col>
                            <Col xs="12" md="6" xl="4" className="mb-4 mb-sm-0">
                                {(isShowingResultsState && !emptyResults) && <ProteinVisualizer
                                    uniProtIds={isShowingResultsState && !emptyResults ? [queryObject.uniProtId] : []}
                                    stageElementId="reference-3d"
                                    height={210}
                                    defaultRepresentation={Representation.Cartoon}
                                    spin={true}
                                />}
                            </Col>
                            <Col xs="12" md="6" xl="4" className="query-info-container">
                                {!isOverviewState && <LoadInfoBox
                                    loading={isLoading}
                                    originalInput={searchParams.current[0]}
                                    searchTime={searchResult.meta.searchTime}
                                />}
                            </Col>
                        </Row>

                        {(isFetchingState || isWaitingInQueueState) && <CustomSpinner queue={queueInfo} />}

                        {isShowingResultsState && (
                            !emptyResults ? (<>
                                <ProteinTable data={searchResult.data} />
                                <LoadMoreButton loadMoreFn={loadMore} isLoading={isLoadingMoreFeedback} queue={queueInfo} currentDataLength={searchResult.data.length} />
                            </>) : renderNoResults(isQueryValidUniProtID, isInAlphaFoldDB)
                        )}

                        {showVisualizations && <ExampleVisualizations />}
                    </Container>
                </section>
                {/* <footer></footer> */}
            </article>
        </QueryObjectContext.Provider>
    );
}
