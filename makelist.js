"use strict";

function makeList(node, element) {
  element.appendChild(document.createTextNode("" + node.value));
  if (!node.left && !node.right)
    return;
  var list = document.createElement("ol");
  if (node.left) {
    var li = document.createElement("li");
    makeList(node.left, li);
    list.appendChild(li);
  }
  if (node.right) {
    li = document.createElement("li");
    makeList(node.right, li);
    list.appendChild(li);
  }
  element.appendChild(list);
}
