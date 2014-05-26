"use strict";

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

function makeLevels(tree) {
  var levels = [];
  var groups = [
    [tree]
  ];
  while (true) {
    groups = buildNextLevel(groups);
    if (groups.length == 0)
      break;
    levels.push(groups);
  }
  return levels;
}

function treeToDiagram(tree, diagram) {
  var levels = makeLevels(tree);

  var groupGapRatio = 0.8;
  var nodeGapRatio = .33;
  var levelsGapRatio = 1.4;

  // Find which level should be fixed.
  var longestWidth = - 1;
  var fixedLevel = - 1;
  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {

    var level = levels[levelIdx];
    var width = 0;
    var groupSpacing = 0;
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      width += groupSpacing;
      var group = level[memberIdx];
      width += group.length;
      width += (group.length - 1) * nodeGapRatio;
      groupSpacing = groupGapRatio;
    }
    if (width > longestWidth) {
      longestWidth = width;
      fixedLevel = levelIdx;
    }
  }


  // Position
  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    var y = levelIdx * (1 + levelsGapRatio);
    var x = 0;
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      var nodeSpacing = 0;
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        x += nodeSpacing;
        var node = group[nodeIdx];
        node.x = x;
        node.y = y;
        x += 1;
        nodeSpacing = nodeGapRatio;
      }
      x += groupGapRatio;
    }
  }


  // Find height ratio
  var height = levels.length + (levels.length - 1) * levelsGapRatio;

  var style = window.getComputedStyle(diagram);
  var diagramWidth = Number.parseInt(style.width);
  var diagramHeight = Number.parseInt(style.height);

  var xMultiplier = diagramWidth / longestWidth;
  var yMultiplier = diagramHeight / height;


  var svgns = "http://www.w3.org/2000/svg";

  // Render
  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        var rect = document.createElementNS(svgns, "rect");
        rect.setAttribute("x", Math.floor(node.x * xMultiplier) + "px");
        rect.setAttribute("y", Math.floor(node.y * yMultiplier) + "px");
        rect.setAttribute("width", Math.floor(xMultiplier) + "px");
        rect.setAttribute("height", Math.floor(yMultiplier) + "px");
        diagram.appendChild(rect);
        if (levelIdx > 0) {
          var parent = node.parent;
          var parentOffset = (nodeIdx + 1) / (group.length + 1);
          var line = document.createElementNS(svgns, "line");
          line.setAttribute("x1", Math.floor((node.x +.5) * xMultiplier) + "px");
          line.setAttribute("y1", Math.floor(node.y * yMultiplier) + "px");
          line.setAttribute("x2", Math.floor((parent.x + parentOffset) * xMultiplier) + "px");
          line.setAttribute("y2", Math.floor((parent.y + 1) * yMultiplier) + "px");
          diagram.appendChild(line);
        }
      }
    }
  }


}