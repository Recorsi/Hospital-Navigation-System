import React, { useState, useEffect } from 'react';
import './App.css';

//import floorplan from './floorplan.svg';
import floorplan_gnd from './groundfloor.png';
import floorplan_1st from './firstfloor.png';

import circleImg from './circle.png';
import logo from './logo.png';

function App() {
  const [point, setPoint] = useState(null);
  const [patientData, setPatientData] = useState({});
  const [floorNumber, setFloorNumber] = useState(0);
  const [allNodeNames, setAllNodeNames] = useState([]);


  useEffect(() => { handleFloorChange(); }, [floorNumber]);

  const handleClick = (event) => {
    const pointX = event.nativeEvent.offsetX;
    const pointY = event.nativeEvent.offsetY;
    setPoint({ x: pointX, y: pointY });
  };

  //Create a node element on the floorplan
  const createNodeElement = (node) => {
    let xOffset;
    let yOffset;
    if (floorNumber === 0) {
      xOffset = 388;
      yOffset = 150;
    }
    else {
      xOffset = 383;
      yOffset = 150;
    }

    const circle = document.createElement('img');
    const circleDiameter = 40;
    circle.style.position = 'absolute';
    circle.style.left = `${node.properties.x.low - circleDiameter / 2 + xOffset}px`;
    circle.style.top = `${node.properties.y.low - circleDiameter / 2 + yOffset}px`;
    circle.style.width = `${circleDiameter}px`;
    circle.style.height = `${circleDiameter}px`;
    circle.setAttribute('src', circleImg);
    circle.classList.add('circle-class');

    const nodeText = document.createElement('div');
    nodeText.textContent = node.properties.name;
    nodeText.style.position = 'absolute';
    nodeText.style.left = `${node.properties.x.low - 40 + xOffset}px`;
    nodeText.style.top = `${node.properties.y.low - 50 + yOffset}px`;
    nodeText.style.width = '85px';
    nodeText.style.textAlign = 'center';
    nodeText.style.backgroundColor = 'white';


    const nodeContainer = document.createElement('div');
    nodeContainer.appendChild(circle);
    nodeContainer.appendChild(nodeText);
    return nodeContainer;
  };

  //Create a line between nodes
  const createLineElement = (prevNode, node) => {
    let xOffset;
    let yOffset;
    if (floorNumber === 0) {
      xOffset = 390;
      yOffset = 150;
    }
    else {
      xOffset = 383;
      yOffset = 150;
    }

    const line = document.createElement('img');
    const dx = node.properties.x.low - prevNode.properties.x.low;
    const dy = node.properties.y.low - prevNode.properties.y.low;
    const distance = Math.sqrt(dx * dx + dy * dy);
    line.style.position = 'absolute';
    line.style.left = `${prevNode.properties.x.low + xOffset}px`;
    line.style.top = `${prevNode.properties.y.low + yOffset}px`;
    line.style.width = `${distance}px`;
    line.style.height = '5px';
    line.style.backgroundColor = 'black';
    line.style.transformOrigin = '0% 50%';
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    line.style.transform = `rotate(${angle}deg)`;
    return line;
  };


  const handleGetAllNodes = () => {
    fetch('http://localhost:3000/all')
      .then(response => response.json())
      .then(data => {
        //console.log(data);
        let circleContainer = document.querySelector('.circle-container');
        if (circleContainer) {
          document.body.removeChild(circleContainer);
        }
        circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container');
        let nodeNames = [];
        let allNodeNames = [];
        data.forEach(node => {
          if (node.properties.floor.low === floorNumber) {
            const nodeElement = createNodeElement(node);
            circleContainer.appendChild(nodeElement);
            nodeNames.push(node.properties.name);
          }
          allNodeNames.push(node.properties.name);
        });
        document.body.appendChild(circleContainer);
        setNodeNames(nodeNames);
        setAllNodeNames(allNodeNames);
      })
      .catch(error => console.error(error));
  };

  //export node names
  const [nodeNames, setNodeNames] = useState([]);


  //Shortest Path handle get request
  const handleShortestPathReq = () => {
    const dropdown1 = document.querySelector("#dropdown1").value;
    const dropdown2 = document.querySelector("#dropdown2").value;

    if (dropdown1 === dropdown2) {
      // Show error message that values are the same
      alert("The selected values must be different");
      return;
    }

    fetch(`http://localhost:3000/shortestPathByName?node1=${dropdown1}&node2=${dropdown2}`)
      .then(response => response.json())
      .then(data => {
        let circleContainer = document.querySelector('.circle-container');
        if (circleContainer) {
          document.body.removeChild(circleContainer);
        }
        circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container');
        let prevNode = null;
        data.forEach(node => {
          if (node.properties.floor.low === floorNumber) {
            const nodeElement = createNodeElement(node);
            circleContainer.appendChild(nodeElement);

            if (prevNode) {
              const lineElement = createLineElement(prevNode, node);
              circleContainer.appendChild(lineElement);
            }
            prevNode = node;
          }
        });
        document.body.appendChild(circleContainer);

        //Call patient room number information and display it
        let room_number = dropdown2.split(' ')[1];
        if (dropdown2.split(' ')[0] === "Room") {
          handleGetPatientsByRoomNumber(room_number);
        }
      })
      .catch(error => console.error(error));
  };

  const handleGetPatientsByRoomNumber = (roomNumber) => {
    fetch(`http://localhost:3000/patients/${roomNumber}`)
      .then(response => response.json())
      .then(data => {
        //console.log(data);
        setPatientData(data);
      })
      .catch(error => console.error(error));
  };

  const handleFloorChange = () => {
    const dropdown1 = document.querySelector("#dropdown1").value;
    const dropdown2 = document.querySelector("#dropdown2").value;
    if (floorNumber === 0) {
      document.getElementById("floorplan-img").src = floorplan_gnd;
      handleGetAllNodes();
      if (dropdown1 !== dropdown2)
        handleShortestPathReq();
    } else if (floorNumber === 1) {
      document.getElementById("floorplan-img").src = floorplan_1st;
      handleGetAllNodes();
      if (dropdown1 !== dropdown2)
        handleShortestPathReq();
    }
  };


  // const handleKeyDown = (event) => {
  //   if (event.key === 'Enter') {
  //     handleShortestPathReq();
  //   }
  // };

  //Gets executed when opening the webpage
  window.onload = function () {
    handleGetAllNodes();
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <img className="logo" src={logo} alt="Logo" />
        <h1 className="product-name">Hospital Navigation</h1>
      </div>
      {/* Navigation Controls */}
      <div className="container">
        <div className="controls-container">
          <div>
            <label>From</label>
            <select id="dropdown1">
              {allNodeNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <label>To</label>
            <select id="dropdown2">
              {allNodeNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <button onClick={handleShortestPathReq}>Navigate</button>
            <button onClick={() => { handleGetAllNodes(); setPatientData(null); document.querySelector("#dropdown1").selectedIndex = 0; document.querySelector("#dropdown2").selectedIndex = 0; }}>New Navigation</button>
          </div>
          <div>
            <h2>Selected Floor: {floorNumber}</h2>
            <button onClick={() => setFloorNumber(0)}>0</button>
            <button onClick={() => setFloorNumber(1)}>1</button>
          </div>
        </div>
        {/* Floorplan */}
        <div className="floorplan-container">
          <img id="floorplan-img" className="floorplan-img" src={floorplan_gnd} alt="Hospital Floor Plan" onClick={handleClick} />
        </div>
        {/* Patient Data */}
        <div className="patient-data-container">
          <h2>Patient Data</h2>
          <p>Name: {patientData?.firstName} {patientData?.lastName}</p>
          <p>Age: {patientData?.age}</p>
          <p>Room: {patientData?.currentRoomNumber}</p>
        </div>
      </div>

      {point && (
        <div>
          <p>Clicked at ({point.x}, {point.y})</p>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p className="footer-text">Copyright © 2023 RoomNav</p>
      </div>
    </div>
  );
}

export default App;