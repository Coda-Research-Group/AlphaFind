import { faArrowLeftLong, faFaceSadTear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo } from "react";

import "./not-found.scss";
import { Link } from "react-router-dom";

export const NotFound = memo(() => {
    return (
        <article className="container">
            <header>
                <h2>
                    404 | Page Not Found
                </h2>
            </header>
            <section>
                <Link to="/">
                <FontAwesomeIcon icon={faArrowLeftLong} /> Go Back
                </Link>
                <p>
                    <FontAwesomeIcon icon={faFaceSadTear} className="icon-404" />
                </p>
            </section>
            {/* <footer></footer> */}
        </article>
    );
});
