import { createSearchParams } from "react-router-dom";
import { ModalContext, Record } from "./ProteinTable";
import { Cell, Row, flexRender } from "@tanstack/react-table";
import { Button, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleRight, faFlask, faMagnifyingGlass, faObjectUngroup } from "@fortawesome/free-solid-svg-icons";
import { FormEvent, ReactNode, useContext } from "react";

function getCellBackground(cell: Cell<Record, unknown>) {
    if (cell.getIsGrouped())
        return '#ededed';

    if (cell.getIsAggregated())
        return '#ededed';

    if (cell.getIsPlaceholder())
        return '#fff';

    return '#fff';
}

function makeSearchSimilarUrl(value: string) {
    return `search?${
        createSearchParams({
            q: value as string,
        })
    }`;
}

function getGroupedCellContent(cell: Cell<Record, unknown>) {
    function handleExpandRequest(event: FormEvent) {
        event.preventDefault();
        cell.row.toggleExpanded();
    }

    const row = cell.row;
    // Uncomment for grouping only rows with same organism if count > 1
    // if (row.subRows.length > 1)
    return (
        <div className="d-flex align-items-center">
            <Button className="p-0 me-3 d-block" onClick={handleExpandRequest} variant="link" style={{
                width: 15 + 'px',
                fontSize: 1.2 + 'rem',
            }}>
                {row.getIsExpanded() ? <FontAwesomeIcon icon={faAngleDown} /> : <FontAwesomeIcon icon={faAngleRight} />}
            </Button>
            
            <span className="me-2">({ row.subRows.length })</span>

            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
    );

    // Uncomment for grouping only rows with same organism if count > 1
    // return flexRender(cell.column.columnDef.cell, cell.getContext());
}

function renderActionsCell(row: Row<Record>, openComparison: (event: FormEvent) => void) {
    return (
        <div style={{minWidth: 80 + "px"}}>
            {
                row.original.uniProtId !== null && (
                    <>
                        <Button className="show-3d p-0 mx-2" onClick={openComparison} variant="link" rel="noreferrer"><FontAwesomeIcon icon={faObjectUngroup} /></Button>
                        <Button className="p-0 mx-2" href={makeSearchSimilarUrl(row.original.uniProtId)} target="_blank" rel="noreferrer" variant="link"><FontAwesomeIcon icon={faMagnifyingGlass} /></Button>
                    </>
                )
            }
        </div>
    );
}

function getGeneralCellContent(cell: Cell<Record, unknown>): JSX.Element | ReactNode {
    if (cell.getIsGrouped())
        return getGroupedCellContent(cell);

    if (cell.getIsAggregated() || cell.getIsPlaceholder())
        return flexRender(cell.column.columnDef.aggregatedCell, cell.getContext());

    return flexRender(cell.column.columnDef.cell, cell.getContext());
}

function renderUniProtIdCell(
    cell: Cell<Record, unknown>,
    isLoading: boolean,
    openExperimentalStructures: (event: FormEvent) => void
) {
    const link = `https://www.uniprot.org/uniprotkb/${cell.row.original.uniProtId}/entry`;

    const es = cell.row.original.experimentalStructures !== null && cell.row.original.experimentalStructures.length > 0;

    return (
        <>
            <a href={link} target="_blank" rel="noreferrer"> 
                {
                    es
                    ? <b>{flexRender(cell.column.columnDef.cell, cell.getContext())}</b>
                    : flexRender(cell.column.columnDef.cell, cell.getContext())
                }
            </a>
            {
                isLoading
                ? (
                    <OverlayTrigger overlay={
                        <Tooltip>
                            Looking for experimental structures...
                        </Tooltip>
                    }>
                        <Spinner animation="border" variant="secondary" size="sm" className="ms-2" />
                    </OverlayTrigger>
                )
                : (
                    es &&
                    <OverlayTrigger overlay={
                            <Tooltip>
                                Experimental structures (PDBe) are present
                            </Tooltip>
                        }>
                        <Button className="show-3d p-0 ms-1 text-decoration-none" onClick={openExperimentalStructures} variant="link" rel="noreferrer" style={{
                            transform: 'translateY(-4px)',
                        }}>
                            <FontAwesomeIcon icon={faFlask} /> ({cell.row.original.experimentalStructures!.length})
                        </Button>
                    </OverlayTrigger>
                )
            }
        </>
    );
}

function handleCellTypes(
    cell: Cell<Record, unknown>,
    isLoading: boolean,
    openComparison: (event: FormEvent) => void,
    openExperimentalStructures: (event: FormEvent) => void
) {
    if (cell.column.id === "actions")
        return renderActionsCell(cell.row, openComparison);

    if (cell.column.id === "uniProtId")
        return renderUniProtIdCell(cell, isLoading, openExperimentalStructures);

    return getGeneralCellContent(cell);
}

type Props = {
    cell: Cell<Record, unknown>;
};

export function ProteinTableCell({ cell }: Props) {
    const { setExperimentalStructuresModalValue, setComparisonModalValue } = useContext(ModalContext);

    const openComparison = (event: FormEvent) => {
        event.preventDefault();
        setComparisonModalValue(cell.row.original.uniProtId);
    };

    const openExperimentalStructures = (event: FormEvent) => {
        event.preventDefault();
        setExperimentalStructuresModalValue(
            cell.row.original.experimentalStructures === null
            ? null
            : ({
                entryUniProtId: cell.row.original.uniProtId,
                experimentalStructures: cell.row.original.experimentalStructures,
            })
        );
    }

    const isLoading = cell.column.id === "uniProtId" && cell.row.original.experimentalStructures === null ? true : false;

    return (
        <td style={{
            background: getCellBackground(cell),
            textAlign: (['organism', 'uniProtId'].includes(cell.column.id) ? 'left' : 'center')
        }}>
            {handleCellTypes(cell, isLoading, openComparison, openExperimentalStructures)}
        </td>
    );
}
