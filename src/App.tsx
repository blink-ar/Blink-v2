import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Benefit from "./pages/Benefit";
import SingleBenefit from "./pages/SingleBenefit";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/benefit/:id/:benefitIndex" element={<Benefit />} />
        <Route path="/single-benefit/:id" element={<SingleBenefit />} />
      </Routes>
    </Router>
  );
}

export default App;
