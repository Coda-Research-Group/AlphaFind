import { Routes } from "react-router-dom";

type Props = {
    children: JSX.Element | JSX.Element[];
};

export function CustomSwitch({ children } : Props) {
    return (
        <Routes>
            {children}
        </Routes>
    );
}
