import logo from './logo.svg';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AboutPage from './components/AboutPage';
import RolldownCalc from './components/RolldownCalc';

function App() {
  return (<div className="App">
    <Router>
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/" element={<RolldownCalc />} />
      </Routes>
    </Router>
  </div>
  );
}

export default App;
