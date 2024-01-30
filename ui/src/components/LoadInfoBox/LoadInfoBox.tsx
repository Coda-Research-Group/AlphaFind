import { Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import "./load-info-box.scss";
import { QueryObjectContext } from "../../pages/ProteinSearch/ProteinSearch";

type Props = {
    loading: boolean;
    originalInput: string;
    searchTime: number;
};

export function LoadInfoBox({ loading, originalInput, searchTime }: Props) {
    const queryObject = useContext(QueryObjectContext);

    let query = originalInput;
    if (originalInput !== queryObject.uniProtId && queryObject.uniProtId !== "")
        query = originalInput + " → " + queryObject.uniProtId;

    return (
        <ul className="load-info">
            <li>
                Query:<b className="ms-2">{query}</b>
            </li>

            {queryObject.name !== "" && (
                <li>
                    Name: <b>{queryObject.name}</b>
                </li>
            )}

            {queryObject.organism !== "" && (
                <li>
                    Organism: <b>{queryObject.organism}</b>
                </li>
            )}

            {queryObject.uniProtId !== "" && (
                <li>
                    {queryObject.uniProtId} in <a href={`https://alphafold.ebi.ac.uk/entry/${queryObject.uniProtId}`} target="_blank" rel="noreferrer" className="text-decoration-none">AlphaFold <FontAwesomeIcon icon={faLink} /></a>
                </li>
            )}

            <li>
                Search Time:
                {loading ? (
                    <Spinner animation="border" variant="secondary" role="status" size="sm" className="ms-2">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                ) : (
                    <b className="ms-2">{searchTime.toFixed(3)} s</b>
                )}
            </li>
        </ul>
    );
}
