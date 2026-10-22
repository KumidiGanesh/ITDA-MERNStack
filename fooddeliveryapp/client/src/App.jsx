import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import RestaurantDetail from "./pages/RestaurantDetail";
import { DeliveryAddressProvider } from "./context/DeliveryAddressContext";

function App() {
  return (
    <BrowserRouter>
      <DeliveryAddressProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </DeliveryAddressProvider>
    </BrowserRouter>
  );
}

export default App;
