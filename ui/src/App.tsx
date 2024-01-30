import { BrowserRouter, Navigate, Route } from "react-router-dom";
import CustomSwitch from "./components/CustomSwitch";
import MainHeader from "./components/MainHeader";
import MainFooter from "./components/MainFooter";
import ProteinSearch from "./pages/ProteinSearch";
import NotFound from "./pages/NotFound";
import "./app.scss";

export default function App() {
    let basename = "/";

    return (
        <BrowserRouter basename={basename}>
            <MainHeader />
            {/* <aside></aside> */}
            {/* <navbar></navbar> */}
            <div className="d-flex flex-column main-container">
                <main>
                    <CustomSwitch>
                        <Route path="/" element={<Navigate to="/search" />} />
                        <Route path="/search" element={<ProteinSearch />}></Route>

                        <Route path="*" element={<NotFound />}></Route>
                    </CustomSwitch>
                </main>
                <MainFooter />
            </div>
        </BrowserRouter>
    );
}
