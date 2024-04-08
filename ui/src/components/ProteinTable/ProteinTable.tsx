import { Button, Col, Row, Table } from "react-bootstrap";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, getGroupedRowModel, getExpandedRowModel, ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useState, useContext, createContext } from "react";
import { columns } from "../../pages/ProteinSearch/tableColumnsDefinition";
import ComparisonModal from "../ComparisonModal";
import "./protein-table.scss";
import FilterInfo from "../FilterInfo";
import { ProteinTableRow } from "./ProteinTableRow";
import { ProteinTableHead } from "./ProteinTableHeader";
import exportToCsv from "./exportToCsv";
import { QueryObjectContext } from "../../pages/ProteinSearch/ProteinSearch";

export type Record = {
    uniProtId: string;
    experimentalStructuresExists: boolean,
    tmScore: number;
    rmsd: number;
    alignedLength: number;
    identicalAAs: number;
    organism: string | null;
    name: string | null;
    isReviewed: boolean;
    taxId: number;
    sequence: string;
    gene: string;
    experimentalStructures: string[] | null;
};

export type ExperimentalStructuresModalAttributes = {
    entryUniProtId: string;
    experimentalStructures: string[];
} | null;

export type ModalContextType = {
    setExperimentalStructuresModalValue: (attrs: ExperimentalStructuresModalAttributes) => void;
    setComparisonModalValue: (uniProtId: string) => void;
};

export const ModalContext = createContext<ModalContextType>({
    setComparisonModalValue: () => {},
    setExperimentalStructuresModalValue: () => {},
});

type Props = {
    data: Record[];
    setExperimentalStructuresModalValue: React.Dispatch<React.SetStateAction<ExperimentalStructuresModalAttributes>>;
};

export function ProteinTable({ data, setExperimentalStructuresModalValue }: Props) {
    const [proteinComparisonModalValue, setProteinComparisonModalValue] = useState<string | null>(null);
    // React Table states
    const [sorting, setSorting] = useState<SortingState>([{
        id: "tmScore",
        desc: true,
    }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [grouping, setGrouping] = useState([
        "organism",
    ]);

    const table = useReactTable({
        data: data,
        columns,
        state: {
            grouping,
            sorting,
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGroupingChange: setGrouping,
        autoResetExpanded: false,
    });
    const queryObject = useContext(QueryObjectContext);

    return (
        <>
            <ComparisonModal
                show={proteinComparisonModalValue !== null}
                onHide={() => setProteinComparisonModalValue(null)}
                comparingUniProtId={proteinComparisonModalValue}
            />
            <Row className="table-pre">
                <Col>
                    <FilterInfo filteredCount={table.getPreGroupedRowModel().rows.length} totalCount={data.length} />
                </Col>
            </Row>
            <Table responsive hover borderless className="protein-table">
                <ProteinTableHead table={table} />
                <tbody>
                    <ModalContext.Provider value={{
                        setComparisonModalValue: setProteinComparisonModalValue,
                        setExperimentalStructuresModalValue: setExperimentalStructuresModalValue,
                    }}>
                        {table.getRowModel().rows.map(row => 
                            <ProteinTableRow
                                key={row.id}
                                row={row}
                            />
                        )}
                    </ModalContext.Provider>
                </tbody>
            </Table>
            <Row className="table-post">
                <Col>
                    <FilterInfo filteredCount={table.getPreGroupedRowModel().rows.length} totalCount={data.length} />
                </Col>
                <Col>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => exportToCsv(e, data.length, queryObject.uniProtId, table.getCoreRowModel().rows)}
                        style={{
                            display: "block",
                            marginLeft: "auto"
                        }}
                    >Export all to CSV</Button>
                </Col>
            </Row>
        </>
    );
}
