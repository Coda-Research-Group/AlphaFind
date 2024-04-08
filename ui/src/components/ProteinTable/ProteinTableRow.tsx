import { Row } from "@tanstack/react-table";
import { Record } from "./ProteinTable";
import { ProteinTableCell } from "./ProteinTableCell";

type Props = {
    row: Row<Record>;
};

export const ProteinTableRow = ({ row }: Props) => {
    return (
        <tr style={{fontStyle: row.original.tmScore <= 0.5 ? 'italic' : 'normal'}} key={row.id}>
            {row.getVisibleCells().map(cell => <ProteinTableCell
                key={cell.id}
                cell={cell}
            />)}
        </tr>
    );
};
