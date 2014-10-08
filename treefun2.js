"use strict";

var random = Alea(18);

var max = 500;
var use = 40;

var data = [];
for (var i = 0; i != max; i++)
  data.push(i);

shuffle(data, random);

data = data.slice(0, use);

var unsatisfied = [];

for (i = 0; i != use; i++) {
  var node = {value:data[i], label:'[' + i + '] ' + data[i], children:[]};
  while (unsatisfied.length &&
      unsatisfied[unsatisfied.length - 1].value > node.value)
    node.children.push(unsatisfied.pop());
  unsatisfied.push(node);
}
var root = {value:0, label:'root', children:unsatisfied};

var treehere = document.getElementById("treehere");

makeList2(root, treehere);
var tree = listToTree(treehere);

var diagramhere = document.getElementById("diagramhere");
treeToDiagram(tree, diagramhere);



