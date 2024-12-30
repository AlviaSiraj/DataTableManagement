import React from "react";
import "./App.css";
import NavBar from "./components/NavBar.js";
import Upload from "./components/upload.js";
import DisplayList from "./components/DisplayList.js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DisplayTable from "./components/DisplayTable.js";

const App = () => {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<DisplayList />} />
          <Route path="/display" element={<DisplayTable />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
