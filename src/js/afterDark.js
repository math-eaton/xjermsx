import p5 from 'p5';

export function afterDark(containerId) {
  new p5((p) => {
    let skyline;
    let canvasDiv;
    let buildings = [];
    let stars = []; 
    let panSpeed = 1; // Speed at which the skyline pans
    let starPanSpeed = panSpeed * 0.1; // Stars pan at 5% of skyline speed
    let hasGap
    

    // Define a Building class
    class Building {
      constructor(x, width, height) {
        this.x = x;
        this.width = width;
        this.height = height;
        this.windowStates = [];
        this.horizontalSpacing = p.random(1.0, 2.0); // Random horizontal spacing
        this.verticalSpacing = p.random(5.5, 20.0); // Random vertical spacing
        this.hasGap = hasGap; // New property for gap
    
        // Initialize window states
        for (let i = 0; i < width; i++) {
          this.windowStates[i] = [];
          for (let j = 0; j < height; j++) {
            this.windowStates[i][j] = false; // Initially all windows are off
          }
        }
      }
    
      draw() {
      if (this.hasGap) {
        p.noStroke();
        p.fill(0); // Black color for the gap
        p.rect(this.x - 5, p.height - this.height, 10, this.height); // Draw a vertical black gap
        }
        // Draw building outline for debugging
        p.noFill();
        p.stroke(255, 0, 0); // Red outline
        p.rect(this.x, p.height - this.height, this.width, this.height);
    
        const windowSize = 0.5; // Size of a window

        // Loop through each window position
        for (let i = 0, winX = 0; winX < this.width; i++, winX += windowSize + this.horizontalSpacing) {
          for (let j = 0, winY = 0; winY < this.height; j++, winY += windowSize + this.verticalSpacing) {
            let windowX = this.x + winX; // Calculate X position of the window
            let windowY = p.height - this.height + winY; // Calculate Y position of the window
    
            if (windowX >= 0 && windowX < p.width && windowY >= 0 && windowY < p.height) { // Check if the window is within the canvas
              if (this.windowStates[i] && this.windowStates[i][j]) {
                // Use color coding for debugging
                let col = (i + j) % 2 === 0 ? p.color(255, 255, 255) : p.color(200, 190, 210); // Alternating colors
                p.set(windowX, windowY, col);
              }
            }
          }
        }
      }

      // Method to randomly update window states
      updateWindows() {
        for (let i = 0; i < this.width; i++) {
          for (let j = 0; j < this.height; j++) {
            if (p.random() < 0.005) { // Small chance to change state
              this.windowStates[i][j] = !this.windowStates[i][j];
            }
          }
        }
      }
    
      // Method to move the building horizontally
      pan(delta) {
        this.x -= delta;
      }
    }
    
    function updateScene() {
      // Update building windows
      buildings.forEach(building => {
        building.updateWindows();
      });
    
      // Update stars
      stars.forEach(star => {
        if (p.random() < 0.01) { // Small chance for each star to change state
          star.on = !star.on;
        }
      });
    }    

// Update the generateNewBuildings function
function generateNewBuildings() {
  // Define the start position for new buildings as just off the right edge of the canvas
  let startPosition = p.width;

  // Find the rightmost edge of the last building
  if (buildings.length > 0) {
    let lastBuilding = buildings[buildings.length - 1];
    startPosition = Math.max(startPosition, lastBuilding.x + lastBuilding.width);
  }

  // Generate new buildings starting from the startPosition
  while (startPosition - panSpeed <= p.width) {
    let buildingWidth = p.random(p.width * 0.05, p.width * 0.1);
    let buildingHeight = p.random(p.height * 0.15, p.height * 0.7);

    // Determine if this building should have a gap
    let hasGap = p.random() < 0.2; // 20% chance for a gap

    let newBuilding = new Building(startPosition, buildingWidth, buildingHeight, hasGap);
    buildings.push(newBuilding);

    startPosition += buildingWidth + (hasGap ? 50 : 0); // Add extra space for the gap
  }
}

    p.setup = () => {
      let containerDiv = document.getElementById(containerId);
      if (containerDiv) {
        let rect = containerDiv.getBoundingClientRect();
        // Ensure the container has a non-zero size
        if (rect.width > 0 && rect.height > 0) {
          p.createCanvas(rect.width, rect.height);
        } else {
          console.warn(`Container with id ${containerId} has zero size. Using fallback size.`);
          p.createCanvas(p.windowWidth, p.windowHeight);
        }
      } else {
        console.warn(`Div with id ${containerId} not found. Using fallback size.`);
        p.createCanvas(p.windowWidth, p.windowHeight);
      }
    
      canvasDiv = p.canvas.parentElement;
    
      // Generate buildings
      buildings = [];
      let x = 0;
      while (x < p.width) {
        let minWidth = p.width * 0.05; // Minimum building width
        let maxWidth = p.width * 0.1; // Maximum building width
        let buildingWidth = p.random(minWidth, maxWidth); // Random building width
        let minHeight = p.height * 0.15; // Minimum height as a percentage of screen height
        let maxHeight = p.height * 0.7; // Maximum height as a percentage of screen height
        let buildingHeight = p.random(minHeight, maxHeight); // Random building height
        buildings.push(new Building(x, buildingWidth, buildingHeight));
        x += buildingWidth;
      }
    
      // Find the height of the shortest building for reference
      let shortestBuildingHeight = Math.min(...buildings.map(b => b.height));
    
      // Create stars with gradient density
      p.loadPixels(); // Load the pixel buffer before setting pixels
      for (let i = 0; i < 1000; i++) {
        let starX = p.random(p.width);
        let starY = p.random(p.height - shortestBuildingHeight);
    
        // Calculate the likelihood of placing a star based on its vertical position
        let starDensityFactor = starY / (p.height - shortestBuildingHeight);
        if (p.random() < starDensityFactor) {
          p.set(starX, starY, p.color(50)); // Place a star with full brightness
        }
      }
      p.updatePixels(); // Update the pixel buffer after setting pixels
    
      // Initialize flickering stars
      stars = [];
      for (let i = 0; i < 1000; i++) {
        let x = p.random(p.width);
        let y = p.random(p.height - shortestBuildingHeight);
        let star = {
          x: x,
          y: y,
          on: false // Initially, all stars are off
        };
        stars.push(star);
      }
    
      // Draw skyline
      buildings.forEach(building => building.draw());
      p.updatePixels();
      // Call updateScene every second
      setInterval(updateScene, 100);
    };
    
    p.draw = () => {
      p.background(0);
      p.loadPixels();
  
      // Pan and draw buildings
      buildings.forEach(building => {
          building.pan(panSpeed);
          building.draw();
      });
  
      // Remove buildings that have moved off-screen and reposition them
      buildings = buildings.filter(building => {
          if (building.x + building.width < 0) {
              building.x += p.width + Math.max(...buildings.map(b => b.width));
              return true;
          }
          return building.x < p.width;
      });
  
      // Generate new buildings as needed
      generateNewBuildings();
  
      // Pan and draw stars
      stars.forEach(star => {
          star.x -= starPanSpeed;
          if (star.on) {
              let brightness = p.map(star.y, 0, p.height, 255, 50);
              p.set(star.x, star.y, p.color(brightness));
          }
      });
  
      // Wrap stars around
      stars.forEach(star => {
          if (star.x < 0) star.x += p.width;
      });
  
      p.updatePixels();
  };
      
        
    p.windowResized = () => {
      let containerDiv = document.getElementById(containerId);
      if (containerDiv) {
        let rect = containerDiv.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          p.resizeCanvas(rect.width, rect.height);
      }
      } else {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      }
    
      // Reinitialize and regenerate buildings
      buildings = [];
      let x = 0;
      while (x < p.width) {
        let minWidth = p.width * 0.05; // Adjusted for new canvas width
        let maxWidth = p.width * 0.01; // Adjusted for new canvas width
        let buildingWidth = p.random(minWidth, maxWidth);
        let minHeight = p.height * 0.15; // Adjusted for new canvas height
        let maxHeight = p.height * 0.4; // Adjusted for new canvas height
        let buildingHeight = p.random(minHeight, maxHeight);
        buildings.push(new Building(x, buildingWidth, buildingHeight));
        x += buildingWidth;
      }

      p.loadPixels(); // Load the pixel buffer

      // Redraw the buildings
      buildings.forEach(building => {
        building.draw();
      });
    
    
      // Redraw the buildings
      // Clear the canvas and set a black background
      p.background(0);

      // Reinitialize and regenerate stars
      let shortestBuildingHeight = Math.min(...buildings.map(b => b.height));
      for (let i = 0; i < 1000; i++) {
        let starX = p.random(p.width);
        let starY = p.random(p.height - shortestBuildingHeight);
        let starDensityFactor = 1 - (starY / (p.height - shortestBuildingHeight));
        if (p.random() < starDensityFactor) {
          let brightness = p.map(starY, 0, p.height - shortestBuildingHeight, 255, 150);
          p.set(starX, starY, p.color(brightness));
        }
      }
    
      p.updatePixels();

      // Reinitialize the skyline array
      skyline = new Array(p.width);
      for (let x = 0; x < p.width; x++) {
        skyline[x] = p.height - p.random(50, 100); // Adjust this if needed
      }
    
      // Redraw the skyline
      for (let x = 0; x < p.width; x++) {
        for (let y = skyline[x]; y < p.height; y++) {
          if (p.random() < 0.05) {
            p.set(x, y, p.random() < 0.5 ? p.color(255, 255, 0) : p.color(255));
          } else {
            p.set(x, y, p.color(0));
          }
        }
      }
    
      p.updatePixels();
    };
  });
};
