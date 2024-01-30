import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Form, InputGroup } from "react-bootstrap";
import TextInput from 'react-autocomplete-input';
import { FormEvent } from "react";

const inputHints: string[] = [];

type Props = {
    large: boolean;
    invalid: boolean;
    onSearch: (event: FormEvent) => void;
    inputValue: string;
    setInputValue: (value: React.SetStateAction<string>) => void;
};

export function SearchInput({ large, invalid, onSearch, inputValue, setInputValue }: Props) {
    const formClassName = large ? "large" : undefined;
    const iconClassName = invalid ? "is-invalid" : undefined;
    const inputClassName = invalid ? "form-control is-invalid": "form-control"

    return (
        <Form action="" method="POST" className={formClassName} onSubmit={onSearch}>
            <Form.Group>
                <Form.Label htmlFor="search">
                    Search with UniProt, PDB ID or Gene Symbol
                </Form.Label>
                <InputGroup>
                    <InputGroup.Text
                        onClick={onSearch}
                        className={iconClassName}
                    ><FontAwesomeIcon icon={faMagnifyingGlass} /></InputGroup.Text>
                    <TextInput
                        // @ts-expect-error Prop does exists indeed
                        className={inputClassName}
                        id="search"
                        name="search"
                        placeholder="e.g. P10632, 1TQN or NLGN1"
                        value={inputValue}
                        onChange={(val: string) => setInputValue(val)}
                        Component="input"
                        maxOptions={6}
                        options={inputHints}
                        trigger={['']}
                        spacer=""
                        style={{ fontSize: '1.1em' }}
                    />
                </InputGroup>
            </Form.Group>
        </Form>
    );
}
