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
  var groups = [];
  for (var idx = 0; idx != tree.children.length; idx++) {
    groups.push([tree.children[idx]]);
  }
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

  var groupGapRatio = 0.8;
  var nodeGapRatio = .33;
  var levelsGapRatio = 1.4;

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
  for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
    var level = levels[levelIdx];
    var y = levelIdx * (1 + levelsGapRatio);
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
        node.rect = document.createElementNS(namespace, "rect");
        diagram.appendChild(node.rect);
        if (levelIdx > 0) {
          node.line = document.createElementNS(namespace, "line");
          diagram.appendChild(node.line);
        }
        node.x = x;
        node.y = y;
        x += 1;
        nodeSpacing = nodeGapRatio;
      }
      x += useGroupGapRatio;
    }
  }


  // Find height ratio
  var height = levels.length + (levels.length - 1) * levelsGapRatio;

  var style = window.getComputedStyle(diagram);
  var diagramWidth = Number.parseInt(style.width);
  var diagramHeight = Number.parseInt(style.height);

  var xMultiplier = diagramWidth / widths[fixedLevel];
  var yMultiplier = diagramHeight / height;



  function simulate() {
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
      // Sweep left to right
      var minX = 0;
      for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
        var group = level[memberIdx];
        for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
          var node = group[nodeIdx];
          if (node.x < minX) {
            node.x = minX;
          }
          if (nodeIdx == group.length - 1)
            minX = node.x + 1 + groupGapRatio;
          else
            minX = node.x + 1 + nodeGapRatio;
        }
      }

      // Sweep right to right
      var maxX = widths[fixedLevel] - 1;
      for (var memberIdx = level.length - 1; memberIdx >= 0; memberIdx--) {
        var group = level[memberIdx];
        for (var nodeIdx = group.length - 1; nodeIdx >= 0; nodeIdx--) {
          var node = group[nodeIdx];
          if (node.x > maxX) {
            node.x = maxX;
          }
          if (nodeIdx == group.length - 1)
            maxX = node.x - 1 - groupGapRatio;
          else
            maxX = node.x - 1 - nodeGapRatio;
        }
      }
    }



  }

  function render() {

    for (var levelIdx = 0; levelIdx != levels.length; levelIdx++) {
      var level = levels[levelIdx];
      for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
        var group = level[memberIdx];
        for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
          var node = group[nodeIdx];
          var rect = node.rect;
          rect.setAttribute("x", Math.floor(node.x * xMultiplier) + "px");
          rect.setAttribute("y", Math.floor(node.y * yMultiplier) + "px");
          rect.setAttribute("width", Math.floor(xMultiplier) + "px");
          rect.setAttribute("height", Math.floor(yMultiplier) + "px");
          if (levelIdx > 0) {
            var parent = node.parent;
            var parentOffset = (nodeIdx + 1) / (group.length + 1);
            var line = node.line;
            line.setAttribute("x1",
                Math.floor((node.x + .5) * xMultiplier) + "px");
            line.setAttribute("y1", Math.floor(node.y * yMultiplier) + "px");
            line.setAttribute("x2",
                Math.floor((parent.x + parentOffset) * xMultiplier) + "px");
            line.setAttribute("y2",
                Math.floor((parent.y + 1) * yMultiplier) + "px");
          }
        }
      }
    }
    setTimeout(function () {
      simulate();
      render();
    }, 1000);
  }

  render();

}