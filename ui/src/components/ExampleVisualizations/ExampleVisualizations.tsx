import { Col, Row } from "react-bootstrap";
import { ExampleVisualization } from "./ExampleVisualization";
import "./examples-visualizations.scss";

const examples = [
    ["I1VZV6","A0A3G2VQ77","C7S3C6", "A0A2K6R518","A0A0D9RKY6","H9EWV6","A0A3G2VT59",],
    ["A0A1D6JW22","A0A3L6TI92","A0A317Y945","A0A835EH74",],
    ["Q9FFD0","A0A7J7D5F1","A0A067JHG6","B9IQ11",],
];

const names = [
    "Hemoglobin Alpha 1",
    "Cytochrome P450",
    "PIN5 protein",
];

const texts = [
    "Hemoglobin is a protein that facilitates the transport of oxygen and other gases in red blood cells. Almost all vertebrates contain hemoglobin. It consists of four protein subunits (globins), and is one of the first proteins whose 3D structure has been experimentally determined. There are many types of hemoglobin, with hemoglobin Alpha 1 (encoded by the HBA1 gene) occurring in humans and being the main form of hemoglobin in adults. In this use case, AlphaFind shows us that highly similar hemoglobin structures can also be found in other species.",
    "Cytochrome P450 are enzymes which are important for the metabolism of many endogenous compounds and xenobiotics. P450 enzymes have been identified across all biological kingdoms: animals, plants, fungi, bacteria and archaea, as well as in viruses. Cytochrome P450 proteins contain one chain which is composed of more than 20 sheets and helices. Their sequence similarity is very low. In this use case, we can see similarities among cytochrome P450 structures from various species. The search starts with a cytochrome from corn (Zea Mays), and within the first 50 hits, we find similar structures originating from various animals (mouse, cat, horse, etc.).",
    "The PIN proteins are transmembrane proteins which regulate plant growth by influencing auxin transport from the cytosol to the extracellular space. They only occur in plants and feature a configuration of 10 main helices that collectively form a pore. Eight types of PIN proteins are known (PIN1-PIN8), and recently, the structures of three PIN proteins were uncovered and published in Nature. The structure of the PIN5 protein differs from other PINs (<a href='https://www.nature.com/articles/s41586-022-04883-y' target='_blank' rel='noreferrer'>Ung 2022</a>) and has not yet been experimentally determined. This use case shows that the PIN5 protein structure is strongly conserved among many different plant species.",
];

export function ExampleVisualizations() {
    return (
        <Row className="examples">
            <Col xl="4" md="12">
                <ExampleVisualization i={0} exampleUniProtIds={examples[0]} name={names[0]} text={texts[0]} />
            </Col>
            <Col xl="4" md="12">
                <ExampleVisualization i={1} exampleUniProtIds={examples[1]} name={names[1]} text={texts[1]} />
            </Col>
            <Col xl="4" md="12">
                <ExampleVisualization i={2} exampleUniProtIds={examples[2]} name={names[2]} text={texts[2]} />
            </Col>
        </Row>
    );
}
