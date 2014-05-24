"use strict";

var max = 100;
var use = 40;

var data = [];
for (var i = 0; i != max; i++) {
  data.push(i);
}
shuffle(data);

data = data.slice(0, use);

var root = {value:data[0]};

for (i = 1; i != use; i++) {
  var value = data[i];
  var node = root;
  while (true) {
    if (node.value > value) {
      if (node.left) {
        node = node.left;
      } else {
        node.left = {value:value};
        break;
      }
    } else {
      if (node.right) {
        node = node.right;
      } else {
        node.right = {value:value};
        break;
      }
    }
  }
}

function makeTree(node, element) {
  element.appendChild(document.createTextNode("" + node.value));
  if (!node.left && !node.right)
    return;
  var list = document.createElement("ol");
  if (node.left) {
    var li = document.createElement("li");
    makeTree(node.left, li);
    list.appendChild(li);
  }
  if (node.right) {
    li = document.createElement("li");
    makeTree(node.right, li);
    list.appendChild(li);
  }
  element.appendChild(list);
}

makeTree(root, treehere);



