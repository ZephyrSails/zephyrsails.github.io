// Load the var.
var testing_event = "stagemouseup";
var colors = {
  gray      : "rgb(246, 246, 246)",
  blue      : "rgb(27, 154, 247)",
  lt_blue   : "rgb(76, 176, 249)",
  green     : "rgb(165, 222, 55)",
  lt_green  : "rgb(185, 229, 99)",
  yellow    : "rgb(254, 174, 27)",
  lt_yellow : "rgb(254, 192, 87)",
  red       : "rgb(255, 67, 81)",
  lt_red    : "rgb(255, 118, 128)",
  purple    : "rgb(123, 114, 233)",
  lt_purple : "rgb(164, 158, 240)"
  }

var sizes = {
  small           : 4,
  small_tip       : " fa-lg",
  small_tipSize   : "8",
  middle          : 7,
  middle_tip      : " fa-2x",
  middle_tipSize  : "14",
  big             : 15,
  big_tip         : " fa-3x",
  big_tipSize     : "20",
  hitpoint        : 7
}

var tips = {
  yes : "✓",
  yes_color : colors["green"],
  yes_x : 9,
  yes_y : 9,
  no  : "✗",
  no_color  : colors["red"],
  no_x  : 8,
  no_y  : 10,
  why : "?",
  why_color : colors["yellow"],
  why_x : 6,
  why_y : 10,
  wow : "!",
  wow_color : colors["purple"],
  wow_x : 4.5,
  wow_y : 10,
  love: "❤",
  love_color: colors["lt_red"],
  love_x: 11,
  love_y: 9,
  tip_font: "24px SimHei"
}

var canvasData = {
  type:   "canvas",
  operate:"", // create, change
  color:  "",
  shape:  "", // shapes && tips && pencil, eraser.
  size:   "",
  index:  "", // 0 +
  cp1x:   "", // owned by shapes && lines && tips && pencil, eraser.
  cp1y:   "", // owned by shapes && lines && tips && pencil, eraser.
  cp2x:   "", // owned by shapes && lines
  cp2y:   "", // owned by shapes && lines
  hp1x:   "", // owned by shapes && lines
  hp1y:   "", // owned by shapes && lines
  hp2x:   "", // owned by shapes
  hp2y:   "", // owned by shapes
  hp3x:   "", // owned by shapes && lines
  hp3y:   "", // owned by shapes && lines
  hp4x:   "", // owned by shapes
  hp4y:   ""  // owned by shapes
};

var canvas_container = new createjs.Container();
var canvas_index = 0;

var control_point_r = 5;
// current color
var color = "blue";
//var lt_color = "lt_blue";
var default_color = "gray";
var current_function = "";
var pen;
var canvas, stage;
// var size = sizes["small"];
var size = "small";
var shape;
var tip;
var tip_container;

var oldPt;
var midPt;
var zephyr = (Math.sqrt(2)-1)/2 + 1;

var domElement;
var pencil = new createjs.Shape();

var title;
var stroke;
var index;
// one for all. the Graph.
var graph;
var focusGraph;
var changing = false;

var reRangeLock = false;
// var repositionLock = false;

var pencil = new createjs.Shape();


$(document).ready(function(){
  init(); // initiate the Canvas
  // after this line, we are binding shap button control function
  // ------------------------------------------------------------
  $("button#arrow-btn").click(function(){ // what would happen when arrow-btn clicked
    current_function = $(this);
    update_dashboard(current_function);
    stage.removeAllEventListeners();

    shape = "arrow"
    stage.addEventListener("stagemousedown", shapeMouseDown);
    stage.addEventListener("stagemouseup", shapeMouseUp);
  });

  $("button#words-btn").click(function(){ // what would happen when words-btn clicked
    current_function = $(this);
    update_dashboard(current_function);
    stage.removeAllEventListeners();

    stage.addEventListener("stagemousedown", wordClick);
  });

  $("ul#pencil-selection li").click(function(){ // what would happen when pencil-btn clicked
    current_function = "button#pencil-btn";
    $(current_function).html("<i class='" + $(this).children("a").children("i").attr("class")
      + "'></i>\n" + "<i class='fa fa-caret-down'></i>");
    update_dashboard($(current_function));
    stage.removeAllEventListeners();

    if (focusGraph)
      loseFocus();

    /*stage.addEventListener("stagemousedown",drawMouseDown);
    stage.addEventListener("stagemouseup",drawMouseUp);*/

    if($(this).attr("id")=="pen-eraser") {
      stage.addEventListener("stagemousedown", eraserMouseDown);
      stage.addEventListener("stagemouseup", eraserMouseUp);
    }
    else {
      stage.addEventListener("stagemousedown", drawMouseDown);
      stage.addEventListener("stagemouseup", drawMouseUp);
    }
  });

  // shape-button control
  $("ul#shape-selection li").click(function() { // what would happen when shap-selection button clicked
    current_function = "button#shapes-btn";
    $(current_function).html("<i class='" + $(this).children("a").children("i").attr("class")
      + "'></i>\n" + "<i class='fa fa-caret-down'></i>");
    update_dashboard($(current_function));
    stage.removeAllEventListeners();

    shape = $(this).attr("id");
    stage.addEventListener("stagemousedown", shapeMouseDown);
    stage.addEventListener("stagemouseup", shapeMouseUp);
    // alert(shape);
  });
  // tip-button control
  $("ul#tip-selection li").click(function() {
    current_function = "button#tips-btn";
    $(current_function).html("<i class='" + $(this).children("a").children("i").attr("class")
      + "'></i>\n" + "<i class='fa fa-caret-down'></i>");

    tip = $(this).attr("id");
    shape = ("tip");
    update_dashboard($(current_function));
    stage.removeAllEventListeners();

    stage.addEventListener("stagemousedown", shapeMouseDown);
    stage.addEventListener("stagemouseup", shapeMouseUp);
  });
  // colors-button control
  $("ul#color-selection li").click(function(){
    $("a#colors-btn").attr("class", $(this).children("a").attr("class"));
    update_dashboard($(current_function));

    color = $(this).attr("id");
  });

  $("ul#size-selection li").click(function(){
    $("a#size-btn").html("<i class='" + 
      $(this).children("a").children("i").attr("class") + "'></i>");
    size = $(this).attr("id");
  });

  $("button#delete-btn").click(function(){
    if(focusGraph) {
      // focusGraph.uncache();
      stage.removeChild(focusGraph)
      loseFocus();
    }
  });

  // Button control over after this line. //
  // ------------------------------------ //
  // And Canvas control begin.            //


});

function update_dashboard(current_func) {
  // by the way, this is the second way to locate a child (or all children).
  $("div#div-function >> button").attr("style", "background-color:" + colors[default_color] + ";");
  $("div#div-function >>> button").attr("style", "background-color:" + colors[default_color] + ";");
  current_func.attr("style", "background-color:" + colors["lt_"+color] + ";");
}

function init() { // set up stage and bind it to canvas.
  // create stage and point it to the canvas:
  canvas = document.getElementById("Canvas");
  stage = new createjs.Stage(canvas);
  // enable touch interactions if supported on the current device:
  createjs.Touch.enable(stage);
  // enabled mouse over / out events
  stage.enableMouseOver(10);
  stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas
  //update_dashboard($(current_function));
  image = new Image();
  image.onload=handleComplete;
  image.src = "111.jpg";
  // dispatchEvent("stagemouseup");
}

function handleComplete(){
    bitmap = new createjs.Bitmap(image);
    stage.addChild(bitmap);
    pencil.cache(0,0,500,400);
    stage.addChild(pencil);
    stage.update();
}

// following three handler are used by pencil
// ------------------------------------------
function drawMouseDown(event) {
  if (reRangeLock)
    return;
  if (focusGraph)
    loseFocus();

  stroke = sizes[size];
  oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
  oldMidPt = oldPt.clone();

  stage.addEventListener("stagemousemove", drawMouseMove);
}

function drawMouseMove(event) {
  var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, 
    oldPt.y + stage.mouseY >> 1);

  pencil.graphics.setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(colors[color]).moveTo(midPt.x, midPt.y)
    .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
  stage.update();

  oldPt.x = stage.mouseX;
  oldPt.y = stage.mouseY;

  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;

 
  pencil.updateCache("source-over");
  pencil.graphics.clear();
}

function drawMouseUp(event) {
  // alert(event);
  // testing_event = event;
  // alert(event.toString());
  // this.dispatchEvent(event);
  stage.update();
  stage.removeEventListener("stagemousemove", drawMouseMove);
}

function eraserMouseDown(event) {
  if (reRangeLock)
    return;
  if (focusGraph)
    loseFocus();

  stroke = (sizes[size]*3);
  oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
  oldMidPt = oldPt.clone();

  stage.addEventListener("stagemousemove", eraserMouseMove);
}

function eraserMouseMove(event) {
  var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, 
    oldPt.y + stage.mouseY >> 1);

  pencil.graphics.setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(colors[color]).moveTo(midPt.x, midPt.y)
    .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

  stage.update();
  
  oldPt.x = stage.mouseX;
  oldPt.y = stage.mouseY;

  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;

  pencil.updateCache("destination-out");
  pencil.graphics.clear();
}

function eraserMouseUp(event) {
  stage.removeEventListener("stagemousemove", eraserMouseMove);
}
// following three handler are used by shape
// -----------------------------------------
function shapeMouseDown(event) { // the begining of a drawing
  if (reRangeLock)  // 是否正在调整图形？
    return;
  if (focusGraph)
    loseFocus();
  prepareGraph(color, shape, size, index, stage.mouseX, stage.mouseY);
  stage.addEventListener("stagemousemove", shapeMouseMove);
}
function shapeMouseMove(event) {
  graph.cp2 = {x: stage.mouseX, y: stage.mouseY};
  changing = false;
  if (shape != "tip")
    draw(graph);
}
function shapeMouseUp(event) {
  if (reRangeLock)  // 是否正在调整图形？
    return;
  stage.removeEventListener("stagemousemove", shapeMouseMove);
  syncLocalToData("create", graph);
  // alert("hello");
  addShapeFunction(graph);
  // alert(canvas_index);
  // reRangeLock = false;
}
/*
function tipMouseDown(event) {
  if (reRangeLock)  // 是否正在调整图形？
    return;
  else
    reRangeLock = true;
  if (focusGraph)
    loseFocus();

  tip_container = new createjs.Container();
  var tip_circle = new createjs.Shape();
  var tip_word = new createjs.Text(tips[tip], tips["tip_font"], tips[tip+"_color"]);
  tip_circle.graphics.clear().setStrokeStyle(5).beginStroke(tips[tip+"_color"]).drawCircle(stage.mouseX, stage.mouseY, 15);

  tip_container.addChild(tip_circle, tip_word);
  tip_container.cursor = "move";

  tip_word.x = stage.mouseX-tips[tip+"_x"];
  tip_word.y = stage.mouseY-tips[tip+"_y"];

  stage.addChild(tip_container);
  stage.update();
  // document.body.insertBefore(newTip, document.getElementById("canvasDiv"));
}

function tipMouseUp(event) {
  reRangeLock = true;
  tip_container.on("mousedown", function (evt) {
    // if (reRangeLock)  // 是否正在调整图形？
    //  return;
    // else
    // reRangeLock = true;
    // this.parent.addChild(this);
    this.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
  });
  tip_container.on("pressmove", function (evt) {
    this.x = evt.stageX + this.offset.x;
    this.y = evt.stageY + this.offset.y;
    stage.update();
  });

  // tip_container.on("click")

  tip_container.on("pressup", function (evt) {
    // reRangeLock = false;
  });
  // reRangeLock = false;
  tip_container.on("rollover", function (evt) {
    reRangeLock = true;
  });
  tip_container.on("rollout", function (evt) {
    reRangeLock = false;
  });
  // reRangeLock = false;
}*/

function wordClick(event) {
  if (reRangeLock)  // 是否正在调整图形？
    return;
  if (focusGraph)
    loseFocus();
  //stage.autoClear = false;
  //var tip = tips["yes"];
  var newTip = document.createElement("input");
  // tip = document.getElementById("testi");
  $(newTip).attr("class", tips[tip] + sizes["small_tip"]);
  // alert(newTip.attr("class"));
  //alert(tip+"_color");
  $(newTip).attr("style", "color:" + colors[color]+";");
  
  domElement = new createjs.DOMElement(newTip);

  domElement.x = stage.mouseX - sizes[size+"_tipSize"];
  domElement.y = stage.mouseY - sizes[size+"_tipSize"];
  document.body.insertBefore(newTip, document.getElementById("canvasDiv"));

  //stage.autoClear = true;
  stage.addChild(domElement);

  stage.update();
}

function draw(g) {  // used to draw a picture.
  var draw = g.getChildByName("draw");
  if (shape != "tip" || changing == true) {
    var hp1  = g.getChildByName("hp1");
    var hp2  = g.getChildByName("hp2");
    var hp3  = g.getChildByName("hp3");
    var hp4  = g.getChildByName("hp4");

    draw.cursor = "pointer";
    hp1.cursor = "crosshair";
    hp2.cursor = "crosshair";
    hp3.cursor = "crosshair";
    hp4.cursor = "crosshair";
    // alert("?")
    var sqrtS = Math.sqrt(sizes[g.size]);
  }
  // alert("?")
  switch (g.shape) {
    case("shape-circle"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size]).beginStroke(colors[g.color])
        .drawEllipse(g.cp1.x, g.cp1.y, (g.cp2.x-g.cp1.x), (g.cp2.y-g.cp1.y));
      hp1.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp2.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp2.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      hp4.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("shape-square"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size]).beginStroke(colors[g.color])
        .drawRoundRect(g.cp1.x, g.cp1.y, g.cp2.x-g.cp1.x, g.cp2.y-g.cp1.y, 7);
      hp1.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp2.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp2.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      hp4.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("shape-line"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size], 1).beginStroke(colors[g.color]).moveTo(g.cp1.x, g.cp1.y).lineTo(g.cp2.x, g.cp2.y);
      hp1.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("arrow"):  // Begin to draw an arrow.
      var golden_section = 0.618; // The Golden section
      var g2 = 0.681; // 0.618 + (1-0.618)/3;
      var w = 8*sqrtS;
      var w2 = w/2;
      var x1 = g.cp1.x;
      var y1 = g.cp1.y;
      var x2 = g.cp2.x;
      var y2 = g.cp2.y;
      var sqrt = Math.sqrt((y1-y2)*(y1-y2)+(x1-x2)*(x1-x2));
      draw.graphics.clear().setStrokeStyle(3, 1, 1).beginStroke(colors[g.color])
      .beginFill(colors[g.color]).moveTo(x1, y1)
      .lineTo((x1+(x2-x1)*g2)+(y1-y2)*w2/sqrt,(y1+(y2-y1)*g2+(x2-x1)*w2/sqrt))
      .lineTo((x1+(x2-x1)*golden_section)+(y1-y2)*w/sqrt,(y1+(y2-y1)*golden_section+(x2-x1)*w/sqrt))
      .lineTo(x2, y2)
      .lineTo((x1+(x2-x1)*golden_section)+(y2-y1)*w/sqrt,(y1+(y2-y1)*golden_section+(x1-x2)*w/sqrt))
      .lineTo((x1+(x2-x1)*g2)+(y2-y1)*w2/sqrt,(y1+(y2-y1)*g2+(x1-x2)*w2/sqrt))
      .lineTo(x1, y1);
      hp1.graphics.clear().beginFill(colors["lt_"+g.color]).drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().beginFill(colors["lt_"+g.color]).drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("tip"):
      // var draw = new createjs.Container();
      var tip_circle = new createjs.Shape();
      var tip_word = new createjs.Text(tips[tip], tips["tip_font"], tips[tip+"_color"]);
      tip_circle.graphics.clear().setStrokeStyle(5).beginStroke(tips[tip+"_color"]).drawCircle(stage.mouseX, stage.mouseY, 15);
      // tip_container.name = "draw";
      draw.addChild(tip_circle, tip_word);

      draw.cursor = "pointer";

      tip_word.x = stage.mouseX-tips[tip+"_x"];
      tip_word.y = stage.mouseY-tips[tip+"_y"];

  }
  stage.update();
}

function prepareGraph(clr, shp, siz, idx, cp1x, cp1y) {
  graph = new createjs.Container(); // 用来盛放独立图形的容器
  graph.color = clr;  // 存放图形的颜色信息
  graph.shape = shp;  // 存放图形的形状信息
  graph.size  = siz;  // 存放图形的大小信息
  graph.hasFunction = false;
  // ============================================================
  graph.name  = idx;

  // control point: 控制点位置，记录着图形左上和右下两脚的位置。（对箭头则是起点和终点）（text）
  graph.cp1   = {x: cp1x, y: cp1y};

  // hit point: 拖动点，通过四个拖动点来修改图形。（对箭头则是起点和终点）（display）
  var hp = [new createjs.Shape(), new createjs.Shape(), new createjs.Shape(), new createjs.Shape()];
  var drawG;
  if (graph.shape == "tip") {
    var drawG = new createjs.Container();
  }
  else
    drawG = new createjs.Shape(); // 最终绘制的图形（display）

  hp[0].name = "hp1";
  hp[1].name = "hp2";
  hp[2].name = "hp3";
  hp[3].name = "hp4";
  drawG.name = "draw";

  for (var i = 0; i < 4; i++)
  {
    hp[i].visible = false;
  }
  // 把（text）和（display）组件都装进容器里。
  graph.addChild(drawG, hp[0], hp[1], hp[2], hp[3]);

  // canvas_container.addChild(graph);

  // 把容器放上舞台，初登场。
  stage.addChild(graph);
  if (graph.shape == "tip") {
    changing = false;
    draw(graph);
  }
}

function addShapeFunction(g) {
  /*
  if (g.parent.hasFunction == true) {
    alert("nonono");
    return;
  }*/
  // g.parent.hasFunction = 12;
  g.getChildByName("draw").on("click", function (evt) { // focus
    if (focusGraph)
      loseFocus();
    reRangeLock = true;

    $("button#delete-btn").attr("class", "button button-circle button-highlight button-raised");

    this.cursor = "move";
    for (var i = 1; i <= 4; i++) {
      this.parent.getChildByName("hp"+i).visible = true;
    }
    // stage.autoClear = true;
    
    focusGraph = this.parent;
    focusGraph.getChildByName("draw").alpha = 0.5;
    stage.update();

    this.on("mousedown", function (evt) { 
      //this.parent.addChild(this);
      this.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
      for (var i = 1; i <=4; i++) {
        this.parent.getChildByName("hp"+i).offset = {x: this.parent.getChildByName("hp"+i).x - evt.stageX, y: this.parent.getChildByName("hp"+i).y - evt.stageY};
      }
    });
    this.on("pressmove", function (evt) {
      this.x = evt.stageX + this.offset.x; //this.x + evt.stageX_new - evt.stageX_old
      this.y = evt.stageY + this.offset.y;
      for (var i = 1; i <=4; i++) {
        this.parent.getChildByName("hp"+i).x = evt.stageX + this.parent.getChildByName("hp"+i).offset.x;
        this.parent.getChildByName("hp"+i).y = evt.stageY + this.parent.getChildByName("hp"+i).offset.y;
      }
      // indicate that the stage should be updated on the next tick
      update = true;

      syncLocalToData("change", this.parent);

      stage.update();
    });
    /*
    this.on("pressup", function (evt) {
        syncLocalToData("change", this.parent);
    });*/

    for (var i = 1; i <=4; i++) {
      this.parent.getChildByName("hp"+i).on("mouseover", function (evt) {
        reRangeLock = true;
        // stage.removeAllEventListeners("mousedown");
      });

      this.parent.getChildByName("hp"+i).on("mouseout", function (evt) {
        reRangeLock = false;
        // stage.addEventListener("mousedown", );
      });
    }
    this.parent.getChildByName("hp1").on("pressmove", function (evt) {
      this.parent.cp1.x = stage.mouseX - this.parent.getChildByName("draw").x;
      this.parent.cp1.y = stage.mouseY - this.parent.getChildByName("draw").y;
      syncLocalToData("change", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp2").on("pressmove", function (evt) {
      this.parent.cp2.x = stage.mouseX - this.parent.getChildByName("draw").x;
      this.parent.cp1.y = stage.mouseY - this.parent.getChildByName("draw").y;
      syncLocalToData("change", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp3").on("pressmove", function (evt) {
      this.parent.cp2.x = stage.mouseX - this.parent.getChildByName("draw").x;
      this.parent.cp2.y = stage.mouseY - this.parent.getChildByName("draw").y;
      syncLocalToData("change", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp4").on("pressmove", function (evt) {
      this.parent.cp1.x = stage.mouseX - this.parent.getChildByName("draw").x;
      this.parent.cp2.y = stage.mouseY - this.parent.getChildByName("draw").y;
      syncLocalToData("change", this.parent);
      changing = true;
      draw(focusGraph);
    });
    /*
    for (var i = 1; i <= 4; i++) {
      this.parent.getChildByName("hp"+i).on("pressup", function (evt) {
        syncLocalToData("change", this.parent);
      });
    }*/
  });
  // the pressmove event is dispatched when the mouse moves after a mousedown on the target until the mouse is released.
  
  g.getChildByName("draw").on("mouseover", function (evt){
    reRangeLock = true;
  });
  g.getChildByName("draw").on("rollover", function (evt){
    reRangeLock = true;
  });
  g.getChildByName("draw").on("rollout", function (evt){
    reRangeLock = false;
  });
}

function loseFocus() {
  focusGraph.getChildByName("draw").alpha = 1;
  focusGraph.getChildByName("draw").removeAllEventListeners("mousedown");
  focusGraph.getChildByName("draw").removeAllEventListeners("pressmove");
  focusGraph.getChildByName("draw").cursor = "pointer";
  for (var i = 1; i <=4; i++) {
    focusGraph.getChildByName("hp"+i).visible = false;
  }
  stage.update();
  focusGraph = null;
  $("button#delete-btn").attr("class", "button suit-jumbo button-circle button-raised");
}

function syncLocalToData(operate, g) { // used by shapes && lines && tips
  canvasData["operate"] = operate;
  canvasData["color"] = g.color;
  canvasData["shape"] = g.shape;
  canvasData["size"]  = g.size;
  canvasData["index"] = g.name;
  
  canvasData["cp1x"]  = g.cp1.x;
  canvasData["cp1y"]  = g.cp1.y;
  canvasData["cp2x"]  = g.cp2.x;
  canvasData["cp2y"]  = g.cp2.y;

  if (operate == "change") {
    canvasData["hp1x"]  = g.getChildByName("hp1").x;
    canvasData["hp1y"]  = g.getChildByName("hp1").y;

    canvasData["hp3x"]  = g.getChildByName("hp3").x;
    canvasData["hp3y"]  = g.getChildByName("hp3").y;

    if (canvasData["shape"] == "shape-circle" || canvasData["shape"] == "shape-square") {
      canvasData["hp2x"]  = g.getChildByName("hp2").x;
      canvasData["hp2y"]  = g.getChildByName("hp2").y;
      canvasData["hp4x"]  = g.getChildByName("hp4").x;
      canvasData["hp4y"]  = g.getChildByName("hp4").y;
    }
  }
  
  if (operate == "create") {
    canvas_container.addChild(g.clone());
    canvas_index++;
  }
}

function syncDataToLocal(cData) {
  if (focusGraph)
    loseFocus();
  if (cData["operate" == "change"]) { // change
    graph = canvas_container.getChildByName(cData["index"]);
    graph.cp1.x = cData["cp1x"];
    graph.cp1.y = cData["cp1y"];
    graph.cp2.x = cData["cp2x"];
    graph.cp2.y = cData["cp2y"];
    draw(graph);
  }
  else {  // create
    prepareGraph(cData["color"], cData["shape"], cData["size"], cData["index"], cData["cp1x"], cData["cp1y"]);
    graph.cp2 = {x: cData["cp2x"], y: cData["cp2y"]};
    changing = false;
    if (shape != "tip") {
      draw(graph);
    }

    canvas_container.addChild(graph);
    canvas_index == cData["index"] + 1;
    prepareShape(graph);
  }
}

// by 治平.