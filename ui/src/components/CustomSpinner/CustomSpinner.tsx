import { Spinner } from "react-bootstrap";
import { makePositionString } from "../../common/utils";
import "./custom-spinner.scss";

type Props = {
    queue?: {
        position: number;
        readyUrl: string | null;
        estimatedTime: number;
    };
};

function makeMeta(position: number, readyUrl: string | null, estimatedTime: number) {
    return (
        <div className="meta">
            <div>Waiting in Queue</div>
            <div>Position: <b>{makePositionString(position)}</b></div>
            <div>Estimated Time: <b>{estimatedTime}</b> seconds</div>
            <div>
                {
                    readyUrl !== null && (
                        <>
                            <a href={readyUrl} target="_blank">
                                Link to the results ({new URL(readyUrl).searchParams.get('q')})
                            </a>
                        </>
                    )
                }
            </div>
        </div>
    );
}

export function CustomSpinner({ queue }: Props) {
    return (
        <div className="custom-spinner d-flex justify-content-center">
            <Spinner style={{
                    width: 100 + 'px',
                    height: 100 + 'px',
                    fontSize: 2.5 + 'rem'
                }}
                animation="border"
                variant="secondary"
                role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
            
            {queue !== undefined ? makeMeta(queue.position, queue.readyUrl, queue.estimatedTime) : undefined}
        </div>
    );
}
