/* Additional helper function to convert SVG to PNG for browsers that don't support SVG favicons */
function svgToFavicon(svg) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  
  // Create an image element
  const img = document.createElement('img');
  img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
  
  // When the image loads, draw it on the canvas
  img.onload = function() {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    
    // Convert the canvas to a data URL and set it as the favicon
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.querySelector('link[rel="alternate icon"]');
    if (link) {
      link.href = dataUrl;
    }
  };
}

// This script can be used if needed for fallback support