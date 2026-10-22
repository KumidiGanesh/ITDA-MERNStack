import { Outlet } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import Navbar from "./Navbar";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="page-content"><Outlet /></main>
      <CartDrawer />
    </>
  );
}

export default Layout;
