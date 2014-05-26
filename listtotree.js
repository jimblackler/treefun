"use strict";

function listToTree(list, parent) {

  var treeNode = {element:list, parent:parent, children:[]};

  // Children
  var xpathResult = document.evaluate("ol/li", list, null, XPathResult.ANY_TYPE, null);
  var node;
  while (node = xpathResult.iterateNext()) {
    treeNode.children.push(listToTree(node, treeNode));
  }
  return treeNode;
}
