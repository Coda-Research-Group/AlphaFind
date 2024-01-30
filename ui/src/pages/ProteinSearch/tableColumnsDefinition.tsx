import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { CustomCellContext, Record } from "../../components/ProteinTable/ProteinTable";
import { createColumnHelper, Row as TableRow } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faObjectUngroup } from "@fortawesome/free-solid-svg-icons";
import { createSearchParams } from "react-router-dom";
import { displayPercentage } from "../../common/utils";

function getBestRow(rows: TableRow<Record>[]): TableRow<Record> {
    let minIndex = 0,
        minValue = Number.MAX_SAFE_INTEGER;
    
    for(let index = 0; index < rows.length; index++) {
        const rmsd: number = rows[index].getValue('rmsd');

        if (rmsd < minValue) {
            minValue = rmsd;
            minIndex = index;
        }
    }

    return rows[minIndex];
}

function makeSearchSimilarUrl(value: string) {
    return `search?${
        createSearchParams({
            q: value as string,
        })
    }`;
}

const columnHelper = createColumnHelper<Record>();

const organismCol = columnHelper.accessor('organism', {
    header: () => <>Organism</>,
    cell: context => (
        context.row.original.organism === null
        ? (<i>Unknown</i>)
        : (
            <OverlayTrigger overlay={
                <Tooltip>
                    {context.renderValue()}
                </Tooltip>
            }>
                <div className="text-truncate" style={{maxWidth: 230 + "px"}}>{context.getValue()}</div>
            </OverlayTrigger>
        )
    ),
    aggregatedCell: context => (
        context.row.original.name === null
        ? (<i>Unknown</i>)
        : (
            <OverlayTrigger overlay={
                <Tooltip>
                    {context.row.original.name}
                </Tooltip>
            }>
                <div className="text-truncate" style={{maxWidth: 230 + "px"}}>{context.row.original.name}</div>
            </OverlayTrigger>
        )
    ),
    enableColumnFilter: true,
});

export const columns = [
    organismCol,
    columnHelper.accessor('uniProtId', {
        header: () => <>UniProt ID</>,
        cell: context => (
            context.row.original.uniProtId === null
            ? (<i>Unknown</i>)
            : (<a href={ 'https://alphafold.ebi.ac.uk/entry/' + context.row.original.uniProtId} target="_blank" rel="noreferrer">{context.row.original.uniProtId}</a>)
        ),
        aggregatedCell: context => (
            context.row.original.uniProtId === null
            ? (<i>Unknown</i>)
            : (<a href={ 'https://alphafold.ebi.ac.uk/entry/' + context.getValue()} target="_blank" rel="noreferrer">{context.getValue()}</a>)
        ),
        enableColumnFilter: true,
        aggregationFn: (_, childRows) => getBestRow(childRows).getValue('uniProtId'),
        sortingFn: (rowA, rowB) => {
            if (rowA.original.uniProtId === null || rowB.original.uniProtId === null)
                return 0;

            if (rowA.original.uniProtId === rowB.original.uniProtId)
                return 0;

            if (rowA.original.uniProtId < rowB.original.uniProtId)
                return -1;

            return 1;
        },
    }),
    columnHelper.group({
        header: "Global Similarity",
        id: "global-similarity",
        columns: [
            columnHelper.accessor('tmScore', {
                header: () => (
                    <span>
                        <span>TM-Score</span>
                        <OverlayTrigger overlay={
                            <Tooltip>
                                Template modeling score
                            </Tooltip>
                        }>
                            <sup>(?)</sup>
                        </OverlayTrigger>
                    </span>
                ),
                cell: context => (<>{context.getValue().toFixed(4)}</>),
                aggregatedCell: context => (<>{context.getValue().toFixed(4)}</>),
                aggregationFn: 'max',
            }),
        ],
    }),
    columnHelper.group({
        header: "Local Similarity",
        id: "local-similarity",
        columns: [
            columnHelper.accessor('rmsd', {
                header: () => (
                    <span>
                        <span>RMSD <i>(Å)</i></span>
                        <OverlayTrigger overlay={
                            <Tooltip>
                                Root-mean-square deviation of the aligned alpha-carbon positions
                            </Tooltip>
                        }>
                            <sup>(?)</sup>
                        </OverlayTrigger>
                    </span>
                ),
                cell: context => (<>{context.getValue().toFixed(3)}</>),
                aggregatedCell: context => (<>{context.getValue().toFixed(3)}</>),
                aggregationFn: 'min',
            }),
            columnHelper.accessor('alignedLength', {
                header: () => <>Aligned residues</>,
                cell: context => (<>{displayPercentage(context.getValue())}</>),
                aggregatedCell: context => (<>{displayPercentage(context.getValue())}</>),
                aggregationFn: 'min',
            }),
        ],
    }),
    columnHelper.accessor('identicalAAs', {
        header: () => (
            <span>
                <span>Sequence Identity</span>
                <OverlayTrigger overlay={
                    <Tooltip>
                        Number of identical residues within the aligned sequences
                    </Tooltip>
                }>
                    <sup>(?)</sup>
                </OverlayTrigger>
            </span>
        ),
        cell: context => (
            <div className="progress" role="progressbar" aria-label="Sequential Identity" aria-valuenow={context.getValue() * 100} aria-valuemin={0} aria-valuemax={100} style={{
                minWidth: 200 + "px",
                backgroundColor: "lightgray",
            }}>
                <div className="progress-bar" style={{
                    width: context.getValue() * 100 + "%",
                }}></div>
            </div>
        ),
        aggregatedCell: context => (
            <div className="progress" role="progressbar" aria-label="Sequential Identity" aria-valuenow={context.getValue() * 100} aria-valuemin={0} aria-valuemax={100} style={{
                minWidth: 200 + "px",
                backgroundColor: "lightgray",
            }}>
                <div className="progress-bar" style={{
                    width: context.getValue() * 100 + "%",
                }}></div>
            </div>
        ),
        aggregationFn: (_, childRows) => getBestRow(childRows).getValue('identicalAAs'),
        sortingFn: (rowA, rowB) => {
            if (rowA.original.identicalAAs === rowB.original.identicalAAs)
                return 0;

            if (rowA.original.identicalAAs < rowB.original.identicalAAs)
                return -1;
            
            return 1;
        },
    }),

    columnHelper.display({
        header: () => <>Superposition</>,
        id: "actions",
        cell: context => {
            const contextCasted = context as CustomCellContext;

            return (
                <div style={{minWidth: 80 + "px"}}>
                    {contextCasted.row.original.uniProtId !== null ?
                    (<>
                        <Button className="show-3d p-0 mx-2" onClick={contextCasted.meta.onClickModal} variant="link" rel="noreferrer"><FontAwesomeIcon icon={faObjectUngroup} /></Button>
                        <Button className="p-0 mx-2" href={makeSearchSimilarUrl(contextCasted.row.original.uniProtId)} target="_blank" rel="noreferrer" variant="link"><FontAwesomeIcon icon={faMagnifyingGlass} /></Button>
                    </>): undefined}
                </div>
            );
        },
    }),
];
