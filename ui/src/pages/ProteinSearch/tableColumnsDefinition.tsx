import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Record } from "../../components/ProteinTable/ProteinTable";
import { createColumnHelper, Row as TableRow } from "@tanstack/react-table";
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
        cell: context => context.getValue(),
        aggregatedCell: context => context.getValue(),
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
    }),
];
