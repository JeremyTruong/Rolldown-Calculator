import React, { useState, useEffect, useCallback } from "react";
import "./index.css";
import Navbar from '../../components/Navbar';
import goldIcon from "../../images/gold.png"
import championDuplicatorImg from "../../images/championduplicator_v.png"
import lesserDuplicatorImg from "../../images/championduplicator_iii.png"


// Function to import all images
const importAllImages = (requireContext) => {
  return requireContext.keys().map(requireContext);
};

// Import champions by cost from specified folders
const oneCosts = importAllImages(require.context("../../images/Set 14/1 Costs", false, /\.(png|jpe?g|gif|svg)$/));
const twoCosts = importAllImages(require.context("../../images/Set 14/2 Costs", false, /\.(png|jpe?g|gif|svg)$/));
const threeCosts = importAllImages(require.context("../../images/Set 14/3 Costs", false, /\.(png|jpe?g|gif|svg)$/));
const fourCosts = importAllImages(require.context("../../images/Set 14/4 Costs", false, /\.(png|jpe?g|gif|svg)$/));
const fiveCosts = importAllImages(require.context("../../images/Set 14/5 Costs", false, /\.(png|jpe?g|gif|svg)$/));
const images = [oneCosts, twoCosts, threeCosts, fourCosts, fiveCosts];

// The amount of champions in the pool at each cost (bag sizes)
const bagSize = [30, 25, 18, 10, 9]

// Border colours of each unit cost
const borderColours = ["#bbbbbbe0", "#14cc73e0", "#54c3ffe0", "#de0ebde0", "#ffc430e0"];

// Shop odds at each level, 0-11
const shopOdds = [
    [100,0,0,0,0],
    [100,0,0,0,0],
    [100,0,0,0,0],
    [75,25,0,0,0],
    [55,30,15,0,0],
    [45,33,20,2,0],
    [30,40,25,5,0],
    [19,30,40,10,1],
    [17,24,32,24,3],
    [15,18,25,30,12], 
    [5,10,20,40,25],
    [1,2,12,50,35],
]

// Constant for minimum champions left in pool
const minLeftInPool = 5;

// Number of trials ran when simulating rolldowns
const numTrials = 10000;

// Labels for ChampsOut dropdowns
const costLabels = ['One', 'Two', 'Three', 'Four', 'Five'];

// Attaches pool attributes to 2D array of image links
function setupChampions(championsByCost) {
  return championsByCost.map((champRow, rowIndex) =>
    champRow.map((image, colIndex) => ({
      id: `${rowIndex}-${colIndex}`, // Unique ID combining rowIndex and colIndex
      row: rowIndex,
      col: colIndex,
      link: image,
      cost: rowIndex + 1, // Cost is the row number (rowIndex + 1)
      selected: false,
      amountOwned: 0,
      amountWanted: 0,
      amountHeldByOthers: 0,
      amountInPool: bagSize[rowIndex]
    }))
  );
}

function RolldownCalc() {
  const [champions, setChampions] = useState([[], [], [], [], []]);
  const [showResults, setShowResults] = useState(false);
  const [level, setLevel] = useState(8);
  const [gold, setGold] = useState(50);
  const [champsOut, setChampsOut] = useState([0, 0, 0, 0, 0]);
  const [lesserDuplicators, setLesserDuplicators] = useState(0);
  const [championDuplicators, setChampionDuplicators] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [removeChampsFlag, setRemoveChampsFlag] = useState(false);

  // useEffect to set up data when the component mounts
  useEffect(() => {
    const transformedData = setupChampions(images);
    setChampions(transformedData);
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Generates array from min to max, used for dropdown menu values
  const generateSequence = (min, max) => {  
  if (min > max) return [];
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  };
  
  // Returns an array of non-selected champions at a specific cost
  const nonSelectedChampionsAtCost = useCallback((cost, championPool = champions) => {
    return championPool[cost].filter((champion) => !champion.selected)
  }, [champions]);

  // Returns an array of selected champions at a specific cost
  const selectedChampionsAtCost = (cost, championPool = champions) => {
    return championPool[cost].filter((champion) => champion.selected)
  }

  // Returns how many champions are in the pool of a given cost, excluding selected champions
  const nonSelectedPoolAmt = (cost, championPool = champions) => {
    return nonSelectedChampionsAtCost(cost, championPool)
      .reduce((total, champion) => total + champion.amountInPool, 0);
  };

  // Returns how many champions are in the pool of a given cost
  const poolAmt = (cost, championPool = champions) => {
    return championPool[cost]
      .reduce((total, champion) => total + champion.amountInPool, 0);
  };

  // Total amount of 3 cost or less champions wanted
  const calcLesserWanted = (championPool = champions) => {
    return championPool.flat()
      .filter(champion => champion.row < 3)
      .reduce((sum, champion) => sum + champion.amountWanted - champion.amountOwned, 0);
  };

  // Total amount of champions of any cost still wanted
  const calcTotalWanted = (championPool = champions) => {
    return championPool.flat()
      .reduce((sum, champion) => sum + champion.amountWanted - champion.amountOwned, 0);
  };
  
  // Dynamic ranges for dropdown menus of cost out fields
  const calculateChampsOutRange = useCallback((row) => {
    return generateSequence(0, Math.max(0, bagSize[row] * nonSelectedChampionsAtCost(row).length - minLeftInPool))
  }, [nonSelectedChampionsAtCost]);

  // Update champsOut when the range changes to make sure value is within range
  useEffect(() => {
    for (let i = 0; i < 5; i++){
      const validRange = calculateChampsOutRange(i); // Calculate the range
      if (!validRange.includes(champsOut[i])) {
        // If current value is out of range, change to 0
        setChampsOut((prev) =>
          prev.map((val, j) => (j === i ? validRange[0] : val))
        );
      }
    }
  }, [calculateChampsOutRange, champsOut]);

  // Handler for clicking champions at the top of the page
  const handleChampionClick = (curChamp) => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) =>
          champion.id === curChamp.id
            ? {
                ...champion,
                selected: true,
                amountWanted: 1, // Selecting defaults the user to wanting at least 1
              }
            : champion
        )
      )
    );
    
    // Set flag to trigger amountInPool updates for whole pool
    setRemoveChampsFlag(true);
  };

  // Handler for removing image from selected list
  const handleRemoveChampion = (removedChampion) => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) =>
          champion.id === removedChampion.id
            ? {
                ...champion,
                selected: false,
                amountOwned: 0,
                amountWanted: 0,
                amountHeldByOthers: 0,
                amountInPool: bagSize[removedChampion.row]
              }
            : champion
        )
      )
    );

    // Set flag to trigger amountInPool updates for whole pool
    setRemoveChampsFlag(true);
  };

  // Amount owned dropdown menu handler
  const handleAmountOwnedChange = (curChamp, newAmountOwned) => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) =>
          champion.id === curChamp.id
            ? {
                ...champion,
                amountOwned: newAmountOwned,
                amountWanted: Math.max(newAmountOwned + 1, curChamp.amountWanted), // Amount wanted is always more than amount owned
                amountInPool: bagSize[curChamp.row] - curChamp.amountHeldByOthers - newAmountOwned
              }
            : champion
        )
      )
    );
  };

  // Amount wanted dropdown menu handler
  const handleAmountWantedChange = (curChamp, amountWanted) => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) =>
          champion.id === curChamp.id
            ? {
                ...champion,
                amountWanted: amountWanted
              }
            : champion
        )
      )
    );
  };

  // Amount held by others dropdown menu handler
  const handleAmountHeldByOthersChange = (curChamp, newAmountHeldByOthers) => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) =>
          champion.id === curChamp.id
            ? {
                ...champion,
                amountHeldByOthers: newAmountHeldByOthers,
                amountInPool: bagSize[curChamp.row] - curChamp.amountOwned - newAmountHeldByOthers
              }
            : champion
        )
      )
    );
  };

  // Handler for champs out dropdown menus
  const handleChampsOut = (cost, newNum) => {
    setChampsOut((prevChampsOut) => {
      const updatedChampsOut = prevChampsOut.map((oldNum, i) => (i === cost ? newNum : oldNum));
      removeChampsFromPool(updatedChampsOut); // Pass updated state directly
      return updatedChampsOut;
    });
  };

  // Handler for reset button
  const handleReset = () => {
    setChampions((prevChampions) =>
      prevChampions.map((row) =>
        row.map((champion) => ({
            ...champion,
            selected: false,
            amountOwned: 0,
            amountWanted: 0,
            amountHeldByOthers: 0,
            amountInPool: bagSize[champion.row],
          }))
        )
      );
    setChampsOut([0, 0, 0, 0, 0]);
    setShowResults(false); // Remove results
  };

  // Handler for simulate button
  const handleSimulate = () => {
    runSimulation();
    setShowResults(true);
  };

  // Roll a single shop cost
  const rollSingleShopCost = (level) => {
    // Convert shop odds into cumulative weights
    const cumulativeWeights = [];
    let cumulativeSum = 0;
    
    for (let i = 0; i < shopOdds[level].length; i++) {
      cumulativeSum += shopOdds[level][i];
      cumulativeWeights.push(cumulativeSum);
    }

    // Generate number from 0-100
    const random = Math.random() * 100

    // Find which cost corresponds to our random roll
    // 0 indexed, i.e. 1 costs are 0, 2 costs are 1
    for (let j = 0; j < cumulativeWeights.length; j++){
      if (random < cumulativeWeights[j]) {
        return j;
      }
    }
  }
  
  // Given a level, return the costs of five champions in a shop
  const rollFiveShopCosts = (level) => {
    const result = [];

    // Generate 5 shop costs
    for (let i = 0; i < 5; i++){
      result.push(rollSingleShopCost(level));
    }

    return result;
  };

  // Handle changing gold text field, numbers, 0-1000
  const handleGoldChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1000) {
        setGold(value);
    }
  };

  // Rolls a champion of a given cost
  const rollChampion = (cost, championPool = champions) => {
    // Generate a random number between 0 and numChampsRemaining
    const numChampsRemaining = poolAmt(cost, championPool);
    let randomIndex = Math.random() * numChampsRemaining;

    // Find the selected champion based on the random number
    for (let i = 0; i < championPool[cost].length; i++) {
      if (randomIndex < championPool[cost][i].amountInPool) {
        return championPool[cost][i]
      }
      // Decrement random until it is less then a champions amount left in pool
      // Simulates a weighted random
      randomIndex -= championPool[cost][i].amountInPool;
    }
  }

  // Given a level, roll a full shop of champions
  const rollShop = (level, championPool = champions) => {
    const shop = [];
    const costs = rollFiveShopCosts(level);
    for (let i = 0; i < costs.length; i++) {
      shop.push(rollChampion(costs[i], championPool));
    }
    return shop;
  }

  // Remove champions, other than those selected, from pool according to user specifications
  // Evenly removes amount from non-selected champions
  const removeChampsFromPool = useCallback((newChampsOut) => {
    setChampions((prevChampions) =>
      prevChampions.map((row, rowIdx) => {
        let championsToRemoveFrom = nonSelectedChampionsAtCost(rowIdx);
        let amountToBeRemoved = newChampsOut[rowIdx];

        // Prevents division by 0 if user selects all units of a specific cost
        if (championsToRemoveFrom.length === 0) {
          return row;
        }

        let baseDecrement = Math.floor(amountToBeRemoved / championsToRemoveFrom.length);
        let remainder = amountToBeRemoved % championsToRemoveFrom.length;

        return row.map((champ) => {
          if (!champ.selected) {
            let decrement = baseDecrement + (remainder > 0 ? 1 : 0);
            remainder = Math.max(0, remainder - 1);

            return {
              ...champ,
              amountInPool: bagSize[champ.row] - decrement,
            };
          }
          return champ; // Return unchanged if selected
        });
      })
    );
  }, [setChampions, nonSelectedChampionsAtCost]);

  // useEffect to call removeChampsFromPool if flag to remove is true
  useEffect(() => {
    if (removeChampsFlag) {
      removeChampsFromPool(champsOut);
      setRemoveChampsFlag(false); // Reset flag to prevent loop
    }
  }, [removeChampsFlag, champsOut, removeChampsFromPool]);

  // Returns a percentage string given a float
  const floatToPercentage = (value, decimalPlaces = 2) => {
    return (value * 100).toFixed(decimalPlaces) + "%";
  };

  // Dropdown component
  const DropdownItem = ({ label, value, onChange, range }) => {
    return (
      <div className="selected-champion-dropdown-item">
        <label>{label}</label>
        <select value={value} onChange={onChange}>
          {range.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Component for champs out dropdowns
  const ChampsOutDropdown = ({ label, labelColour, cost, value, onChange, rangeGenerator }) => {
    return (
      <div className="dropdown-row">
        <label style={{ color: labelColour }} className="dropdown-row-label">{label}</label>
        <select
          className="dropdown-row-select"
          value={value}
          onChange={(e) => onChange(cost, parseInt(e.target.value))}
        >
          {rangeGenerator(cost).map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Uses up lesser champion duplicators
  const dupeLesserChampions = (championPool, startingLesserDupes) => {
    let remaining = startingLesserDupes;

    // Loop over 3 cost and cheaper champs, update values
    for (let i = 0; i < 3; i++){
      for (let j = 0; j < championPool[i].length; j++){
        const curChamp = championPool[i][j];
        while (curChamp.amountWanted > curChamp.amountOwned && remaining > 0){
          curChamp.amountOwned += 1;
          // If 0 champions in pool, can still use duplicator, pool amount remains 0
          curChamp.amountInPool = Math.max(0, curChamp.amountInPool - 1);
          remaining -= 1;
        }
      }
    }

    return remaining;
  }

  // Uses up champion duplicators
  const dupeChampions = (championPool, startingDupes) => {
    let remaining = startingDupes;

    // Loop over every champion and update values
    for (let i = 0; i < championPool.length; i++){
      for (let j = 0; j < championPool[i].length; j++){
        const curChamp = championPool[i][j];
        while (curChamp.amountWanted > curChamp.amountOwned && remaining > 0){
          curChamp.amountOwned += 1;
          // If 0 champions in pool, can still use duplicator, pool amount remains 0
          curChamp.amountInPool = Math.max(0, curChamp.amountInPool - 1);
          remaining -= 1;
        }
      }
    }

    return remaining;
  }

  // Uses lesser champion duplicators if we can get all wanted 3 cost or cheaper champions
  // Uses champion duplicators if we can get all wanted champions regardless of cost
  // Returns the remaining number of lesser champion duplicators and champion duplicators in an 2 attribute object
  const updateDuplicators = (championPool, lesserDupeAmt, championDupeAmt, lesserWanted, totalWanted) => {
    let remainingLesserDupes = lesserDupeAmt;
    let remainingChampionDupes = championDupeAmt;
    console.log(lesserDupeAmt, championDupeAmt, lesserWanted, totalWanted);
    // 3 cost or cheaper champions wanted is less than amount of lesser duplicators - use them up
    if (lesserWanted > 0 && lesserWanted <= remainingLesserDupes){
      remainingLesserDupes = dupeLesserChampions(championPool, remainingLesserDupes);
    }
    else {
      // Calculate how many champion duplicators are needed by using the lesser ones first
      // The max we can subtract is the minimum of
      // 1. champions less than 3 cost that are wanted (more duplicators than champions wanted)
      // 2. the amount of lesser duplicators we have (more champions wanted than duplicators)
      const totalWantedAfterLesserDuplicators = totalWanted - Math.min(remainingLesserDupes, lesserWanted);
      // Check if we have enough duplicators for remaining amount of champions wanted
      if (totalWantedAfterLesserDuplicators <= championDupeAmt) {
        remainingLesserDupes = dupeLesserChampions(championPool, remainingLesserDupes);
        remainingChampionDupes = dupeChampions(championPool, championDupeAmt);
      }
    }

    return { remainingLesserDupes, remainingChampionDupes };
  }

  const successfulTrial = (championPool) => {
    return championPool.every(row =>
      row.every(champ => champ.amountOwned === champ.amountWanted)
    );
  }

  // Runs simulation
  const runSimulation = () => {
    let successfulTrials = 0;
    // run numTrials number of trials
    for (let i = 0; i < numTrials; i ++){
      // Make deep copy of current state of champions
      const championsCopy = structuredClone(champions);
      // Copy amount of duplicators from state to a local variable
      let lesserDupeAmt = lesserDuplicators;
      let championDupeAmt = championDuplicators;

      // 3 cost or cheaper champions wanted
      let lesserWanted = calcLesserWanted(championsCopy);

      // Champions wanted regardless of cost
      let totalWanted = calcTotalWanted(championsCopy);

      // Check and update champion duplicators
      const dupeResult = updateDuplicators(championsCopy, lesserDupeAmt, championDupeAmt, lesserWanted, totalWanted);
      lesserDupeAmt = dupeResult.remainingLesserDupes;
      championDupeAmt = dupeResult.remainingChampionDupes;
      lesserWanted = calcLesserWanted(championsCopy);
      totalWanted = calcTotalWanted(championsCopy);

      // Check if trial is successful already
      if (totalWanted === 0){
        successfulTrials = numTrials;
        break;
      }

      let curGold = gold;

      // Reroll shop while we still have gold for one reroll (2 gold)
      rollLoop: while (curGold > 1){
        // Pay for and roll shop
        curGold -= 2;
        let curShop = rollShop(level, championsCopy);

        // Iterate over champions, buy if wanted
        for (let j = 0; j < 5; j++){
          // Use the shop row and col to modify champions copy
          let curChamp = championsCopy[curShop[j].row][curShop[j].col];

          // If champion is wanted, and we have enough gold
          if (curChamp.selected && curChamp.cost <= curGold && curChamp.amountOwned < curChamp.amountWanted && curChamp.amountInPool > 0){
            curGold -= curChamp.cost;
            curChamp.amountOwned += 1;
            curChamp.amountInPool -= 1;

            totalWanted -= 1;
            if (curChamp.cost <= 3){
              lesserWanted -= 1;
            }

            // Update duplicators
            const dupeResult = updateDuplicators(championsCopy, lesserDupeAmt, championDupeAmt, lesserWanted, totalWanted);
            lesserDupeAmt = dupeResult.remainingLesserDupes;
            championDupeAmt = dupeResult.remainingChampionDupes;
            lesserWanted = calcLesserWanted(championsCopy);
            totalWanted = calcTotalWanted(championsCopy);

            // Stop rolling if trial is successful
            if (totalWanted === 0){
              successfulTrials += 1;
              break rollLoop; // Stop rolling
            }
          }
        }
      }
    }

    // Set results in state
    setHitCount(successfulTrials);
  }

  // Dynamic array of selected champions
  const selectedChampions = champions.flatMap((allChampions) => 
    allChampions.filter((champion) => champion.selected)
  );

  // Dynamic ranges for dropdown menus
  const calculateAmountOwnedRange = (champion) =>
    generateSequence(0, Math.min(8, bagSize[champion.row] - champion.amountHeldByOthers - 1));

  const calculateAmountWantedRange = (champion) =>
    generateSequence(champion.amountOwned + 1, Math.min(9, bagSize[champion.row] - champion.amountHeldByOthers));

  const calculateHeldByOthersRange = (champion) =>
    generateSequence(0, bagSize[champion.row] - Math.max(champion.amountWanted, 1));

  const hexToRGBA = (hex, alpha = 1) => {
    // Remove the hash at the start if it's there
    hex = hex.replace('#', '');
  
    // Parse the hex into RGB components
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
  
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <div className="content">
      <Navbar />

      {/* Champion Selection Container */}
      <div className="image-grid">
        <h4>Select the champions you want</h4>
        <div className="image-grid__rows">
          {champions.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className={"image-row"}
              style={{
                '--glow-colour': hexToRGBA(borderColours[rowIndex], 0.5),
              }}
            >
              {row.map((champion, imageIndex) => (
                <img
                  key={champion.id}
                  src={champion.link}
                  alt={""}
                  className="image-item"
                  onClick={() => handleChampionClick(champion)}
                  style={{
                    border: `2px solid ${borderColours[rowIndex]}`,
                    boxShadow: `0 0 4px 1px ${borderColours[rowIndex]}`
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <button className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </div>
      
      {/* Selected Champions Container */}
      <div className="selected-images">
        <h2>Selected Champions</h2>
        <h4>Configure amounts</h4>
        <div className="selected-images__grid">
          {selectedChampions.map((champion, index) => (
            <div 
              key={champion.id} 
              className="selected-image-item"
              style={{
                '--glow-colour': hexToRGBA(borderColours[champion.row], 0.5),
              }}
            >
            <img
              src={champion.link}
              alt=""
              className="selected-image"
              style={{ border: `2px solid ${borderColours[champion.row]}` }}
            />
            <div className="selected-champion-dropdowns">
              <DropdownItem
                label={`Amount Owned (0-${Math.min(8, bagSize[champion.row] - champion.amountHeldByOthers - 1)})`}
                value={champion.amountOwned}
                onChange={(e) => handleAmountOwnedChange(champion, parseInt(e.target.value))}
                range={calculateAmountOwnedRange(champion)}
              />

              <DropdownItem
                label={`Amount Wanted (${champion.amountOwned + 1}-${Math.min(9, bagSize[champion.row] - champion.amountHeldByOthers)})`}
                value={champion.amountWanted}
                onChange={(e) => handleAmountWantedChange(champion, parseInt(e.target.value))}
                range={calculateAmountWantedRange(champion)}
              />

              <DropdownItem
                label={`Amount Held by Others (0-${bagSize[champion.row] - Math.max(champion.amountWanted, 1)})`}
                value={champion.amountHeldByOthers}
                onChange={(e) => handleAmountHeldByOthersChange(champion, parseInt(e.target.value))}
                range={calculateHeldByOthersRange(champion)}
              />
            </div>

            <button
              className="remove-button"
              onClick={() => handleRemoveChampion(champion)}
              aria-label="Remove Image"
            >
              X
            </button>
          </div>
          ))}
        </div>
      </div>
          
      {/* Final Config */}
      <h2>Configure Final Details</h2>
      <div className="final-config-container">

        {/* Level and Gold Column */}
        <div className="level-gold-container">
          <h3 className="final-config-header">Level and Gold</h3>

          {/* Dropdown for Level */}
          <div className="dropdown-row">
            <label className="dropdown-row-label">Level</label>
            <select
            className="dropdown-row-select"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            >
            {[...Array(9).keys()].map((val) => (
                <option key={val} value={val + 3}>
                {val + 3}
                </option>
            ))}
            </select>
          </div>

          {/* Textbox for Gold */}
          <div className="dropdown-row">
            <label className="dropdown-row-label label-with-icon">
              <img src={goldIcon} alt="Gold Icon" className="label-icon" />
              Gold
            </label>
            <input
            type="number"
            min="0"
            max="1000"
            value={gold}
            onChange={handleGoldChange}
            placeholder="Enter gold (0-1000)"
            />
          </div>
        </div>

        {/* Champions Out Dropdowns */}  
        <div className="champs-out-dropdown-container">
          <h3 className="final-config-header">Champions Out</h3>
          {costLabels.map((label, index) => (
            <ChampsOutDropdown
              key={index}
              label={`${label} Costs`}
              cost={index}
              value={champsOut[index]}
              onChange={handleChampsOut}
              rangeGenerator={calculateChampsOutRange}
              labelColour={borderColours[index]}
            />
          ))}
        </div>
            
        {/* Duplicators Dropdowns */}  
        <div className="duplicator-dropdowns">
          <h3 className="final-config-header">Duplicators</h3>
          
          {/* Dropdown for Lesser Champion Duplicators */}
          <div className="dropdown-row">
            <label className="dropdown-row-label label-with-icon">
              <img src={lesserDuplicatorImg} alt="Lesser Champion Duplicator Icon" className="label-icon" />
              Lesser Champion
            </label>
            <select
            className="dropdown-row-select"
            value={lesserDuplicators}
            onChange={(e) => setLesserDuplicators(parseInt(e.target.value))}
            >
            {[...Array(10).keys()].map((val) => (
              <option key={val} value={val}>
              {val}
              </option>
            ))}
            </select>
          </div>

          {/* Dropdown for Champion Duplicators */}              
          <div className="dropdown-row">
            <label className="dropdown-row-label label-with-icon">
              <img src={championDuplicatorImg} alt="Champion Duplicator Icon" className="label-icon" />
              Champion
            </label>
            <select
            className="dropdown-row-select"
            value={championDuplicators}
            onChange={(e) => setChampionDuplicators(parseInt(e.target.value))}
            >
            {[...Array(10).keys()].map((val) => (
              <option key={val} value={val}>
              {val}
              </option>
            ))}
            </select>
          </div>              
        </div>
      </div>

      <div className="results-container">
        <h1 className="results-title">Results</h1>
        {showResults && <h2 className="results-text">Out of {numTrials} trials, you hit {hitCount} times.</h2>}
        {showResults && <h2 className="results-text-large">Chance of hitting: {floatToPercentage(hitCount/numTrials)}</h2>}
      </div>
      <div className="simulate-button-container">
        <button className="simulate-button" onClick={(e) => handleSimulate()}>
          Simulate
        </button>
      </div>
    </div>
  );
}

export default RolldownCalc;