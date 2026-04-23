import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import ListChoicePage from "./pages/ListChoicePage";
import CreateListPage from "./pages/CreateListPage";
import ReviewListPage from "./pages/ReviewListPage";
import RoutingPage from "./pages/RoutingPage";
import MapPage from "./pages/MapPage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/list-choice" element={<ListChoicePage />} />
        <Route path="/create-list" element={<CreateListPage />} />
        <Route path="/review-list" element={<ReviewListPage />} />
        <Route path="/routing" element={<RoutingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
