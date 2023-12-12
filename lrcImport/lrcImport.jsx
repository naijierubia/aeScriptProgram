/**
 * @file lrcImport.jsx
 * @author 奈杰Rubia_a
 * @copyright &copy; 2023 奈杰Rubia_a Doe. All rights reserved.
 * @license MIT
 * @version 1.2.1
 * @date 2023.12.11
 * @github https://github.com/naijierubia/aeScriptProgram
 *
 * @description import lrc file into Adobe After Effects and Support bilingual lyrics
 *
 */
(function IrcImport(thisObj) {
  var panelGlobal = thisObj;
  var win = (function () {
    var win =
      panelGlobal instanceof Panel ? panelGlobal : new Window("palette");
    if (!(panelGlobal instanceof Panel)) win.text = "IrcImport";
    win.preferredSize.width = 60;
    win.orientation = "column";
    win.alignChildren = ["center", "top"];
    win.spacing = 5;
    win.margins = 16;

    var ImportBtn = win.add("button", undefined, undefined, {
      name: "ImportBtn",
    });
    ImportBtn.text = "Import";
    ImportBtn.preferredSize.height = 40;
    ImportBtn.helpTip = "Import lrc file";

    var ExchangeBtn = win.add("button", undefined, undefined, {
      name: "ExchangeBtn",
    });
    ExchangeBtn.text = "Exchange";
    ExchangeBtn.preferredSize.height = 40;
    ExchangeBtn.helpTip =
      "Exchange the values of two keyframes in the sourcetext\n between two text layers";

    var ExportBtn = win.add("button", undefined, undefined, {
      name: "ExportBtn",
    });
    ExportBtn.text = "Export";
    ExportBtn.preferredSize.height = 40;
    ExportBtn.helpTip = "Export lrc file";

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

  win.ImportBtn.onClick = function () {
    importLrcFile();
  };
  win.ExchangeBtn.onClick = function () {
    exchangeLrc();
  };
  win.ExportBtn.onClick = function () {
    exportLrc();
  };

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
          var marker1 = selectedLayers[0]
            .property("Marker")
            .keyValue(selectedKey1);
          var marker2 = selectedLayers[1]
            .property("Marker")
            .keyValue(selectedKey2);

          selectedLayers[0]
            .property("Marker")
            .setValueAtKey(selectedKey1, marker2);
          selectedLayers[1]
            .property("Marker")
            .setValueAtKey(selectedKey2, marker1);

          valueKey1.font = valueKey2.font;
          valueKey2.font = tempFont;

          selectedLayers[0].sourceText.setValueAtKey(selectedKey1, valueKey2);
          selectedLayers[1].sourceText.setValueAtKey(selectedKey2, valueKey1);
        } catch (error) {
          alert(error, scriptName);
          return false;
        }
      }
    }
    return true;
  }

  function exportLrc() {
    var thisComp = app.project.activeItem;
    if (!thisComp || !(thisComp instanceof CompItem)) {
      alert("Please select a composition before exchange", scriptName);
      return false;
    } else {
      var selectedLayers = thisComp.selectedLayers;
      var selectedTextLayers = selectedLayers.filter(function (layer) {
        return layer instanceof TextLayer;
      });

      if (selectedTextLayers.length === 1 || selectedTextLayers.length === 2) {
        var objOutLr = SourceText(selectedTextLayers);
        writeLrc(objOutLr);
      } else {
        alert("Please select one or two text layers", scriptName);
        return false;
      }
    }
  }
  function SourceText(electedTextLayers) {
    var listLang = [];
    for (var i = 0; i < electedTextLayers.length; i++) {
      var textKeyLength = electedTextLayers[i].sourceText.numKeys;
      var objText = [];
      for (var j = 1; j <= textKeyLength; j++) {
        var keyTime = electedTextLayers[i].sourceText.keyTime(j);
        var keyValue = electedTextLayers[i].sourceText.keyValue(j).text;
        objText.push({
          time: keyTime,
          text: keyValue,
        });
      }
      listLang.push(objText);
    }
    return listLang;
  }

  function writeLrc(objOutLr) {
    var file = File.saveDialog("Save Lrc File", "lrc:*.lrc");
    if (file) {
      file.open("w");
      file.write(decodeLrc(objOutLr));
      file.close();
      alert("Saved Lrc File Successfully", scriptName);
      return true;
    }
  }
  function decodeLrc(objOutLr) {
    var strLrc = "";
    if (objOutLr.length === 1) {
      var outLrc = objOutLr[0];
      for (var i = 0; i < outLrc.length; i++) {
        var time = transformTime(outLrc[i].time);
        var text = outLrc[i].text;
        strLrc += time + text + "\n";
      }
    } else if (objOutLr.length === 2) {
      var outLrc1 = objOutLr[0];
      var outLrc2 = objOutLr[1];
      var prevText1 = outLrc1[0].text;
      var prevText2 = outLrc2[0].text;
      var index1 = 0;
      var index2 = 0;
      while (outLrc1[index1] && outLrc2[index2]) {
        if (outLrc1[index1].time === outLrc2[index2].time) {
          strLrc +=
            transformTime(outLrc1[index1].time) + outLrc1[index1].text + "\n";
          strLrc +=
            transformTime(outLrc2[index2].time) + outLrc2[index2].text + "\n";
          prevText1 = outLrc1[index1].text;
          prevText2 = outLrc2[index2].text;
          index1++;
          index2++;
        } else if (outLrc1[index1].time < outLrc2[index2].time) {
          strLrc +=
            transformTime(outLrc1[index1].time) + outLrc1[index1].text + "\n";
          prevText1 = outLrc1[index1].text;
          strLrc += transformTime(outLrc1[index1].time) + prevText2 + "\n";
          index1++;
        } else if (outLrc1[index1].time > outLrc2[index2].time) {
          strLrc += transformTime(outLrc2[index2].time) + prevText1 + "\n";
          strLrc +=
            transformTime(outLrc2[index2].time) + outLrc2[index2].text + "\n";
          prevText2 = outLrc2[index2].text;
          index2++;
        }
      }
    } else {
      alert("Error", scriptName);
    }
    return strLrc;
  }

  function transformTime(time) {
    var min = PrefixZero(Math.floor(time / 60), 2);
    var sec = PrefixZero(parseInt(time % 60), 2);
    var ms = PrefixZero(Math.round(((time % 60) - sec) * 1000), 3);
    return "[" + min + ":" + sec + "." + ms + "]";
  }

  function PrefixZero(number, zeroNum) {
    return (Array(zeroNum).join(0) + number).slice(-zeroNum);
  }
})(this);
