import "./index.css";
import React from "react";
import Navbar from "../../components/Navbar";

const AboutPage = () => {
  return (
    <div className="content">
      <Navbar></Navbar>
      <div className="page-container">
        <h2 className="about-header">How does the calculator work?</h2>
        <p className="about-text">
          The calculator keeps track of champions left in the pool based on user
          parameters. This is updated whenever parameters change. The calculator
          will roll new shops until there is no gold remaining, purchasing any
          wanted units that show up in the proccess.
        </p>
        <p className="about-text">
          When simulating a shop, 5 unit costs are chosen randomly, weighted by
          level. Then the champions are chosen, weighted by the amount left in
          the pool.
        </p>
        <p className="about-text">
          The amount of successful trials is counted. Once all the trials are
          done, this number is divided by the number of trials ran to give you a
          percentage.
        </p>
        <p className="about-text">
          Since the calculator is based on simulating rolldowns instead of math,
          there may be errors! The benefit of this approach is you can involve
          elements of the game into the simulation (such as duplicators).
        </p>

        <h2 className="about-header">
          How does the calculator use duplicators?
        </h2>
        <p className="about-text">
          Lesser champion duplicators will only be used if all selected
          champions, 3 cost and under, can reach their amount wanted after
          usage.
        </p>
        <p className="about-text">
          Champion duplicators will be used if all selected champions,
          regardless of cost, can reach their amount wanted after usage.
        </p>

        <h2 className="about-header">Future Plans</h2>
        <ul className="about-list">
          <li>Starry Night</li>
          <li>ReinFOURcement</li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPage;
