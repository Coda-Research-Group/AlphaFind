import { Column, Header, HeaderGroup, Table, flexRender } from "@tanstack/react-table";
import { Record } from "./ProteinTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleRight, faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Button, Form } from "react-bootstrap";

const sortDirectionIcons = {
    "asc": <FontAwesomeIcon icon={faArrowUp} />,
    "desc": <FontAwesomeIcon icon={faArrowDown} />,
};

function handleFilter(value: string, column: Column<Record, unknown>): void {
    column.setFilterValue(value);
}

function mapHeader(header: Header<Record, unknown>, table: Table<Record>) {
    return (
        <th
            key={header.id}
            className={'user-select-none ' + header.id}
            colSpan={header.colSpan}
            style={{ textAlign: ["tmScore", "rmsd", "alignedLength", "global-similarity", "local-similarity"].includes(header.column.id) ? 'center' : 'left' }}
        >
            {!(header.isPlaceholder) && (
                <>
                    <div>
                        {header.id === "organism" && (
                            <Button variant="link" className="expand-all" size="lg" onClick={() => table.toggleAllRowsExpanded()}>
                                {table.getIsAllRowsExpanded() ? (<FontAwesomeIcon icon={faAngleDown} />) : (<FontAwesomeIcon icon={faAngleRight} />)}
                            </Button>
                        )}

                        <span
                            className={header.column.getCanSort() ? 'cursor-pointer' : ''}
                            onClick={header.column.getToggleSortingHandler()}
                        >
                            {flexRender(header.column.columnDef.header, header.getContext())}

                            {header.column.getCanSort() && (
                                <div className="sort-icon">
                                    {sortDirectionIcons[header.column.getIsSorted() as keyof typeof sortDirectionIcons] ?? undefined}
                                </div>
                            )}
                        </span>
                    </div>

                    {(header.column.id === 'organism' || header.column.id === 'uniProtId') && (
                        <div><Form.Control className="filter" name="filter" placeholder="Filter" onChange={event => handleFilter(event.target.value, header.column)} /></div>
                    )}
                </>
            )}
        </th>
    );
}

function mapHeaderGroup(headerGroup: HeaderGroup<Record>, table: Table<Record>) {
    return (
        <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => mapHeader(header, table))}
        </tr>
    );
}

type Props = {
    table: Table<Record>;
};

export const ProteinTableHead = ({ table }: Props) => {
    return (
        <thead>
            {table.getHeaderGroups().map(headerGroup => mapHeaderGroup(headerGroup, table))}
        </thead>
    );
};
