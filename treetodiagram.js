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
    levels.push(groups);
    groups = buildNextLevel(groups);
    if (groups.length == 0)
      break;
  }
  return levels;
}

function treeToDiagram(tree, diagram) {
  var levels = makeLevels(tree);

  var groupGapRatio = 0.35;
  var nodeGapRatio = 0.10;
  var levelsGapRatio = 1.8;

  // Find which level should be fixed.
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
      spacing += (group.length - 1) * nodeGapRatio;
      groupSpacing = groupGapRatio;
    }
    var width = spacing + nodesWidth;
    if (fixedLevel == -1 || width > widths[fixedLevel]) {
      fixedLevel = levelIdx;
    }
    widths.push(width);
    spacings.push(spacing);
  }


  // Position and make elements
  var levelIdx = fixedLevel;
  var level = levels[levelIdx];

  var x = 0;
  var useGroupGapRatio = groupGapRatio;
  if (levelIdx != fixedLevel) {
    var spare = widths[fixedLevel] - widths[levelIdx];
    var extra = spare / (level.length + 1);
    useGroupGapRatio += extra;
    x += extra;
  }
  var namespace = "http://www.w3.org/2000/svg";
  for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
    var group = level[memberIdx];
    var nodeSpacing = 0;
    for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
      x += nodeSpacing;
      var node = group[nodeIdx];
      node.x = x;
      x += 1;
      nodeSpacing = nodeGapRatio;
    }
    x += useGroupGapRatio;
  }

  // Find height ratio
  var height = levels.length + (levels.length - 1) * levelsGapRatio;

  var style = window.getComputedStyle(diagram);
  var diagramWidth = Number.parseInt(style.width);
  var diagramHeight = Number.parseInt(style.height);

  var xMultiplier = diagramWidth / widths[fixedLevel];
  var yMultiplier = diagramHeight / height;

  function sweepLeftToRight(level, infield, outfield) {
    var minX = 0;
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        var newX;
        if (infield in node && node[infield] > minX) {
          newX = node[infield];
        } else {
          newX = minX;
        }
        if (nodeIdx == group.length - 1)
          minX = newX + 1 + groupGapRatio;
        else
          minX = newX + 1 + nodeGapRatio;
        node[outfield] = newX;
      }
    }
  }


  function sweepRightToLeft(level, infield, outfield) {
    var maxX = widths[fixedLevel] - 1;
    for (var memberIdx = level.length - 1; memberIdx >= 0; memberIdx--) {
      var group = level[memberIdx];
      for (var nodeIdx = group.length - 1; nodeIdx >= 0; nodeIdx--) {
        var node = group[nodeIdx];
        var newX;
        if (infield in node && node[infield] < maxX) {
          newX = node[infield];
        } else {
          newX = maxX;
        }
        if (nodeIdx == 0)
          maxX = newX - 1 - groupGapRatio;
        else
          maxX = newX - 1 - nodeGapRatio;
        node[outfield] = newX;
      }
    }
  }

function sweepAndAverage() {
  sweepLeftToRight(level, "x", "x0");
  sweepRightToLeft(level, "x0", "x0");
  sweepRightToLeft(level, "x", "x1");
  sweepLeftToRight(level, "x1", "x1");
  for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
    var group = level[memberIdx];
    for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
      var node = group[nodeIdx];
      node.x = (node.x0 + node.x1) / 2;
    }
  }
}

  // Fixed to top, parent to average of children.
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
    sweepAndAverage();
  }

  // Second level to bottom, children distributed under parent
  for (var levelIdx = fixedLevel + 1; levelIdx < levels.length; levelIdx++) {
    var level = levels[levelIdx];
    // Find positions
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      var parent = group[0].parent;

      var useNodeGapRatio = nodeGapRatio * 3;
      var groupWidth = (group.length - 1) * (1 + useNodeGapRatio);
      var x = parent.x - groupWidth / 2;
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        node.x = x;
        x += 1 + useNodeGapRatio;
      }
    }
    sweepAndAverage();
  }


  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        if (!("rect" in node)) {
          node.rect = document.createElementNS(namespace, "rect");
          diagram.appendChild(node.rect);
        }

        var rect = node.rect;
        var y = levelIdx * (1 + levelsGapRatio);
        rect.setAttribute("x", Math.floor(node.x * xMultiplier) + "px");
        rect.setAttribute("y", Math.floor(y * yMultiplier) + "px");
        rect.setAttribute("width", Math.floor(xMultiplier) + "px");
        rect.setAttribute("height", Math.floor(yMultiplier) + "px");
        if (levelIdx > 0) {
          if (!("line" in node)) {
            node.line = document.createElementNS(namespace, "line");
            diagram.appendChild(node.line);
          }
          var parent = node.parent;
          var parentOffset = (nodeIdx + 1) / (group.length + 1);
          var line = node.line;
          var parentY = (levelIdx - 1) * (1 + levelsGapRatio);
          line.setAttribute("x1",
              Math.floor((node.x + .5) * xMultiplier) + "px");
          line.setAttribute("y1", Math.floor(y * yMultiplier) + "px");
          line.setAttribute("x2",
              Math.floor((parent.x + parentOffset) * xMultiplier) + "px");
          line.setAttribute("y2",
              Math.floor((parentY + 1) * yMultiplier) + "px");
        }
      }
    }
  }


}