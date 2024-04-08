import { Button, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import "./search-meta-box.scss";
import { QueryObjectContext } from "../../pages/ProteinSearch/ProteinSearch";
import { ExperimentalStructuresModalAttributes } from "../ProteinTable/ProteinTable";
import { getPdbIds } from "../../data/uniProtApiWrapper";

type Props = {
    loading: boolean;
    originalInput: string;
    searchTime: number;
    setExperimentalStructuresModalValue: React.Dispatch<React.SetStateAction<ExperimentalStructuresModalAttributes>>;
};

export function SearchMetaBox({ loading, originalInput, searchTime, setExperimentalStructuresModalValue }: Props) {
    const [experimentalStructures, setExperimentalStructures] = useState<string[] | null>(null);
    const queryObject = useContext(QueryObjectContext);

    useEffect(() => {
        // Reset on new UniProt ID
        setExperimentalStructures(null);

        // Do not perform on an empty query
        if (queryObject.uniProtId === "")
            return;

        async function fetch() {
            const promisedStructures = await getPdbIds(queryObject.uniProtId);
            const structures = promisedStructures.results.map(structure => structure.to);

            setExperimentalStructures(structures);
        }

        fetch();
    }, [queryObject.uniProtId]);

    let queryString = originalInput;
    if (originalInput !== queryObject.uniProtId && queryObject.uniProtId !== "")
        queryString = originalInput + " → " + queryObject.uniProtId;

    function openExperimentalStructuresModal(event: React.MouseEvent) {
        event.preventDefault();
        setExperimentalStructuresModalValue({
            entryUniProtId: queryObject.uniProtId,
            experimentalStructures: experimentalStructures as string[],
        });
    }

    return (
        <ul className="load-info">
            <li>
                Query:<b className="ms-2">{queryString}</b>
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
                    {queryObject.uniProtId} in <a href={`https://www.uniprot.org/uniprotkb/${queryObject.uniProtId}/entry`} target="_blank" rel="noreferrer" className="text-decoration-none">UniProt</a>

                    {
                        experimentalStructures === null ? (
                            <OverlayTrigger overlay={
                                <Tooltip>
                                    Looking for experimental structures...
                                </Tooltip>
                            }>
                                <Spinner animation="border" variant="secondary" size="sm" className="ms-2" />
                            </OverlayTrigger>
                        ) : (experimentalStructures.length > 0 &&
                            <OverlayTrigger overlay={
                                    <Tooltip>
                                        Experimental structures (PDBe) are present
                                    </Tooltip>
                                }>
                                <Button className="show-3d p-0 ms-1 text-decoration-none" onClick={openExperimentalStructuresModal} variant="link" rel="noreferrer" style={{
                                    transform: 'translateY(-6px)',
                                    display: "inline-block",
                                    height: 21 + 'px',
                                }}>
                                    <FontAwesomeIcon icon={faFlask} /> ({experimentalStructures.length})
                                </Button>
                            </OverlayTrigger>
                        )
                    }
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
