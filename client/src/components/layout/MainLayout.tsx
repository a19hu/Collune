import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function ScrollToRoutePosition() {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        window.requestAnimationFrame(() => {
            if (hash) {
                document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
                return;
            }

            window.scrollTo({ top: 0, left: 0 });
        });
    }, [hash, pathname]);

    return null;
}

const MainLayout=()=>{
    return(
        <>
        <ScrollToRoutePosition/>
        <Navbar/>
        <Outlet/>
        <Footer/>
        </>
    )
};

export default MainLayout;
