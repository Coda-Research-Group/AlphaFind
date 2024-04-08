import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { Container } from 'react-bootstrap';
import "./main-footer.scss";
import { memo } from 'react';

export const MainFooter = memo(() => {
    let footer_year: string = import.meta.env.VITE_FOOTER_YEAR;
    footer_year = footer_year.replace("%YEAR%", new Date().getFullYear().toString());

    return (
        <>
            <footer className="main">
                <div className="content">
                    <Container>
                        <div className="header">
                            Alpha<span className="title-color">Find</span>
                        </div>
                        <div className="links">
                            <a href="https://disa.fi.muni.cz/complex-data-analysis/" target="_blank" title="Website"  rel="noreferrer">
                                {/* <Image src="imgs/fi-logo.png" fluid className="muni" /> */}
                                <FontAwesomeIcon icon={faPeopleGroup} />
                            </a>
                            <a href="mailto:slaninakova@mail.muni.cz">
                                <FontAwesomeIcon icon={faEnvelope} />
                            </a>
                        </div>
                        <p style={{textAlign: "justify"}}>
                            Licence conditions in accordance with § 11 of Act No. 130/2002 Coll. The owner of the software is Masaryk University, a public university, ID: 00216224. Masaryk University allows other companies and individuals to use this software free of charge and without territorial restrictions in usual way, that does not depreciate its value. This permission is granted for the duration of property rights. This software is not subject to special information treatment according to Act No. 412/2005 Coll., as amended. In case that a person who will use the software under this licence offer violates the licence terms, the permission to use the software terminates.
                            This work was supported by the Czech Science Foundation project No. GF23-07040K. Computational resources were supplied by the project "e-Infrastruktura CZ" (e-INFRA CZ LM2018140) and ELIXIR CZ Research Infrastructure (ID LM2018131) supported by the Ministry of Education, Youth and Sports of the Czech Republic.
                        </p>
                    </Container>
                </div>
                <div className="copyright">
                    {footer_year} | Created at the <a href="https://disa.fi.muni.cz/complex-data-analysis/">Intelligent Systems for Complex Data Research Group</a> <span className="author"> | Website made by {import.meta.env.VITE_AUTHOR}</span>
                </div>
            </footer>
        </>
    );
});
