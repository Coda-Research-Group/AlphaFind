import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "react-bootstrap";
import "./experimental-structures-modal.scss";
import { ExperimentalStructuresModalAttributes } from "../ProteinTable/ProteinTable";

type Props = {
    attrs: ExperimentalStructuresModalAttributes;
    onHide: () => void;
};

export function ExperimentalStructuresModal({ attrs, onHide }: Props) {
    if (attrs === null)
        return (<></>);
    
    const { experimentalStructures } = attrs;

    return (
        <Modal
            show={experimentalStructures.length > 0}
            onHide={onHide}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            className="experimental-structures-modal"
        >
            <Modal.Header closeButton className="">
                <Modal.Title>
                    Experimental Structures
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    Experimental structures (PDBe) corresponding to <b>{attrs.entryUniProtId}</b>:
                </p>
                <ul>
                    {experimentalStructures.map((structure, index) => (
                        <li key={index}>
                            <a href={`https://www.ebi.ac.uk/pdbe-srv/view/entry/${structure}`} target="_blank" rel="noreferrer">
                                {structure}
                                <sup className="ms-1"><FontAwesomeIcon icon={faArrowUpRightFromSquare} /></sup>
                            </a>
                        </li>
                    ))}
                </ul>
            </Modal.Body>
        </Modal>
    );
}
