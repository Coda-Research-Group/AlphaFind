import { memo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Description from "../Description";
import "./main-header.scss";
import { useUrlParams } from "../../common/utils";

export const MainHeader = memo(() => {
    const [urlParams] = useUrlParams();

    return (
        <header className="mt-3 mb-1">
            <Container>
                <Row>
                    <Col xs={8}>
                        <h1 className="mb-0"><a style={{ textDecoration: "none", color: "inherit" }} href="./">Alpha<span className="title-color">Find</span></a></h1>
                    </Col>
                    <Col xs={4} className={urlParams.searchQuery === null ? "manual-container visually-hidden" : "manual-container"}>
                        <a href="https://github.com/Coda-Research-Group/AlphaFind/wiki/Manual" target="_blank" rel="noreferrer">Manual</a>
                    </Col>
                </Row>
                <hr />
                <Description />
            </Container>
        </header>
    );
});
