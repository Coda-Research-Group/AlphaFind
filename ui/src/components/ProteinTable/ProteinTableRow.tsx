import { faAngleDown, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Cell, Row, flexRender } from "@tanstack/react-table";
import { FormEvent } from "react";
import { Button } from "react-bootstrap";
import { Record } from "./ProteinTable";

function getCellBackground(cell: Cell<Record, unknown>) {
    if (cell.getIsGrouped())
        return '#ededed';

    if (cell.getIsAggregated())
        return '#ededed';

    if (cell.getIsPlaceholder())
        return '#fff';

    return '#fff';
}

function getGroupedCellContent(cell: Cell<Record, unknown>, row: Row<Record>, onClickExpand: (event: FormEvent) => void) {
    // Uncomment for grouping only rows with same organism if count > 1
    // if (row.subRows.length > 1)
    return (
        <div className="d-flex align-items-center">
            <Button className="p-0 me-3 d-block" onClick={onClickExpand} variant="link" style={{
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

function getCellContent(cell: Cell<Record, unknown>, row: Row<Record>, onClickExpand: (event: FormEvent) => void) {
    if (cell.getIsGrouped())
        return getGroupedCellContent(cell, row, onClickExpand);

    if (cell.getIsAggregated() || cell.getIsPlaceholder())
        return flexRender(cell.column.columnDef.aggregatedCell, cell.getContext());

    return flexRender(cell.column.columnDef.cell, cell.getContext());
}

type Props = {
    row: Row<Record>;
    setProteinComparisonModalValue: (value: string | null) => void;
};

export const ProteinTableRow = ({ row, setProteinComparisonModalValue }: Props) => {
    const onClickModal = (event: FormEvent) => {
        event.preventDefault();
        setProteinComparisonModalValue(row.original.uniProtId);
    };

    const onClickExpand = (event: FormEvent) => {
        event.preventDefault();
        row.toggleExpanded();
    };

    return (
        <tr style={{fontStyle: row.original.tmScore <= 0.5 ? 'italic' : 'normal'}} key={row.id}>
            {row.getVisibleCells().map(cell => 
                <td key={cell.id} style={{background: getCellBackground(cell), textAlign: (['organism', 'uniProtId'].includes(cell.column.id) ? 'left' : 'center')}}>
                    {cell.column.id === 'actions' ?
                        flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            meta: {
                                isExpanded: row.getIsExpanded(),
                                subRowsCount: row.subRows.length,
                                onClickModal: onClickModal,
                            }
                        }) :
                        getCellContent(cell, row, onClickExpand)
                    }
                </td>
            )}
        </tr>
    );
};
