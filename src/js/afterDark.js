import p5 from 'p5';

export function afterDark(containerId) {
  new p5((p) => {
    let skyline;
    let canvasDiv;
    let buildings = [];
    let stars = []; 

    // Define a Building class
    class Building {
      constructor(x, width, height) {
        this.x = x;
        this.width = width;
        this.height = height;
        this.windowStates = []; // Array to store the state of each window
        for (let i = 0; i < width; i++) {
          this.windowStates[i] = [];
          for (let j = 0; j < height; j++) {
            this.windowStates[i][j] = false; // Initially all windows are off
          }
        }
      }
    
      draw() {
        let windowSize = 1;
        let windowSpacing = 5;
        for (let i = 0; i < this.width; i += windowSize + windowSpacing) {
          for (let j = 0; j < this.height; j += windowSize + windowSpacing) {
            let windowX = this.x + i;
            let windowY = p.height - this.height + j;
            if (this.windowStates[i][j]) {
              p.set(windowX, windowY, p.color(255, 255, 0)); // Window is on
            }
          }
        }
      }
    
      // Method to randomly update window states
      updateWindows() {
        for (let i = 0; i < this.width; i++) {
          for (let j = 0; j < this.height; j++) {
            if (p.random() < 0.01) { // Small chance to change state
              this.windowStates[i][j] = !this.windowStates[i][j];
            }
          }
        }
      }
    }

    function updateScene() {
      // Update building windows
      buildings.forEach(building => {
        building.updateWindows();
      });
    
      // Update stars
      stars.forEach(star => {
        if (p.random() < 0.05) { // Small chance for each star to change state
          star.on = !star.on;
        }
      });
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
        let minWidth = p.width * 0.1; // Minimum building width
        let maxWidth = p.width * 0.01; // Maximum building width
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
          p.set(starX, starY, p.color(255)); // Place a star with full brightness
        }
      }
      p.updatePixels(); // Update the pixel buffer after setting pixels
    
      // Initialize flickering stars
      stars = [];
      for (let i = 0; i < 10000; i++) {
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
      p.loadPixels(); // Load the pixel buffer
    
      // Draw buildings
      buildings.forEach(building => {
        building.draw();
      });
    
      // Draw stars
      stars.forEach(star => {
        if (star.on) {
          let brightness = p.map(star.y, 0, p.height, 255, 150); // Brightness based on y position
          p.set(star.x, star.y, p.color(brightness));
        }
      });
    
      p.updatePixels(); // Update the pixel buffer
    };
    
    
    p.windowResized = () => {
      let containerDiv = document.getElementById(containerId);
      if (containerDiv) {
        let rect = containerDiv.getBoundingClientRect();
        p.resizeCanvas(rect.width, rect.height);
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
      for (let i = 0; i < 10000; i++) {
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
