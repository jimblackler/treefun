"use strict";

/*
 Tree Generator copyright Jim Blackler 2014. All enquiries jimblackler@gmail.com

 Tree Generator is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 */

function buildNextLevel(groups) {
  var groupsOut = [];
  for (var groupIdx = 0; groupIdx != groups.length; groupIdx++) {
    var group = groups[groupIdx];

    for (var memberIdx = 0; memberIdx != group.length; memberIdx++) {
      var member = group[memberIdx];
      if (!member.children.length)
        continue;
      groupsOut.push(member.children);
    }
  }
  return groupsOut;
}

// Converts the tree structure into an array of levels 0... n of cousin and
// sibling nodes.
function makeLevels(tree, drawRoot) {

  var groups = [];
  if (drawRoot) {
    groups.push([tree]);
  } else {
    var group = tree.children;
    for (var memberIdx = 0; memberIdx != group.length; memberIdx++)
      groups.push([group[memberIdx]]);
  }

  var levels = [];
  while (true) {
    levels.push(groups);
    groups = buildNextLevel(groups);
    if (groups.length == 0)
      break;
  }
  return levels;
}

// Sweep from the left to the right along a level, moving nodes along the row
// if they overlap with a previous node, or the edge of the diagram area.
function sweepLeftToRight(level, infield, outfield, options) {
  var minX = 0;
  for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
    var group = level[memberIdx];
    for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
      var node = group[nodeIdx];
      var newX;
      if (infield in node && node[infield] > minX)
        newX = node[infield];
      else
        newX = minX;
      if (nodeIdx == group.length - 1)
        minX = newX + 1 + options.minimumCousinGap;
      else
        minX = newX + 1 + options.siblingGap;
      node[outfield] = newX;
    }
  }
}

// Sweep from the right to the left along a level, moving nodes along the row
// if they overlap with a previous node, or the edge of the diagram area
// (specified).
function sweepRightToLeft(level, infield, outfield, maxWidth, options) {
  var maxX = maxWidth - 1;
  for (var memberIdx = level.length - 1; memberIdx >= 0; memberIdx--) {
    var group = level[memberIdx];
    for (var nodeIdx = group.length - 1; nodeIdx >= 0; nodeIdx--) {
      var node = group[nodeIdx];
      var newX;
      if (infield in node && node[infield] < maxX)
        newX = node[infield];
      else
        newX = maxX;
      if (nodeIdx == 0)
        maxX = newX - 1 - options.minimumCousinGap;
      else
        maxX = newX - 1 - options.siblingGap;
      node[outfield] = newX;
    }
  }
}

// Positions the nodes on a level in a position that is guaranteed not to
// overlap with other nodes on that level, but as close as possible to the
// ideal position (if one is set).
function sweepAndAverage(level, maxWidth, options) {
  sweepLeftToRight(level, "x", "x0", options);
  sweepRightToLeft(level, "x0", "x0", maxWidth, options);
  sweepRightToLeft(level, "x", "x1", maxWidth, options);
  sweepLeftToRight(level, "x1", "x1", options);
  for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
    var group = level[memberIdx];
    for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
      var node = group[nodeIdx];
      node.x = (node.x0 + node.x1) / 2;
    }
  }
}

// Converts the specified tree to a diagram under diagramGroup in the SVG
// diagramSvg. Options are configured in the specified options object.
function treeToDiagram(tree, diagramSvg, diagramGroup, options) {
  var levels = makeLevels(tree, options.drawRoot);

  // Decide which level should be fixed.
  var fixedLevel = -1;
  var spacings = [];
  var widths = [];

  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    var spacing = 0;
    var nodesWidth = 0;
    var groupSpacing = 0;
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      spacing += groupSpacing;
      var group = level[memberIdx];
      nodesWidth += group.length;
      spacing += (group.length - 1) * options.siblingGap;
      groupSpacing = options.minimumCousinGap;
    }
    var width = spacing + nodesWidth;
    if (fixedLevel == -1 || width > widths[fixedLevel])
      fixedLevel = levelIdx;
    widths.push(width);
    spacings.push(spacing);
  }

  var maxWidth = Math.max(widths[fixedLevel],
          options.minimumBreadth * (1 + options.levelsGap))

  // Position and make elements
  var level = levels[fixedLevel];

  // Use any extra space to increase group gap up to ideal gap...
  var usesiblingGap = options.siblingGap;
  var spare = (maxWidth - widths[fixedLevel]);
  var useCousinGap = options.minimumCousinGap;
  if (level.length > 1) {
    var spareForGroupGaps = Math.min(spare / (level.length - 1),
        (options.idealCousinGap - options.minimumCousinGap));
    spare -= spareForGroupGaps * (level.length - 1);
    useCousinGap += spareForGroupGaps;
  }
  // ... any left is used to center the fixed group.
  var x = spare / 2;

  for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
    var group = level[memberIdx];
    var nodeSpacing = 0;
    for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
      x += nodeSpacing;
      var node = group[nodeIdx];
      node.x = x;
      x += 1;
      nodeSpacing = usesiblingGap;
    }
    x += useCousinGap;
  }

  // Fixed to top; parent to average of children.
  for (var levelIdx = fixedLevel - 1; levelIdx >= 0; levelIdx--) {
    var level = levels[levelIdx];
    // Find positions
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        if (node.children.length == 0)
          continue;
        var totalX = 0;
        for (var childIdx = 0; childIdx != node.children.length; childIdx++) {
          var child = node.children[childIdx];
          totalX += child.x;
        }
        node.x = totalX / node.children.length;
      }
    }
    sweepAndAverage(level, maxWidth, options);
  }

  // Second level to bottom; children distributed under parent.
  for (var levelIdx = fixedLevel + 1; levelIdx < levels.length; levelIdx++) {
    var level = levels[levelIdx];
    // Find positions
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      var parent = group[0].parent;

      var groupWidth = (group.length - 1) * (1 + options.idealSiblingGap);
      var x = parent.x - groupWidth / 2;
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        node.x = x;
        x += 1 + options.idealSiblingGap;
      }
    }
    sweepAndAverage(level, maxWidth, options);
  }

  // Now render the tree.
  diagramSvg.getElementById("arrowHead").setAttribute(
      "markerHeight", options.arrowHeadSize);

  // Find height ratio
  var useLevels = Math.max(levels.length, options.minimumDepth);
  var height = useLevels + (useLevels - 1) * options.levelsGap;

  var xAttribute;
  var yAttribute;
  var widthAttribute;
  var heightAttribute;

  if (options.flipXY) {
    xAttribute = "y";
    yAttribute = "x";
    widthAttribute = "height";
    heightAttribute = "width";
  } else {
    xAttribute = "x";
    yAttribute = "y";
    widthAttribute = "width";
    heightAttribute = "height";
  }

  diagramSvg.style.width = options.width + "px";
  diagramSvg.style.height = options.height + "px";

  var diagramWidth = options[widthAttribute];
  var diagramHeight = options[heightAttribute];

  var xMultiplier = diagramWidth / maxWidth;
  var yMultiplier = diagramHeight / height;

  // Add visual elements.
  var namespace = "http://www.w3.org/2000/svg";
  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];

        var rect = document.createElementNS(namespace, "rect");
        diagramGroup.appendChild(rect);

        var yValue = levelIdx * (1 + options.levelsGap);

        rect.setAttribute(xAttribute, Math.floor(node.x * xMultiplier) + "px");
        rect.setAttribute(yAttribute, Math.floor(yValue * yMultiplier) + "px");
        rect.setAttribute(widthAttribute, Math.floor(xMultiplier) + "px");
        rect.setAttribute(heightAttribute, Math.floor(yMultiplier) + "px");

        var text = document.createElementNS(namespace, "text");
        diagramGroup.appendChild(text);

        // Arrange text; method is different for horizontal diagrams.
        if (options.flipXY) {
          var xPos = Math.floor(node.x * xMultiplier);
          var yPos = Math.floor((yValue + 0.5) * yMultiplier);
          text.setAttribute(xAttribute, xPos + "px");
          text.setAttribute(yAttribute,
                  Math.floor(yValue * yMultiplier) + "px");

          layoutText(text, node.label, yMultiplier - options.labelPadding, yPos,
              xMultiplier, options.labelLineSpacing);
        } else {
          var xPos = Math.floor((node.x + 0.5) * xMultiplier);
          text.setAttribute(xAttribute, xPos + "px");
          text.setAttribute(yAttribute, Math.floor(yValue * yMultiplier) +
              "px");
          layoutText(text, node.label, xMultiplier - options.labelPadding, xPos,
              yMultiplier, options.labelLineSpacing);
        }

        if (levelIdx == 0)
          continue;  // Level 0 nodes don't have parents.

        // Draw lines to parents.
        node.line = document.createElementNS(namespace, "line");
        diagramGroup.appendChild(node.line);
        var parentOffset = (nodeIdx + 1) / (group.length + 1);
        var line = node.line;
        var parentY = (levelIdx - 1) * (1 + options.levelsGap);
        var first;
        var second;
        if (options.arrowsUp) {
          first = "2";
          second = "1";
        } else {
          first = "1";
          second = "2";
        }
        line.setAttribute(xAttribute + first,
                Math.floor((node.parent.x + parentOffset) * xMultiplier) +
                "px");
        line.setAttribute(yAttribute + first,
                Math.floor((parentY + 1) * yMultiplier) + "px");
        line.setAttribute(xAttribute + second,
                Math.floor((node.x + .5) * xMultiplier) + "px");
        line.setAttribute(yAttribute + second,
                Math.floor(yValue * yMultiplier) + "px");

        line.setAttribute("marker-end", "url(#arrowHead)");
      }
    }
  }


}