import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Benefit from "./pages/Benefit";
import SingleBenefit from "./pages/SingleBenefit";
import { BenefitsPage } from "./pages/BenefitsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/benefit/:id/:benefitIndex" element={<Benefit />} />
        <Route path="/single-benefit/:id" element={<SingleBenefit />} />
        <Route path="/benefits" element={<BenefitsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
