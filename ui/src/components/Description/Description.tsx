import { memo } from "react";
import "./description.scss";
import { useUrlParams } from "../../common/utils";

export const Description = memo(() => {
    const [urlParams] = useUrlParams();

    return (
        <div className={urlParams.searchQuery === null ? "description" : "description hidden"}>
            {/* <h3>How does it work?</h3> */}
            <p style={{textAlign: "justify"}}>
                <strong>Alpha<span className="title-color">Find</span></strong> is a web-based search engine that allows for structure-based search of the entire AlphaFold Protein Structure Database.
                Uniprot ID, PDB ID, or Gene Symbol is accepted as input – the engine will return the most similar proteins found within AlphaFold DB, with an option for additional search to extend and refine the results.
                The search results are grouped by their source organism and displayed along with several similarity metrics.
                3D visualizations of the structural superposition of the proteins are provided, and text filters can be used to find specific organisms or Uniprot IDs.
                For details about the methodology and usage, please see the <a href="https://github.com/Coda-Research-Group/AlphaFind/wiki/Manual" target="_blank" rel="noreferrer">manual</a>.
                This website is free and open to all users and there is no login requirement.
            </p>
        </div>
    );
});
