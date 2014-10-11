"use strict";

function textToTree(text) {

  var lines = text.split(/\n/);

  var rootNode = {label: "root",
    parent: "",
    children: []};

  var stackParents = [rootNode];
  var stackIndents = [-1];
  for (var idx = 0; idx != lines.length; idx++) {
    var line = lines[idx];
    var content = line.trim();
    if (!content.length)
      continue;
    var indent = line.indexOf(content);
    while (stackIndents[stackIndents.length - 1] >= indent) {
      stackIndents.pop();
      stackParents.pop();
    }
    var parent = stackParents[stackParents.length - 1];
    var node = {label: content,
      parent: parent,
      children: []};
    parent.children.push(node);
    stackParents.push(node);
    stackIndents.push(indent);
  }


  return rootNode;
}