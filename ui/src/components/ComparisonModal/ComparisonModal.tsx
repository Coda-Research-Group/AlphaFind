import { Button, Image, Modal, OverlayTrigger, Popover, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputerMouse, faGamepad, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import { QueryObjectContext } from "../../pages/ProteinSearch/ProteinSearch";
import "./comparison-modal.scss";
import ProteinVisualizer from "../ProteinVisualizer";


const controlHintPopover = (
    <Popover id="popover-basic" style={{
        width: 'auto',
        maxWidth: 450 + 'px',
    }}>
        <Popover.Body>
            <Table borderless striped>
                <tbody>
                    <tr>
                        <td><FontAwesomeIcon icon={faComputerMouse} /> Left Click Hold + Move</td>
                        <td>Rotate Y/Z</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faComputerMouse} /> Right Click Hold + Move</td>
                        <td>Up/Down/Left/Right</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> Shift + <FontAwesomeIcon icon={faComputerMouse} /> Left Click + Move</td>
                        <td>Front/Rear</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> Shift + <FontAwesomeIcon icon={faComputerMouse} /> Wheel</td>
                        <td>Hide distant parts</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> R</td>
                        <td>Reset position in 3D space</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> ESC</td>
                        <td>Exit fullscreen mode</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faComputerMouse} /> Hover on Protein</td>
                        <td>Atom details</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faComputerMouse} /> Left Click</td>
                        <td>Atom as center of rotation</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> Ctrl + <FontAwesomeIcon icon={faComputerMouse} /> Right Click Hold + Move</td>
                        <td>Rotate X</td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon={faKeyboard} /> Ctrl + Shift + <FontAwesomeIcon icon={faComputerMouse} /> Right Click Hold + Move</td>
                        <td>Move object</td>
                    </tr>
                </tbody>
            </Table>
        </Popover.Body>
    </Popover>
);

type Props = {
    show: boolean;
    onHide: () => void;
    comparingUniProtId: string | null;
};

export function ComparisonModal({ show, onHide, comparingUniProtId }: Props) {
    const queryObject = useContext(QueryObjectContext);

    const uniProtIds: string[] = [queryObject.uniProtId];
    const comparingNotNull = comparingUniProtId !== null;
    if (comparingNotNull)
        uniProtIds.push(comparingUniProtId);

    return (
        <Modal
            show={show && comparingNotNull}
            onHide={onHide}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen="xl-down"
            className="custom-modal"
        >
            <Modal.Header closeButton className="p-1 pe-3">
                <Modal.Title id="contained-modal-title-vcenter" className="w-100">
                    {/* <span style={{color: '#EE0000'}}>{referenceUniProtId} (query)</span> <span className="disabled small">/</span> <span style={{color: '#0000ff'}}>{comparingUniProtId}</span> */}
                    <OverlayTrigger trigger="hover" placement="bottom" overlay={controlHintPopover}>
                        <Button variant="link" className="controls-info-btn"><FontAwesomeIcon icon={faGamepad} className="control-hint-btn"/>How to move in 3D space?</Button>
                    </OverlayTrigger>
                    <a href={`https://molstar.org/viewer/?afdb=${comparingUniProtId}`} target="_blank" rel="noreferrer">
                        View {comparingUniProtId} in <Image src="https://molstar.org/img/molstar-logo.png" />
                    </a>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0 pb-2">
                <div className="comparison-3d">
                    <ProteinVisualizer uniProtIds={uniProtIds} stageElementId='protein-overlapping' allowControlPanel={true} />
                    {/* <MolStarWrapper uniProtIds={uniProtIds} /> */}
                </div>
            </Modal.Body>
        </Modal>
    );
}
