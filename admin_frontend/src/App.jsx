import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ProductManagement from "./pages/ProductManagement";
import OffersManagement from "./pages/OffersManagement";
import ShoppingListManagement from "./pages/ShoppingListManagement";
import CartTracking from "./pages/CartTracking";
import BillGeneration from "./pages/BillGeneration";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/offers" element={<OffersManagement />} />
          <Route path="/shopping-lists" element={<ShoppingListManagement />} />
          <Route path="/carts" element={<CartTracking />} />
          <Route path="/bills" element={<BillGeneration />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
