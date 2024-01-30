import { Container, Image, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./main-navbar.scss";

interface props {
    setProgress: (value: number) => void;
}

export function MainNavbar({ setProgress } : props) {
    function handleClick() {
        setProgress(1);
    }

    return (
        <>
            <Navbar expand="lg" className="main" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand href="https://www.fi.muni.cz/" target="_blank"><Image src="imgs/fi-logo.png" fluid /></Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse>
                        <Nav>
                            <Nav.Link as={NavLink} to="/" onClick={handleClick}>Home</Nav.Link>
                            <Nav.Link as={NavLink} to="/protein-search" onClick={handleClick}>Protein Search</Nav.Link>
                            <Nav.Link as={NavLink} to="/image-search" onClick={handleClick}>Image Search</Nav.Link>
                            <Nav.Link as={NavLink} to="/about" onClick={handleClick}>About Us</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    );
}
