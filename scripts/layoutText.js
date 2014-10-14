"use strict";

// Splits all the strings in the array by the specified character, without
// removing that character from the strings. Returns an array of all the split
// strings.
function splitBy(array, char) {
  var out = [];
  for (var i = 0; i != array.length; i++) {
    var word = array[i];
    var split = word.split(char);
    for (var j = 0; j != split.length - 1; j++) {
      out.push(split[j] + char);
    }
    out.push(split[j]);
  }
  return out;
}

// Creates text arranged in rows, with the maximum specified width and height,
// centered around the 'x' coordinate, and with the specified line spacing.
// Adds to the specified text node.
function layoutText(textNode, text, width, x, height, dy) {
  var namespace = "http://www.w3.org/2000/svg";
  var previousFit = "";
  var tspan = document.createElementNS(namespace, "tspan");
  tspan.setAttributeNS(null, "x", x);
  textNode.appendChild(tspan);
  tspan.textContent = "!";
  height -= dy;
  tspan.textContent = "";

  var firstTspan = tspan;

  // Split by split characters.
  var words = splitBy(text.split(/\s/));
  var splitChars = ".-";
  for (var j = 0; j != splitChars.length; j++)
    words = splitBy(words, splitChars[j]);

  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (tspan.textContent &&
        splitChars.indexOf(tspan.textContent[tspan.textContent.length - 1]) == -1)
      tspan.textContent += " ";
    tspan.textContent += word;

    if (tspan.getComputedTextLength() > width) {
      if (previousFit) {
        tspan.textContent = previousFit;
        if (height < dy)
          break;
        height -= dy;
        tspan = document.createElementNS(namespace, "tspan");
        tspan.setAttributeNS(null, "x", x);
        tspan.setAttributeNS(null, "dy", dy);
      }
      tspan.textContent = word;

      textNode.appendChild(tspan);
      while (tspan.getComputedTextLength() > width) {
        tspan.textContent =
            tspan.textContent.substring(0, tspan.textContent.length - 1);
      }
    }
    previousFit = tspan.textContent;
  }

  var baselineShift = -2;
  firstTspan.setAttributeNS(null, "dy", dy + baselineShift + height / 2);
}
