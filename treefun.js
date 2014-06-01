"use strict";

var random = Alea(2);

var max = 100;
var use = 40;

var data = [];
for (var i = 0; i != max; i++) {
  data.push(i);
}

shuffle(data, random);

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


makeList(root, treehere);

var tree = listToTree(treehere, null);
treeToDiagram(tree, diagramhere);


