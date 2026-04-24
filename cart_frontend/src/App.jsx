import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import ListChoicePage from "./pages/ListChoicePage";
import CreateListPage from "./pages/CreateListPage";
import ReviewListPage from "./pages/ReviewListPage";
import RoutingPage from "./pages/RoutingPage";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import VirtualKeyboardGlobal from "./components/VirtualKeyboard";
import OffersPage from "./pages/OffersPage";
import { ScanProvider } from "./context/ScanContext";
import ScanPopup from "./components/ScanPopup";

function App() {
  return (
    <ScanProvider>
      <BrowserRouter>
        <VirtualKeyboardGlobal />
        <ScanPopup />
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/list-choice" element={<ListChoicePage />} />
          <Route path="/create-list" element={<CreateListPage />} />
          <Route path="/review-list" element={<ReviewListPage />} />
          <Route path="/routing" element={<RoutingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/offers" element={<OffersPage />} />
        </Routes>
      </BrowserRouter>
    </ScanProvider>
  )
}

export default App
