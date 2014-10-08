"use strict";

function makeList2(node, element) {
  element.appendChild(document.createTextNode(node.label));
  if (!node.children)
    return;
  var list = document.createElement("ol");
  for (var idx = 0; idx != node.children.length; idx++) {
    var child = node.children[idx];
    var li = document.createElement("li");
    makeList2(child, li);
    list.appendChild(li);
  }
  element.appendChild(list);
}
