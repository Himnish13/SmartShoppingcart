import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import ListChoicePage from "./pages/ListChoicePage";
import CreateListPage from "./pages/CreateListPage";
import ReviewListPage from "./pages/ReviewListPage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/list-choice" element={<ListChoicePage />} />
        <Route path="/create-list" element={<CreateListPage />} />
        <Route path="/review" element={<ReviewListPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
