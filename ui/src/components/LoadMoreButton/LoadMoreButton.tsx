import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonGroup, Dropdown, Spinner } from "react-bootstrap";
import { FormEvent } from "react";
import { makePositionString } from "../../common/utils";
import "./load-more-button.scss";
import { MAX_LIMIT, onLoadMoreHeader } from "../../pages/ProteinSearch/ProteinSearch";

const counts = [100, 200, 300];

type Props = {
    isLoading: boolean;
    loadMoreFn: onLoadMoreHeader;
    queue?: {
        position: number;
        readyUrl: string | null;
        estimatedTime: number;
    };
    currentDataLength: number;
};

function makeQueueMeta(position: number, estimatedTime: number) {
    return (
        <div className="queue-meta">
            <div>Waiting in Queue</div>
            <div>Position: <b>{makePositionString(position)}</b></div>
            <div>Estimated Time: <b>{estimatedTime}</b> seconds</div>
        </div>
    );
}

function makeAdditionalButtons(availableCount: number, onLoadMore: (event: FormEvent, count: number) => void, isLoading: boolean) {
    return (
        <>
            <Dropdown.Toggle split id="dropdown-split-basic" disabled={isLoading} />

            <Dropdown.Menu>
                {
                    counts.map((count, i) => {
                        if (availableCount >= count)
                            return (<Dropdown.Item onClick={(e) => onLoadMore(e, count)} key={i}>{count}</Dropdown.Item>);
                        return undefined;
                    })
                }
            </Dropdown.Menu>
        </>
    );
}

export function LoadMoreButton({ isLoading, loadMoreFn, queue, currentDataLength }: Props) {
    function onLoadMore(event: FormEvent, count: number) {
        event.preventDefault();

        if (isLoading)
            return;
        
            loadMoreFn(count);
    }

    const availableCount = MAX_LIMIT - currentDataLength;

    // Do not show button if the user reached upper limit
    if (availableCount <= 0)
        return (<></>);

    const mainLoadMoreCount = Math.min(50, availableCount);

    return (
        <div className="load-more_container">
            <Dropdown as={ButtonGroup}>
                <Button className="load-more" onClick={(e) => onLoadMore(e, mainLoadMoreCount)} disabled={isLoading}>
                    {isLoading
                        ? (<Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>)
                        : (<>Load {mainLoadMoreCount} More Structures <FontAwesomeIcon icon={faRotateRight} /></>)
                    }
                </Button>

                {availableCount >= Math.min.apply(Math, counts) ? makeAdditionalButtons(availableCount, onLoadMore, isLoading) : undefined}
            </Dropdown>

            {queue !== undefined ? makeQueueMeta(queue.position, queue.estimatedTime) : undefined}
        </div>
    );
}
