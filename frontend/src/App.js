import React, { useState } from 'react';
import './App.css';
import floorplan from './floorplan.svg';
import circleImg from './circle.png';

function App() {
  const [point, setPoint] = useState(null);

  const handleClick = (event) => {
    const pointX = event.nativeEvent.offsetX;
    const pointY = event.nativeEvent.offsetY;
    setPoint({ x: pointX, y: pointY });
  };

  //Create a node element on the floorplan
  const createNodeElement = (node) => {
    const circle = document.createElement('img');
    const circleDiameter = 40;
    circle.style.position = 'absolute';
    circle.style.left = `${node.properties.x.low - circleDiameter / 2}px`;
    circle.style.top = `${node.properties.y.low - circleDiameter / 2}px`;
    circle.style.width = `${circleDiameter}px`;
    circle.style.height = `${circleDiameter}px`;
    circle.setAttribute('src', circleImg);
    circle.classList.add('circle-class');

    const nodeText = document.createElement('div');
    nodeText.textContent = node.properties.name;
    nodeText.style.position = 'absolute';
    nodeText.style.top = `${node.properties.y.low - 50}px`;
    nodeText.style.left = `${node.properties.x.low - 40}px`;
    nodeText.style.width = '80px';
    nodeText.style.textAlign = 'center';

    const nodeContainer = document.createElement('div');
    nodeContainer.appendChild(circle);
    nodeContainer.appendChild(nodeText);
    return nodeContainer;
  };

  //Create a line between nodes
  const createLineElement = (prevNode, node) => {
    const line = document.createElement('img');
    const dx = node.properties.x.low - prevNode.properties.x.low;
    const dy = node.properties.y.low - prevNode.properties.y.low;
    const distance = Math.sqrt(dx * dx + dy * dy);
    line.style.position = 'absolute';
    line.style.left = `${prevNode.properties.x.low}px`;
    line.style.top = `${prevNode.properties.y.low}px`;
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
        console.log(data);
        let circleContainer = document.querySelector('.circle-container');
        if (circleContainer) {
          document.body.removeChild(circleContainer);
        }
        circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container');
        let nodeNames = [];
        data.forEach(node => {
          const nodeElement = createNodeElement(node);
          circleContainer.appendChild(nodeElement);
          nodeNames.push(node.properties.name);
        });
        document.body.appendChild(circleContainer);
        setNodeNames(nodeNames);
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
        console.log(data);
        let circleContainer = document.querySelector('.circle-container');
        if (circleContainer) {
          document.body.removeChild(circleContainer);
        }
        circleContainer = document.createElement('div');
        circleContainer.classList.add('circle-container');
        let prevNode = null;
        data.forEach(node => {
          const nodeElement = createNodeElement(node);
          circleContainer.appendChild(nodeElement);

          if (prevNode) {
            const lineElement = createLineElement(prevNode, node);
            circleContainer.appendChild(lineElement);
          }
          prevNode = node;
        });
        document.body.appendChild(circleContainer);
      })
      .catch(error => console.error(error));
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
      <img src={floorplan} alt="Hospital Floor Plan" onClick={handleClick} />

      <div className="controls-container">
        {/*For accessing: const dropdown1 = document.getElementById('dropdown1');*/}
        <label>From</label>
        <select id="dropdown1">
          {nodeNames.map((nodeName, index) => (
            <option key={index} value={nodeName}>{nodeName}</option>
          ))}
        </select>
        <label>To</label>
        <select id="dropdown2">
          {nodeNames.map((nodeName, index) => (
            <option key={index} value={nodeName}>{nodeName}</option>
          ))}
        </select>
        <button onClick={handleShortestPathReq}>Navigate</button>
        <button onClick={handleGetAllNodes}>New Navigation</button>
      </div>

      {point && (
        <div>
          <p>Clicked at ({point.x}, {point.y})</p>
        </div>
      )}
    </div>
  );
}

export default App;
