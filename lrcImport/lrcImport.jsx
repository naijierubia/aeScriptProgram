/**
 * @file lrcImport.jsx
 * @author 奈杰Rubia_a
 * @copyright &copy; 2023 奈杰Rubia_a Doe. All rights reserved.
 * @license MIT
 * @version 1.0.0
 * @date 2023.12.6
 *
 * @description import lrc file into Adobe After Effects and Support bilingual lyrics
 *
 */

var panelGlobal = this;
var win = (function () {
  var win = panelGlobal instanceof Panel ? panelGlobal : new Window("palette");
  if (!(panelGlobal instanceof Panel)) win.text = "IrcImport";
  win.preferredSize.width = 60;
  win.preferredSize.height = 100;
  win.orientation = "column";
  win.alignChildren = ["center", "top"];
  win.spacing = 5;
  win.margins = 16;

  var ImportBtn = win.add("button", undefined, undefined, {
    name: "ImportBtn",
  });
  ImportBtn.text = "Import";
  ImportBtn.preferredSize.height = 40;
  ImportBtn.helpTip = "import lrc file";

  var ExchangeBtn = win.add("button", undefined, undefined, {
    name: "ExchangeBtn",
  });
  ExchangeBtn.text = "Exchange";
  ExchangeBtn.preferredSize.height = 40;
  ExchangeBtn.helpTip =
    "exchange the values of two keyframes in the sourcetext\n between two text layers";

  win.layout.layout(true);
  win.layout.resize();
  win.onResizing = win.onResize = function () {
    this.layout.resize();
  };

  if (win instanceof Window) win.show();

  return win;
})();

var reg = /\[(\d{1,2}):(\d{1,2}.\d{1,3})\](.*)/;
var scriptName = "lrcImport";

win.ImportBtn.onClick = importLrcFile;
win.ExchangeBtn.onClick = exchangeLrc;

function importLrcFile() {
  //get activeComp
  var thisComp = app.project.activeItem;

  if (!thisComp || !(thisComp instanceof CompItem)) {
    alert("Please select a composition before import", scriptName);
    return false;
  } else {
    var file = File.openDialog("Import lrc File", "lrc:*.lrc");
    var compHeight = thisComp.height;
    var compWidth = thisComp.width;

    if (file) {
      var objLrc = [];
      file.open("r");
      parseLrc(file, objLrc);
      var isNums = judgeLangNums(objLrc);
      if (!isNums) {
        var lrcOneLang = thisComp.layers.addText("");
        lrcOneLang.name = File.decode(file.name);
        lrcOneLang.position.setValue([compWidth / 2, compHeight / 2]);
        addLrc(objLrc, lrcOneLang);
        judgeLrcTooLong(objLrc, thisComp, lrcOneLang.name);
      } else {
        var objLrcLang1 = [];
        var objLrcLang2 = [];
        separateLrc(objLrc, objLrcLang1, objLrcLang2);
        var lrcLang1 = thisComp.layers.addText("");
        lrcLang1.name = File.decode(file.name) + "Lang1";
        lrcLang1.position.setValue([compWidth / 2, compHeight / 2 + 50]);
        addLrc(objLrcLang1, lrcLang1);
        judgeLrcTooLong(objLrcLang1, thisComp, lrcLang1.name);

        var lrcLang2 = thisComp.layers.addText("");
        lrcLang2.name = File.decode(file.name) + "Lang2";
        lrcLang2.position.setValue([compWidth / 2, compHeight / 2 - 50]);
        addLrc(objLrcLang2, lrcLang2);
        judgeLrcTooLong(objLrcLang2, thisComp, lrcLang2.name);
      }
      file.close();
      return true;
    }
  }
}

function parseLrc(file, objLrc) {
  while ((line = file.readln())) {
    var matcher = line.match(reg);
    if (matcher) {
      var min = +matcher[1];
      var sec = +matcher[2];
      var time = min * 60 + sec;
      var lrc = matcher[3];
      objLrc.push({
        time: time,
        lrc: lrc,
      });
    }
  }
}

function judgeLangNums(objLrc) {
  var preTime = objLrc[0].time;
  for (var i = 1; i < objLrc.length; i++) {
    if (objLrc[i].time == preTime) {
      return true;
    }
    preTime = objLrc[i].time;
  }
  return false;
}

function addLrc(objLrc, textLayer) {
  for (var i = 0; i < objLrc.length; i++) {
    var lrcMarker = new MarkerValue(objLrc[i].lrc);
    textLayer.sourceText.setValueAtTime(objLrc[i].time, objLrc[i].lrc);
    textLayer.property("Marker").setValueAtTime(objLrc[i].time, lrcMarker);
  }
}

function judgeLrcTooLong(objLrc, thisComp, layerName) {
  var tooLongFlag = false;
  for (var i = 0; i < objLrc.length; i++) {
    if (objLrc[i].lrc.length > 25) {
      if (!tooLongFlag) {
        tooLongFlag = true;
        var warn = thisComp.layers.addNull();
        warn.name = layerName + "Warn";
        warn.label = 2;
        addWarn(objLrc, warn, i);
      } else {
        addWarn(objLrc, warn, i);
      }
    }
  }
}

function addWarn(objLrc, warn, index) {
  var tip = new MarkerValue("lrc too long");
  warn.property("Marker").setValueAtTime(objLrc[index].time, tip);
}

function separateLrc(objLrc, objLrcLang1, objLrcLang2) {
  var preTime = objLrc[0].time;
  objLrcLang1.push(objLrc[0]);
  for (var i = 1; i < objLrc.length; i++) {
    if (objLrc[i].time == preTime) {
      objLrcLang2.push(objLrc[i]);
    } else {
      objLrcLang1.push(objLrc[i]);
    }
    preTime = objLrc[i].time;
  }
}

function exchangeLrc() {
  var thisComp = app.project.activeItem;
  if (!thisComp || !(thisComp instanceof CompItem)) {
    alert("Please select a composition before exchange", scriptName);
    return false;
  } else {
    var selectedLayers = thisComp.selectedLayers;
    if (selectedLayers.length != 2) {
      alert("Please select two text layers only ", scriptName);
      return false;
    } else {
      try {
        var selectedKey1 = selectedLayers[0].sourceText.selectedKeys[0];
        var selectedKey2 = selectedLayers[1].sourceText.selectedKeys[0];

        var valueKey1 = selectedLayers[0].sourceText.keyValue(selectedKey1);
        var valueKey2 = selectedLayers[1].sourceText.keyValue(selectedKey2);
        var tempFont = valueKey1.font;
        valueKey1.font = valueKey2.font;
        valueKey2.font = tempFont;
        
        selectedLayers[0].sourceText.setValueAtKey(selectedKey1, valueKey2);
        selectedLayers[1].sourceText.setValueAtKey(selectedKey2, valueKey1);
      } catch (error) {
        alert(error,scriptName);
        return false;
      }
    }
  }
  return true;
}