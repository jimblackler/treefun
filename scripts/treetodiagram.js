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

function treeToDiagram(tree, diagram, drawRoot, options) {
  var levels = makeLevels(tree, drawRoot);

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
      spacing += (group.length - 1) * options.nodeGapRatio;
      groupSpacing = options.groupGapRatio;
    }
    var width = spacing + nodesWidth;
    if (fixedLevel == -1 || width > widths[fixedLevel])
      fixedLevel = levelIdx;
    widths.push(width);
    spacings.push(spacing);
  }

  var maxWidth = Math.max(widths[fixedLevel],
          options.minimumColumns * (1 + options.levelsGapRatio))

  // Position and make elements
  var level = levels[fixedLevel];

  // Use any extra space to increase group gap up to ideal gap...
  var useNodeGapRatio = options.nodeGapRatio;
  var spare = (maxWidth - widths[fixedLevel]);
  var useGroupGapRatio = options.groupGapRatio;
  if (level.length > 1) {
    var spareForGroupGaps = Math.min(spare / (level.length - 1),
        (options.idealGroupSpacing - options.groupGapRatio));
    spare -= spareForGroupGaps * (level.length - 1);
    useGroupGapRatio += spareForGroupGaps;
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
      nodeSpacing = useNodeGapRatio;
    }
    x += useGroupGapRatio;
  }

  function sweepLeftToRight(level, infield, outfield) {
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
          minX = newX + 1 + options.groupGapRatio;
        else
          minX = newX + 1 + options.nodeGapRatio;
        node[outfield] = newX;
      }
    }
  }


  function sweepRightToLeft(level, infield, outfield) {
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
          maxX = newX - 1 - options.groupGapRatio;
        else
          maxX = newX - 1 - options.nodeGapRatio;
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
    sweepAndAverage();
  }

  // Second level to bottom; children distributed under parent.
  for (var levelIdx = fixedLevel + 1; levelIdx < levels.length; levelIdx++) {
    var level = levels[levelIdx];
    // Find positions
    for (var memberIdx = 0; memberIdx != level.length; memberIdx++) {
      var group = level[memberIdx];
      var parent = group[0].parent;

      var groupWidth = (group.length - 1) * (1 + options.idealNodeSpacing);
      var x = parent.x - groupWidth / 2;
      for (var nodeIdx = 0; nodeIdx != group.length; nodeIdx++) {
        var node = group[nodeIdx];
        node.x = x;
        x += 1 + options.idealNodeSpacing;
      }
    }
    sweepAndAverage();
  }

  // Render the tree.
  // Find height ratio
  var useLevels = Math.max(levels.length, options.minimumRows);
  var height = useLevels + (useLevels - 1) * options.levelsGapRatio;

  var diagramWidth = diagram.width.baseVal.value;
  var diagramHeight = diagram.height.baseVal.value;

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

        node.rect = document.createElementNS(namespace, "rect");
        diagram.appendChild(node.rect);

        node.text = document.createElementNS(namespace, "text");
        diagram.appendChild(node.text);

        var rect = node.rect;
        var y = levelIdx * (1 + options.levelsGapRatio);
        rect.setAttribute("x", Math.floor(node.x * xMultiplier) + "px");
        rect.setAttribute("y", Math.floor(y * yMultiplier) + "px");
        rect.setAttribute("width", Math.floor(xMultiplier) + "px");
        rect.setAttribute("height", Math.floor(yMultiplier) + "px");

        var text = node.text;
        text.setAttribute("x", Math.floor((node.x + 0.5) * xMultiplier) + "px");
        text.setAttribute("y", Math.floor((y + 0.5) * yMultiplier) + "px");
        text.textContent = node.label;

        if (levelIdx == 0)
          continue;

        // Draw lines to parents.
        if (!("line" in node)) {
          node.line = document.createElementNS(namespace, "line");
          diagram.appendChild(node.line);
        }
        var parent = node.parent;
        var parentOffset = (nodeIdx + 1) / (group.length + 1);
        var line = node.line;
        var parentY = (levelIdx - 1) * (1 + options.levelsGapRatio);
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