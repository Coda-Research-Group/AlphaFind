import { memo, useEffect, useRef } from "react";

import "./env-based-styles.scss";

export const EnvBasedStyles = memo(() => {
    const ref = useRef<HTMLStyleElement>(null);

    useEffect(() => {
        const bgColor = import.meta.env.PROD_DISA ? "#fff" : "#fff";
        
        ref.current!.innerHTML = `
            body {
                background-color: ${bgColor};
            }
        `;
    }, []);

    return (
        <>
            <style ref={ref}></style>
            {
                !(import.meta.env.PROD) && (
                    <div className="env-info">
                        DEV
                    </div>
                )
            }
        </>
    );
});
