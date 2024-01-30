import { useContext } from "react";
import { QueryObjectContext } from "../../pages/ProteinSearch/ProteinSearch";

type Props = {
    filteredCount: number;
    totalCount: number
};

export function FilterInfo({ filteredCount, totalCount }: Props) {
    const queryObject = useContext(QueryObjectContext);

    return (
        <div className="disabled">
            Most similar proteins to <i>{queryObject.uniProtId}</i> (showing {filteredCount} filtered out of {totalCount})
        </div>
    );
}
