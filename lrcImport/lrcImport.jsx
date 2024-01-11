/**
 * @file lrcImport.jsx
 * @author 奈杰Rubia_a
 * @copyright &copy; 2023 奈杰Rubia_a Doe. All rights reserved.
 * @license MIT
 * @version 1.3.0
 * @date 2023.12.16
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
    ImportBtn.text = "导入歌词";
    ImportBtn.preferredSize.height = 40;
    ImportBtn.helpTip = "导入.lrc格式的歌词，支持双语";

    var ExchangeBtn = win.add("button", undefined, undefined, {
      name: "ExchangeBtn",
    });
    ExchangeBtn.text = "交换文本";
    ExchangeBtn.preferredSize.height = 40;
    ExchangeBtn.helpTip =
      "对于某些歌词文件可能会出现文本错位的情况，\n可以通过这个按钮快速交换两个文本关键帧的值";

    var ExportBtn = win.add("button", undefined, undefined, {
      name: "ExportBtn",
    });
    ExportBtn.text = "导出歌词";
    ExportBtn.preferredSize.height = 40;
    ExportBtn.helpTip = "选中歌词至多两个文本层,\n将其源文本关键帧导出为.lrc文件";

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
    var thisComp = app.project.activeItem;
    var importUndo = "导入歌词";
    app.beginUndoGroup(importUndo);

    if (!thisComp || !(thisComp instanceof CompItem)) {
      alert("请先选择一个合成", scriptName);
      return false;
    } else {
      var file = File.openDialog("导入歌词", "lrc:*.lrc");
      var compHeight = thisComp.height;
      var compWidth = thisComp.width;

      if (file) {
        var objLrc = [];
        file.open("r");
        parseLrc(file, objLrc);
        bubbleSort(objLrc);
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
          var lrcLang2 = thisComp.layers.addText("");
          lrcLang2.name = File.decode(file.name) + "Lang2";
          lrcLang2.position.setValue([compWidth / 2, compHeight / 2 + 35]);
          addLrc(objLrcLang2, lrcLang2);
          judgeLrcTooLong(objLrcLang2, thisComp, lrcLang2.name);

          var lrcLang1 = thisComp.layers.addText("");
          lrcLang1.name = File.decode(file.name) + "Lang1";
          lrcLang1.position.setValue([compWidth / 2, compHeight / 2 - 35]);
          addLrc(objLrcLang1, lrcLang1);
          judgeLrcTooLong(objLrcLang1, thisComp, lrcLang1.name);
        }
        file.close();
        app.endUndoGroup();
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
  function bubbleSort(arr) {
    var len = arr.length;
    for (var i = 0; i < len - 1; i++) {
      for (var j = 0; j < len - 1 - i; j++) {
        if (arr[j].time > arr[j + 1].time) {
          var temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
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
    var exchangeUndo = "交换文本";
    app.beginUndoGroup(exchangeUndo);

    if (!thisComp || !(thisComp instanceof CompItem)) {
      alert("请先选择一个合成", scriptName);
      return false;
    } else {
      var selectedLayers = thisComp.selectedLayers;
      if (selectedLayers.length != 2) {
        alert("需要先选中两个文本层", scriptName);
        return false;
      } else {
        try {
          var selectedLayer1 = selectedLayers[0];
          var selectedLayer2 = selectedLayers[1];
          swapText(selectedLayer1, selectedLayer2);
        } catch (error) {
          alert(error, scriptName);
          return false;
        }
      }
    }
    app.endUndoGroup();
    return true;
  }

  function exportLrc() {
    var thisComp = app.project.activeItem;
    if (!thisComp || !(thisComp instanceof CompItem)) {
      alert("请先选择一个合成", scriptName);
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
        alert("需要先选中一或者两个文本层", scriptName);
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
    var file = File.saveDialog("导出歌词", "lrc:*.lrc");
    if (file) {
      file.open("w");
      file.write(decodeLrc(objOutLr));
      file.close();
      alert("导出歌词成功", scriptName);
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
  function swapText(layer1, layer2) {
    var keys1 = layer1.sourceText.selectedKeys;
    var keys2 = layer2.sourceText.selectedKeys;
    var marker1 = layer1.property("Marker");
    var marker2 = layer2.property("Marker");
    for (var i = 0; i < Math.min(keys1.length, keys2.length); i++) {
      var textValue1 = layer1.sourceText.keyValue(keys1[i]).text;
      var textValue2 = layer2.sourceText.keyValue(keys2[i]).text;

      for (var j = 1; j <= marker1.numKeys; j++) {
        if (marker1.keyValue(j).comment === textValue1) {
          marker1.keyValue(j).comment = textValue2;
          marker1.setValueAtKey(j, new MarkerValue(textValue2));
          break;
        }
      }
      for (var j = 1; j <= marker2.numKeys; j++) {
        if (marker2.keyValue(j).comment === textValue2) {
          marker2.setValueAtKey(j, new MarkerValue(textValue1));
          break;
        }
      }
      layer1.sourceText.setValueAtKey(keys1[i], textValue2);
      layer2.sourceText.setValueAtKey(keys2[i], textValue1);
    }
  }
})(this);
