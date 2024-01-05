// import "../css/style.css";
import { afterDark } from "./afterDark.js";
import { afterDark3D } from "./afterDark3D.js";
import { asciiShader } from "./ascii_shader.js";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const asciiModule = asciiShader("asciiContainer1");


function switchModule(moduleName) {
  // Hide all containers
  document.getElementById('skylineContainer1').style.display = 'none';
  document.getElementById('skyline3DContainer1').style.display = 'none';
  document.getElementById('asciiContainer1').style.display = 'none';

  // Clear containers to ensure canvases are removed
  document.getElementById('skylineContainer1').innerHTML = '';
  document.getElementById('skyline3DContainer1').innerHTML = '';
  document.getElementById('asciiContainer1').innerHTML = '';

  // Activate the selected module and show its container
  switch (moduleName) {
    case 'afterDark':
      afterDark("skylineContainer1");
      document.getElementById('skylineContainer1').style.display = 'block';
      break;
    case 'afterDark3D':
      afterDark3D("skyline3DContainer1");
      document.getElementById('skyline3DContainer1').style.display = 'block';
      break;
    case 'asciiShader':
      asciiShader("asciiContainer1");
      document.getElementById('asciiContainer1').style.display = 'block';
      break;
    default:
      console.error("Unknown module:", moduleName);
  }

    // Show shape buttons if asciiShader is selected, hide otherwise
    const shapeButtons = document.getElementById('shapeButtons');
    if (moduleName === 'asciiShader') {
      shapeButtons.style.display = 'block';
      console.log("Shape buttons should now be visible.");
    } else {
      shapeButtons.style.display = 'none';
      console.log("Shape buttons should now be hidden.");
    }
}

window.onload = () => {
  // Initialize the first module or keep all modules inactive initially
  switchModule('asciiShader');
};

document.getElementById('btnAfterDark').addEventListener('click', () => switchModule('afterDark'));
document.getElementById('btnAfterDark3D').addEventListener('click', () => switchModule('afterDark3D'));
document.getElementById('btnAsciiShader').addEventListener('click', () => switchModule('asciiShader'));
// document.getElementById('btnHeart').addEventListener('click', () => asciiModule.switchShape(createHeart()));
// document.getElementById('btnSphere').addEventListener('click', () => asciiModule.switchShape(createSphere()));
// document.getElementById('btnTorus').addEventListener('click', () => asciiModule.switchShape(createTorus()));


// window resizing

window.addEventListener('resize', handleResize);

function handleResize() {
  // Update container sizes
  const containers = [document.getElementById('skylineContainer1'), 
                      document.getElementById('skyline3DContainer1'), 
                      document.getElementById('asciiContainer1')];
  
  containers.forEach(container => {
    if (container.style.display !== 'none') {
      // Set the container size based on its parent or some other logic
      container.style.width = '100%'; // Example: Set width to 100% of the parent
      container.style.height = 'auto'; // Example: Set height automatically

      // Call resize functions for active visualizations
      if (container.id === 'skylineContainer1' && afterDark.resize) {
        afterDark.resize();
      } else if (container.id === 'skyline3DContainer1' && afterDark3D.resize) {
        afterDark3D.resize();
      } else if (container.id === 'asciiContainer1' && asciiShader.resize) {
        asciiShader.resize();
      }
    }
  });
}

console.log("OK")

// // cursor trails
// document.addEventListener("mousemove", function (e) {
//   // Function to check if the element or its parent has the specified class
//   function hasClass(element, className) {
//     while (element) {
//       if (element.classList && element.classList.contains(className)) {
//         return true;
//       }
//       element = element.parentElement;
//     }
//     return false;
//   }

//   // Get the element under the cursor
//   let elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);

//   // Check for the 'crosshair' class, and if found, do nothing (no trail)
//   if (hasClass(elementUnderCursor, "crosshair")) {
//     return; // Exit the function, no trail is created
//   }

//   let trail = document.createElement("div");
//   trail.className = "cursor-trail";

//   // Check for the 'text' class
//   if (hasClass(elementUnderCursor, "text")) {
//     return; // Exit the function, no trail is created
//   } else if (hasClass(elementUnderCursor, "pointer")) {
//     trail.classList.add("pointer-cursor-trail"); // Add specific trail class for pointer
//   } else {
//     trail.classList.add("default-cursor-trail"); // Default trail class for others
//   }

//   // Adjust positioning based on cursor size
//   trail.style.left = e.pageX + 1 + "px"; // Adjust for half the width of the cursor
//   trail.style.top = e.pageY - 2 + "px"; // Adjust for half the height of the cursor

//   document.body.appendChild(trail);

//   setTimeout(() => {
//     trail.remove();
//   }, 30000); // Remove trail element after N ms
// });

// // Function to remove all cursor trails
// function removeAllCursorTrails() {
//   const trails = document.querySelectorAll(".cursor-trail");
//   trails.forEach((trail) => trail.remove());
// }

// export to pdf

function exportContainerToPDF(containerId, filename) {
  const container = document.getElementById(containerId);

  html2canvas(container).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
      });

      // Calculate the ratio to fit the image to the page
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;
      const ratio = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);

      const scaledWidth = imageWidth * ratio;
      const scaledHeight = imageHeight * ratio;

      // Center the image on the page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      // Add image to PDF
      doc.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);
      doc.save(filename);
  });
}

console.log('Attaching event listener');

function getActiveContainerId() {
  // Logic to determine which container is currently active
  // For example, checking which container is currently visible
  if (document.getElementById('skylineContainer1').style.display !== 'none') {
    return 'skylineContainer1';
  } else if (document.getElementById('skyline3DContainer1').style.display !== 'none') {
    return 'skyline3DContainer1';
  } else if (document.getElementById('asciiContainer1').style.display !== 'none') {
    return 'asciiContainer1';
  }
  return null; // or a default container ID
}

const exportButton = document.getElementById('exportPDF');
console.log(exportButton); // Check if this logs null or the actual element
if (exportButton) {
  exportButton.addEventListener('click', function() {
    console.log("Button clicked");
    // Determine which container is currently active/visible
    const activeContainerId = getActiveContainerId();
    exportContainerToPDF(activeContainerId, 'capture.pdf');
    console.log("exporting")  
  });
} else {
  console.error('Export button not found');
}

document.addEventListener('DOMContentLoaded', (event) => {
  console.log('Script loaded');
  // Comment out other code for testing
});
