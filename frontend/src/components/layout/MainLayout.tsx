import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function ScrollToHash() {
    const { hash } = useLocation();

    useEffect(() => {
        if (!hash) return;

        window.requestAnimationFrame(() => {
            document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
        });
    }, [hash]);

    return null;
}

const MainLayout=()=>{
    return(
        <>
        <ScrollToHash/>
        <Navbar/>
        <Outlet/>
        <Footer/>
        </>
    )
};

export default MainLayout;
