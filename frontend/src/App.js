import React, { useState } from 'react';
import './App.css';
import floorplan from './floorplan.svg';
import circleImg from './circle.png';

function App() {
  const [point, setPoint] = useState(null);
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const handleClick = (event) => {
    const pointX = event.nativeEvent.offsetX;
    const pointY = event.nativeEvent.offsetY;
    setPoint({ x: pointX, y: pointY });
  };

  const handleInputChange = (event) => {
    if (event.target.name === 'input1') {
      setInput1(event.target.value);
    } else if (event.target.name === 'input2') {
      setInput2(event.target.value);
    }
  };

 //Shortest Path handle get request
 const handleSendRequest = () => {
  fetch(`http://localhost:3000/shortestPath?node1=${input1}&node2=${input2}`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      let circleContainer = document.querySelector('.circle-container');
      if (circleContainer) { //remove old div if it exists
        document.body.removeChild(circleContainer);
      }
      circleContainer = document.createElement('div');
      circleContainer.classList.add('circle-container'); // add CSS class to the container
      let prevNode = null;
      data.forEach(node => { //Create a circle around the coordinates of each node
        const circle = document.createElement('img');
        const circleDiameter = 40;
        circle.style.position = 'absolute';
        circle.style.left = `${node.properties.x.low - circleDiameter / 2}px`;  //Subtracting half of the diameter because the coordinate is measured at the top left if the image
        circle.style.top = `${node.properties.y.low - circleDiameter / 2}px`;   //Subtracting half of the diameter because the coordinate is measured at the top left if the image
        circle.style.width = `${circleDiameter}px`;
        circle.style.height = `${circleDiameter}px`;
        circle.setAttribute('src', circleImg);
        circle.classList.add('circle-class');
        
        // Create a div to hold the name of the node
        const nodeText = document.createElement('div');
        nodeText.textContent = node.properties.name;
        nodeText.style.position = 'absolute';
        nodeText.style.top = `${node.properties.y.low - 50}px`; 
        nodeText.style.left = `${node.properties.x.low - 40}px`; 
        nodeText.style.width = '80px';
        nodeText.style.textAlign = 'center';
        
        circleContainer.appendChild(circle);
        circleContainer.appendChild(nodeText);
        
        if (prevNode) {
          //Create a line between the previous node and the current node
          const line = document.createElement('img');
          const dx = node.properties.x.low - prevNode.properties.x.low;
          const dy = node.properties.y.low - prevNode.properties.y.low;
          const distance = Math.sqrt(dx*dx + dy*dy);
          line.style.position = 'absolute';
          line.style.left = `${prevNode.properties.x.low}px`;
          line.style.top = `${prevNode.properties.y.low}px`;
          line.style.width = `${distance}px`;
          line.style.height = '5px';
          line.style.backgroundColor = 'black';
          line.style.transformOrigin = '0% 50%';
          const angle = Math.atan2(dy, dx) * 180 / Math.PI; //returns the angle in radians between the positive x-axis and the point (x, y)
          line.style.transform = `rotate(${angle}deg)`; //convert to degrees for the transform
          circleContainer.appendChild(line);
        }
        prevNode = node;
      });
      document.body.appendChild(circleContainer); // append the container to the body or any other element
    })
    .catch(error => console.error(error));
};


const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    handleSendRequest();
  }
};

  return (
    <div>
      <img src={floorplan} alt="Hospital Floor Plan" onClick={handleClick} />
      {point && (
        <div>
          <p>Clicked at ({point.x}, {point.y})</p>
        </div>
      )}
      <input name="input1" value={input1} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      <input name="input2" value={input2} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      <button onClick={handleSendRequest}>Send Request</button>
    </div>
  );
}

export default App;
