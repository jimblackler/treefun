"use strict";

function extractList(root, level, entries) {

  for (var i = 0; i != root.childNodes.length; i++) {
    var node = root.childNodes[i];
    if (node.tagName == "LI") {
      var entry = {level: level};
      entries.push(entry);
      entry.text = searchForList(node, level, entries).replace(/ +/g, " ").trim();
    }
  }
}

function searchForList(root, level, entries) {
  var text = "";
  var recordingText = (level != -1);
  for (var i = 0; i != root.childNodes.length; i++) {
    var node = root.childNodes[i];
    if (node.nodeType === document.TEXT_NODE) {
      if (recordingText)
        text += " " + node.nodeValue;
    } else if (node.tagName === "UL" || node.tagName === "OL") {
      recordingText = false;
      extractList(node, level + 1, entries);
      if (level == -1) {
        entries.push({level: -1});
      }
    } else if (node.childNodes) {
      text += " " + searchForList(node, level, entries);
    }
  }
  return text;
}
var entries = [];
searchForList(document.body, -1, entries);
var text = "";
for (var i = 0; i != entries.length; i++) {
  var entry = entries[i];
  if (entry.level == -1) {
    text += "\n";
    continue;
  }
  var line = "";
  for (var c = 0; c != entry.level; c++)
    line += " ";
  line += entry.text;
  text += line + "\n";
}
console.log(text);
//console.log(JSON.stringify(entries));
