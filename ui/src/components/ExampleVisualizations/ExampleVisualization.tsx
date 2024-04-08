import { Link } from "react-router-dom";
import { Representation } from "../../common/enums";
import ProteinVisualizer from "../ProteinVisualizer";
import "./example-visualization.scss";

type Props = {
    i: number,
    exampleUniProtIds: string[]
    name: string;
    text: string;
    limit?: number;
};

export function ExampleVisualization({i, exampleUniProtIds, name, text, limit=50}: Props) {
    return (
        <div className="example-card">
            <ProteinVisualizer
                uniProtIds={exampleUniProtIds}
                stageElementId={`example-${i}`}
                height={300}
                defaultRepresentation={Representation.Tube}
                spin={true}
            />
            <h3><Link to={`/search?q=${exampleUniProtIds[0]}&limit=${limit}`}>{name}</Link></h3>
            <p style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: text }} />
        </div>
    );
}
