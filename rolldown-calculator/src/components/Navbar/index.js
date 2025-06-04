import React from 'react';
import { Link } from 'react-router-dom';
import logotype from "../../images/logotype.png";
import './index.css';

const Navbar = () => {
  return (
  <div className="navbar-wrapper">
    <div className="navbar">
      <Link to="/" className="logotype-link">
        <img src={logotype} alt="Logotype" className="logotype" />
      </Link>

      <div className="nav-buttons">
        <Link to="/about">
          <button className="nav-button">About</button>
        </Link>
      </div>
    </div>
  </div>
  );
};

export default Navbar;