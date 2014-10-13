"use strict";
var treeEntry = document.getElementById("treeEntry");
var options = document.getElementById("options");
var styles = document.getElementById("styles");
var diagramSvg = document.getElementById("diagramSvg");

document.getElementById("viewSave").addEventListener("click", function () {
  this.href = "data:image/svg+xml;charset=utf-8," +
      window.encodeURIComponent(diagramSvg.parentNode.innerHTML);
});

function clear(node) {
  while (node.childNodes.length > 0)
    node.removeChild(node.childNodes[0]);
}

function draw() {
  var tree = textToTree(treeEntry.value);
  var diagramGroup = document.getElementById("diagramGroup");
  var styleSheet = document.getElementById("stylesheet");
  clear(styleSheet);
  styleSheet.appendChild(document.createTextNode(styles.value));

  clear(diagramGroup);

  treeToDiagram(tree, diagramSvg, diagramGroup,
      JSON.parse(options.value));
}

treeEntry.addEventListener("input", draw);
options.addEventListener("input", draw);
styles.addEventListener("input", draw);

// Allow tab.
treeEntry.addEventListener("keydown",
    function (evt) {
      if (evt.keyCode != 9 && evt.which != 9)
        return;
      var selectionStart = this.selectionStart;
      this.value = this.value.substring(0, selectionStart) + "\t" +
          this.value.substring(this.selectionEnd);
      this.selectionEnd = selectionStart + 1;
      draw();
      evt.preventDefault();
    }
);

function demo(data) {
  treeEntry.value = data.tree;
  options.value = JSON.stringify(data.options, null, " ");
  styles.value =  data.styles;
  draw();
}

function toJSON() {
  console.log(JSON.stringify({tree:treeEntry.value,
    options:JSON.parse(options.value), styles:styles.value}, null, " "));
}

var data = gup("data");
if (data) {
  var script = document.createElement("script");
  script.src = "sample_data/" + data + ".js";
  document.body.appendChild(script);
} else {
  draw();
}

