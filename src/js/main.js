// import "../css/style.css";
// import { afterDark } from "./afterDark.js";
import { afterDark3D } from "./afterDark3D.js";

window.onload = () => {
  // afterDark("skylineContainer1");
  afterDark3D("skyline3DContainer1");
};

// cursor trails
document.addEventListener("mousemove", function (e) {
  // Function to check if the element or its parent has the specified class
  function hasClass(element, className) {
    while (element) {
      if (element.classList && element.classList.contains(className)) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }

  // Get the element under the cursor
  let elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);

  // Check for the 'crosshair' class, and if found, do nothing (no trail)
  if (hasClass(elementUnderCursor, "crosshair")) {
    return; // Exit the function, no trail is created
  }

  let trail = document.createElement("div");
  trail.className = "cursor-trail";

  // Check for the 'text' class
  if (hasClass(elementUnderCursor, "text")) {
    return; // Exit the function, no trail is created
  } else if (hasClass(elementUnderCursor, "pointer")) {
    trail.classList.add("pointer-cursor-trail"); // Add specific trail class for pointer
  } else {
    trail.classList.add("default-cursor-trail"); // Default trail class for others
  }

  // Adjust positioning based on cursor size
  trail.style.left = e.pageX + 1 + "px"; // Adjust for half the width of the cursor
  trail.style.top = e.pageY - 2 + "px"; // Adjust for half the height of the cursor

  document.body.appendChild(trail);

  setTimeout(() => {
    trail.remove();
  }, 30000); // Remove trail element after N ms
});

// Function to remove all cursor trails
function removeAllCursorTrails() {
  const trails = document.querySelectorAll(".cursor-trail");
  trails.forEach((trail) => trail.remove());
}