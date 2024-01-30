import { Representation } from "../../common/enums";
import ProteinVisualizer from "../ProteinVisualizer";
import "./example-visualization.scss";

const defaultStyle = {
    height: 300 + "px",
};

type Props = {
    i: number,
    exampleUniProtIds: string[]
    name: string;
    text: string;
};

export function ExampleVisualization({i, exampleUniProtIds, name, text }: Props) {
    return (
        <div className="example-card">
            <ProteinVisualizer
                uniProtIds={exampleUniProtIds}
                stageElementId={`example-${i}`}
                height={300}
                defaultRepresentation={Representation.Tube}
                spin={true}
            />
            <h3><a href={`search?q=${exampleUniProtIds[0]}`}>{name}</a></h3>
            <p style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: text }} />
        </div>
    );
}
