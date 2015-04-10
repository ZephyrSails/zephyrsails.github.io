// Load the var.
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
  lt_purple : "rgb(164, 158, 240)",
  hp_shadow : "rgb(144, 144, 144)",
  hp_edge   : "rgb(254, 254, 254)"
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
  hitpoint        : 7,
  hitpoint_edge   : 3,
  hitpoint_shadow : 3
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
  tip_font: "24px SimHei",
  word_font:"18px Arial"
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
  x:      "",
  y:      "",
  word:   "",
  height: "",
  width:  "", 
};
var isMoved;
var canvas_buffer = [];
var canvas_index = 0;
var canvas_current_index = canvas_index;

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

var wordLength;
var word;
var wordHeight;
var wordX;
var wordY;
var wordGraph;


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

    stage.addEventListener("stagemousedown", wordMouseDown);
    stage.addEventListener("stagemouseup", wordMouseUp);
    //stage.addEventListener("stagemousedown", wordClick);
  });

  $("ul#pencil-selection li").click(function(){ // what would happen when pencil-btn clicked
    current_function = "button#pencil-btn";
    $(current_function).html("<i class='" + $(this).children("a").children("i").attr("class")
      + "'></i>\n" + "<i class='fa fa-caret-down'></i>");
    update_dashboard($(current_function));
    stage.removeAllEventListeners();

    if (focusGraph)
      loseFocus();

    if($(this).attr("id")=="pen-eraser") {
      shape = "eraser";
      // stage.addEventListener("stagemousedown", eraserMouseDown);
      // stage.addEventListener("stagemouseup", eraserMouseUp);
    }
    else {
      shape = "pencil";
    }
    stage.addEventListener("stagemousedown", drawMouseDown);
    stage.addEventListener("stagemouseup", drawMouseUp);
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
    shape = tip;
    update_dashboard($(current_function));
    stage.removeAllEventListeners();

    stage.addEventListener("stagemousedown", shapeMouseDown);
    stage.addEventListener("stagemouseup", shapeMouseUp);
  });
  // colors-button control
  $("ul#color-selection li").click(function(){
    $("a#colors-btn").attr("class", $(this).children("a").attr("class"));
    color = $(this).attr("id");
    update_dashboard($(current_function));
  });

  $("ul#size-selection li").click(function(){
    $("a#size-btn").html("<i class='" + 
      $(this).children("a").children("i").attr("class") + "'></i>");
    size = $(this).attr("id");
  });

  $("button#delete-btn").click(function(){
    if(focusGraph) {
      // focusGraph.uncache();
      syncLocalToData("delete", focusGraph);
      eliminate(focusGraph);
    }
  });
});

function update_dashboard(current_func) {
  // by the way, this is the second way to locate a child (or all children).
  $("div#div-function >> button").attr("style", "background-color:" + colors[default_color] + ";");
  $("div#div-function >>> button").attr("style", "background-color:" + colors[default_color] + ";");
  current_func.attr("style", "background-color:" + colors["lt_"+color] + ";");
  // alert(color);
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
  //var text = new createjs.Text("Hello World", "20px Arial", "#ff7700");
  //text.x = 100;
  //text.textBaseline = "alphabetic";

  pencil.cache(0,0,500,400);
 //  pencil.addChild(text);
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
  wordFocus();
  
  // stroke = sizes[size];
  stroke = (sizes[size]*3);
  oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
  prepareGraph(color, shape, size, "", oldPt.x, oldPt.y);
  oldMidPt = oldPt.clone();

  stage.addEventListener("stagemousemove", drawMouseMove);
}

function drawMouseMove(event) {
  var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, 
    oldPt.y + stage.mouseY >> 1);

  // prepareGraph(color, "", size, "", oldPt.x, oldPt.y);
  graph.cp2 = {x: oldMidPt.x, y: oldMidPt.y};
  graph.x = midPt.x;
  graph.y = midPt.y;
  graph.cp1.x = oldPt.x;
  graph.cp1.y = oldPt.y;
  syncLocalToData("draw", graph);

  var stroke = (graph.shape == "pencil")?sizes[size]:sizes[size]*3;
  pencil.graphics.setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(colors[color]).moveTo(midPt.x, midPt.y)
    .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

  oldPt.x = stage.mouseX;
  oldPt.y = stage.mouseY;

  oldMidPt.x = midPt.x;
  oldMidPt.y = midPt.y;

  if (graph.shape == "pencil")
    pencil.updateCache("source-over");
  else if (graph.shape == "eraser")
    pencil.updateCache("destination-out");
  pencil.graphics.clear();
  stage.update();
}

function drawMouseUp(event) {
  stage.removeEventListener("stagemousemove", drawMouseMove);
}

// following three handler are used by shape
// -----------------------------------------
function shapeMouseDown(event) { // the begining of a drawing
  if (reRangeLock)  // 是否正在调整图形？
    return;
  if (focusGraph)
    loseFocus();
  wordFocus();
  prepareGraph(color, shape, size, canvas_index, stage.mouseX, stage.mouseY);
  stage.addEventListener("stagemousemove", shapeMouseMove);
}
function shapeMouseMove(event) {
  graph.cp2 = {x: stage.mouseX, y: stage.mouseY};
  changing = false;
  if (shape != "yes" && shape != "no" && shape != "why" && shape != "wow" && shape != "love")
    draw(graph);
}
function shapeMouseUp(event) {
  if (reRangeLock)  // 是否正在调整图形？
    return;
  stage.removeEventListener("stagemousemove", shapeMouseMove);
  if (graph.jobDone == true)
  {
    syncLocalToData("create", graph);
    graph.jobDone = false;
  }
  
  addShapeFunction(graph);
  // alert(canvas_index);
  // reRangeLock = false;
}

function wordMouseDown(event) { // the begining of a drawing
  if (reRangeLock)  // 是否正在调整图形？
    return;
  if (focusGraph)
    loseFocus();
  //prepareGraph(color, "shape-square", size, canvas_index, stage.mouseX, stage.mouseY);
  wordFocus();
  graph = new createjs.Container(); // 用来盛放独立图形的容器
  graph.cp1 = {x: stage.mouseX , y: stage.mouseY};
  var drawG;
  drawG = new createjs.Shape(); // 最终绘制的图形（display）
  drawG.name = "draw";
  graph.addChild(drawG);
  stage.addChild(graph);
  

  stage.addEventListener("stagemousemove", wordMouseMove);
}
function wordMouseMove(event) {
  graph.cp2 = {x: stage.mouseX, y: stage.mouseY};
  var g = graph.getChildByName("draw");
  changing = false;
  g.graphics.clear().setStrokeStyle(sizes["small"]).beginStroke(colors[color])
        .drawRect(graph.cp1.x, graph.cp1.y, graph.cp2.x-graph.cp1.x, graph.cp2.y-graph.cp1.y);
  stage.update();
  graph.jobDone = true;
  //draw.graphics.clear().setStrokeStyle(sizes[g.size]).beginStroke(colors[g.color])
        //.drawRoundRect(g.cp1.x, g.cp1.y, g.cp2.x-g.cp1.x, g.cp2.y-g.cp1.y, 7);
}
function wordMouseUp(event) {
  if (reRangeLock)  // 是否正在调整图形？
    return;
  if (!graph.jobDone) {
    stage.removeEventListener("stagemousemove", wordMouseMove);
    graph.jobDone = false;
    return;
  }
  else
    graph.jobDone = false;
  stage.removeEventListener("stagemousemove", wordMouseMove);
  wordX = graph.cp1.x;
  wordY = graph.cp1.y;
  wordLength = graph.cp2.x-graph.cp1.x;
  wordHeight = graph.cp2.y-graph.cp1.y;
  stage.removeChild(graph);
  getTextarea(0,0,0,0,0);
}

function wordFocus(){
  if(wordGraph){
    if(wordGraph.value==""){
    
      document.body.removeChild(wordGraph);
      
    }
    else{
      word = wordGraph.value;
      wordLength = wordGraph.clientWidth;
      wordHeight = wordGraph.clientHeight;
    
      if(!focusGraph){
        cp1x = wordGraph.id;
        cp1y = wordGraph.name;
        cp2x = parseFloat(wordGraph.id) + wordLength;
        cp2y = parseFloat(wordGraph.name) + wordHeight;
        prepareWordGraph(cp1x,cp2x,cp1y,cp2y,word,canvas_index,tips["word_font"],"word", color);  
      
        drawWord(graph);
        addWordFunction(graph);
        
        syncLocalToData("write", graph);
      }
      else{
        focusGraph.cp1.x = parseFloat(focusGraph.getChildByName("draw").x);
        focusGraph.cp1.y = parseFloat(focusGraph.getChildByName("draw").y);
        focusGraph.cp2.x = parseFloat(focusGraph.getChildByName("draw").x) + wordLength;
        focusGraph.cp2.y = parseFloat(focusGraph.getChildByName("draw").y) + wordHeight; 
        focusGraph.word = word;

        focusGraph.color = color;
        focusGraph.lineWidth = wordLength;

        drawWord(focusGraph);
        focusGraph.visible = true;
        syncLocalToData("writeChanging", focusGraph);
      }
      document.body.removeChild(wordGraph);
      stage.update();
    }
    wordGraph = null;
  }
}

function getTextarea(x,y,px,py,g){
  var newTip = document.createElement("textarea");
  wordGraph = newTip;
  // tip = document.getElementById("testi");
  $(newTip).attr("class", tips[tip] + sizes["small_tip"]);
  // alert(newTip.attr("class"));
  //alert(tip+"_color");
  
  $(newTip).attr("style", "color:" + colors[color] + " ;font: Arial ; font-size:18px; line-height:18px");
  $(newTip).css("width",wordLength);
  $(newTip).css("height",wordHeight);
  
  if(x!=0 || y!=0){
   $(newTip).text(g.word);
  }
  // $(newTip).autosize();

  domElement = new createjs.DOMElement(newTip); //addshapefunction(domElement);
  if(x==0 && y==0){
    domElement.x = wordX;
    domElement.y = wordY;
    //domElement.x = stage.mouseX - sizes[size+"_tipSize"];
    //domElement.y = stage.mouseY - sizes[size+"_tipSize"];
  }
  else{
    domElement.x = px;
    domElement.y = py;
  }
  $(newTip).attr("id",domElement.x);
  $(newTip).attr("name",domElement.y);
  document.body.insertBefore(newTip, document.getElementById("canvasDiv"));
  if(x!=0 || y!=0){
    $(newTip).css("width",g.width);
    $(newTip).css("height",g.height);
  }
  //stage.autoClear = true;
  stage.addChild(domElement);
  stage.update();
}

function prepareWordGraph(cp1x,cp2x,cp1y,cp2y,word,idx,size,shp,col){
  graph = new createjs.Container();

  graph.hasFunction = false;
  // ============================================================
  graph.name  = idx;
  graph.word  = word;
  graph.size  = size;
  graph.shape = shp;
  graph.color = col;
  
  // control point: 控制点位置，记录着图形左上和右下两脚的位置。（对箭头则是起点和终点）（text）
  graph.cp1   = {x: cp1x, y: cp1y};
  graph.cp2   = {x: cp2x, y: cp2y};
  graph.width = graph.cp2.x - graph.cp1.x;
  graph.height = graph.cp2.y - graph.cp1.y;
  // hit point: 拖动点，通过四个拖动点来修改图形。（对箭头则是起点和终点）（display）
  var hp = [new createjs.Shape(), new createjs.Shape(), new createjs.Shape(), new createjs.Shape()];
  drawG = new createjs.Text(word,size, colors[col]);

  //drawG.maxWidth = 200 ;
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

  stage.addChild(graph);
  stage.update();

}

function addWordFunction(g){
  g.getChildByName("draw").on("dblclick",function (evt){
    g.visible = false;
    syncLocalToData("writeChanging", g);
    getTextarea(parseFloat(this.x),parseFloat(this.y),parseFloat(this.x) + parseFloat(this.parent.x),parseFloat(this.y) + parseFloat(this.parent.y),this.parent);
  
  });
  g.getChildByName("draw").on("click", function (evt) { // focus
    wordFocus();
    getFocus(this);
     
    for (var i = 1; i <=4; i++) {
      this.parent.getChildByName("hp"+i).on("mouseover", function (evt) {
        reRangeLock = true;
      });
      this.parent.getChildByName("hp"+i).on("mouseout", function (evt) {
        reRangeLock = false;
      });
    }
    this.parent.getChildByName("hp1").on("pressmove", function (evt) {
      this.parent.cp1.x = stage.mouseX - this.parent.x;
      changing = true;
      if(parseFloat(this.parent.cp2.x) > parseFloat(this.parent.cp1.x)){
        drawWord(focusGraph);  
      }
      else{
        this.parent.cp1.x = parseFloat(this.parent.cp2.x) - g.getChildByName("draw").getMeasuredWidth();
        drawWord(focusGraph); 
      }
      syncLocalToData("writeChanging", this.parent);
    });
    this.parent.getChildByName("hp2").on("pressmove", function (evt) {
      this.parent.cp2.x = stage.mouseX - this.parent.x; 
      
      changing = true;
      if(parseFloat(this.parent.cp2.x) > parseFloat(this.parent.cp1.x)){
        drawWord(focusGraph);  
      }

      syncLocalToData("writeChanging", this.parent);
      
    });
    
    
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

function drawWord(g){
  var draw = g.getChildByName("draw");
  var hp1  = g.getChildByName("hp1");
  var hp2  = g.getChildByName("hp2");

  draw.cursor = "pointer";
  hp1.cursor = "crosshair";
  hp2.cursor = "crosshair";
  
  
  var sqrtS = Math.sqrt(sizes[g.size]);

  g.width = parseFloat(g.cp2.x) - parseFloat(g.cp1.x);
  

  draw.text = g.word;
  draw.x = g.cp1.x;
  draw.y = g.cp1.y;
  draw.lineWidth = g.width;

  g.height = draw.getMeasuredHeight();

  var hitWordArea = new createjs.Shape();
  hitWordArea.graphics.beginFill("#FFF").drawRect(0, 0, draw.lineWidth,draw.getMeasuredHeight());
  draw.hitArea = hitWordArea;

  hp1.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
  hp2.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp1.y, sizes["hitpoint"]);

  var hpShadow = new createjs.Shadow(colors["shadow"], 0, 0, sizes["hitpoint_shadow"]);
  hp1.shadow = hpShadow;
  hp2.shadow = hpShadow;

  g.jobDone = true;
  stage.update();
}


function draw(g) {  // used to draw a picture.
  var draw = g.getChildByName("draw");
  var hpShadow = new createjs.Shadow(colors["shadow"], 0, 0, sizes["hitpoint_shadow"]);
  if (g.shape != "yes" && g.shape != "no" && g.shape != "why" && g.shape != "wow" && g.shape != "love" || changing == true) {
    var hp1  = g.getChildByName("hp1");
    var hp2  = g.getChildByName("hp2");
    var hp3  = g.getChildByName("hp3");
    var hp4  = g.getChildByName("hp4");

    draw.cursor = "pointer";
    hp1.cursor = "crosshair";
    hp2.cursor = "crosshair";
    hp3.cursor = "crosshair";
    hp4.cursor = "crosshair";
    hp1.shadow = hpShadow;
    hp2.shadow = hpShadow;
    hp3.shadow = hpShadow;
    hp4.shadow = hpShadow;
    // alert("?")
    var sqrtS = Math.sqrt(sizes[g.size]);
  }
  // alert("?")
  switch (g.shape) {
    case("shape-circle"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size]).beginStroke(colors[g.color])
        .drawEllipse(g.cp1.x, g.cp1.y, (g.cp2.x-g.cp1.x), (g.cp2.y-g.cp1.y));

      hp1.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      // hp1.graphics.clear().beginFill(colors[g.color]).drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp2.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      hp4.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("shape-square"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size]).beginStroke(colors[g.color])
        .drawRoundRect(g.cp1.x, g.cp1.y, g.cp2.x-g.cp1.x, g.cp2.y-g.cp1.y, 7);
      hp1.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp2.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      hp4.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp2.y, sizes["hitpoint"]);
      break;
    case("shape-line"):
      draw.graphics.clear().setStrokeStyle(sizes[g.size], 1).beginStroke(colors[g.color]).moveTo(g.cp1.x, g.cp1.y).lineTo(g.cp2.x, g.cp2.y);
      hp1.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
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

      hp1.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp1.x, g.cp1.y, sizes["hitpoint"]);
      hp3.graphics.clear().setStrokeStyle(sizes["hitpoint_edge"])
        .beginFill(colors[g.color]).beginStroke(colors["hp_edge"])
        .drawCircle(g.cp2.x, g.cp2.y, sizes["hitpoint"]);
      break;
    default:
      // alert("tip " + g.cp1.x + " " + g.cp1.y + " " +g.shape + tips[g.shape] + tips["tip_font"] + tips[g.shape+"_color"] + tips[g.shape+"_color"]);
      // var draw = new createjs.Container();
      var tip_circle = new createjs.Shape();
      var tip_word = new createjs.Text(tips[g.shape], tips["tip_font"], tips[g.shape+"_color"]);
      tip_circle.graphics.clear().setStrokeStyle(5).beginStroke(tips[g.shape+"_color"]).drawCircle(g.cp1.x, g.cp1.y, 15);
      // tip_container.name = "draw";
      draw.addChild(tip_circle, tip_word);
      draw.cursor = "pointer";

      tip_word.x = g.cp1.x - tips[g.shape+"_x"];
      tip_word.y = g.cp1.y - tips[g.shape+"_y"];

      var hitArea = new createjs.Shape();
      hitArea.graphics.beginFill("#FFF").drawCircle(g.cp1.x, g.cp1.y, 15);
      tip_circle.hitArea = hitArea;

      // draw.shadow = hpShadow;
      // alert(tip_word.x + tip_word.x);
  }
  g.jobDone = true;
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
  if (graph.shape == "yes" || graph.shape == "no" || graph.shape == "why" || graph.shape == "wow" || graph.shape == "love") {
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

  // 把容器放上舞台，登场。
  stage.addChild(graph);
  if (graph.shape == "yes" || graph.shape == "no" || graph.shape == "why" || graph.shape == "wow" || graph.shape == "love") {
    changing = false;
    draw(graph);
  }
}

function addShapeFunction(g) {
  g.getChildByName("draw").on("click", function (evt) { // focus

    wordFocus();
    getFocus(this);
    for (var i = 1; i <=4; i++) {
      this.parent.getChildByName("hp"+i).on("mouseover", function (evt) {
        reRangeLock = true;
      });
      this.parent.getChildByName("hp"+i).on("mouseout", function (evt) {
        reRangeLock = false;
      });
    }
    this.parent.getChildByName("hp1").on("pressmove", function (evt) {
      this.parent.cp1.x = stage.mouseX - this.parent.x;
      this.parent.cp1.y = stage.mouseY - this.parent.y;
      syncLocalToData("reshape", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp2").on("pressmove", function (evt) {
      this.parent.cp2.x = stage.mouseX - this.parent.x;
      this.parent.cp1.y = stage.mouseY - this.parent.y;
      syncLocalToData("reshape", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp3").on("pressmove", function (evt) {
      this.parent.cp2.x = stage.mouseX - this.parent.x;
      this.parent.cp2.y = stage.mouseY - this.parent.y;
      syncLocalToData("reshape", this.parent);
      changing = true;
      draw(focusGraph);
    });
    this.parent.getChildByName("hp4").on("pressmove", function (evt) {
      this.parent.cp1.x = stage.mouseX - this.parent.x;
      this.parent.cp2.y = stage.mouseY - this.parent.y;
      syncLocalToData("reshape", this.parent);
      changing = true;
      draw(focusGraph);
    });
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
  });$
}

function loseFocus() {
  
  if (!focusGraph)
    return;
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

function getFocus(shap) {
  if (focusGraph)
      loseFocus();

  reRangeLock = true;

  $("button#delete-btn").attr("class", "button button-circle button-highlight button-raised");

  shap.cursor = "move";
  for (var i = 1; i <= 4; i++) {
    shap.parent.getChildByName("hp"+i).visible = true;
  }
  
  // stage.autoClear = true;
  focusGraph = shap.parent;
  canvas_current_index = focusGraph.name;
  focusGraph.getChildByName("draw").alpha = 0.5;

  stage.update();

  shap.on("mousedown", function (evt) { 
    //this.parent.addChild(this);
    this.parent.offset = {x: this.parent.x - evt.stageX, y: this.parent.y - evt.stageY};
    /*
    for (var i = 1; i <=4; i++) {
      this.parent.getChildByName("hp"+i).offset = {x: this.parent.getChildByName("hp"+i).x - evt.stageX, y: this.parent.getChildByName("hp"+i).y - evt.stageY};
    }*/
    shap.on("pressup", function (evt) {
      if (isMoved == true){
        syncLocalToData("change", this.parent);
        this.removeAllEventListeners("pressup");
      }
      isMoved = false;
    });
  });
  shap.on("pressmove", function (evt) {
    this.parent.x = evt.stageX + this.parent.offset.x;
    this.parent.y = evt.stageY + this.parent.offset.y;
    isMoved = true;
    update = true;

    // syncLocalToData("change", this.parent);
    stage.update();    
  });
}

function syncLocalToData(operate, g) { // used by shapes && lines && tips
  canvasData["operate"] = operate;
  canvasData["index"] = g.name;

  canvasData["color"] = g.color;
  canvasData["shape"] = g.shape;
  canvasData["size"]  = g.size;
  canvasData["cp1x"]  = g.cp1.x;
  canvasData["cp1y"]  = g.cp1.y;

  if (operate == "draw")
  {
    canvasData["x"]   = g.x;
    canvasData["y"]   = g.y;
  }

  if (g.shape != "yes" && g.shape != "no" && g.shape != "why" && g.shape != "wow" && g.shape != "love") {
    canvasData["cp2x"]  = g.cp2.x;
    canvasData["cp2y"]  = g.cp2.y;
  }
  
  if (operate == "change") {
    canvasData["x"] = g.x;
    canvasData["y"] = g.y;
    // canvas_container.addChild(g.clone());
  }
  // alert(dataChannels);
  if (operate == "create") {
    canvas_buffer[canvas_index] = graph;
    canvas_index++;
  }
  if(operate == "write"){
    canvas_buffer[canvas_index] = graph;
    canvas_index++;
    canvasData["cp2x"]  = g.cp2.x;
    canvasData["cp2y"]  = g.cp2.y;
    canvasData["word"]  = g.word;
    canvasData["width"] = g.width;
    canvasData["height"] = g.height;
  }
  if(operate == "writeChanging"){

    canvasData["cp2x"]  = g.cp2.x;
    canvasData["cp2y"]  = g.cp2.y;
    canvasData["word"]  = g.word;
    canvasData["width"] = g.width;
    canvasData["height"] = g.height;
    canvasData["visible"] = g.visible;
  }
  /*
  for (var ID in dataChannels){
    dataChannels[ID].send(JSON.stringify(canvasData));
  }*/
}
function syncDataToLocal(cData) {
  
  if (cData["operate"] == "change") { // change
    canvas_buffer[cData["index"]].x = cData["x"]; //this.x + evt.stageX_new - evt.stageX_old
    canvas_buffer[cData["index"]].y = cData["y"];
    stage.update();
    // alert("?");
  }
  if (cData["operate"] == "draw") {

    var stroke = (cData["shape"] == "pencil")?sizes[cData["size"]]:sizes[cData["size"]]*3;

    pencil.graphics.setStrokeStyle(stroke, 'round', 'round')
    .beginStroke(colors[cData["color"]]).moveTo(cData["x"], cData["y"])
    .curveTo(cData["cp1x"], cData["cp1y"], cData["cp2x"], cData["cp2y"]);

    if (cData["shape"] == "pencil")
      pencil.updateCache("source-over");
    else if (cData["shape"] == "eraser")
      pencil.updateCache("destination-out");
    pencil.graphics.clear();
    stage.update();
  }

  if (cData["operate"] == "reshape") {
    changing = true;
    // alert("hel");
    canvas_buffer[cData["index"]].cp1.x = cData["cp1x"];
    canvas_buffer[cData["index"]].cp1.y = cData["cp1y"];
    canvas_buffer[cData["index"]].cp2.x = cData["cp2x"];
    canvas_buffer[cData["index"]].cp2.y = cData["cp2y"];
    draw(canvas_buffer[cData["index"]]);
  }
  if (cData["operate"] == "create") {  // create
    canvas_index = cData["index"];
    canvas_index++;
    prepareGraph(cData["color"], cData["shape"], cData["size"], cData["index"], cData["cp1x"], cData["cp1y"]);
    // graph.cp1 = {x: cData["cp1x"], y: cData["cp1y"]};
    if (cData["shape"] != "yes" && cData["shape"] != "no" && cData["shape"] != "why" && cData["shape"] != "wow" && cData["shape"] != "love") {
      graph.cp2 = {x: cData["cp2x"], y: cData["cp2y"]};
    }
    changing = false;

    canvas_buffer[cData["index"]] = graph;
    // canvas_index++;
    // alert("cle");
    draw(graph);
    // }
    addShapeFunction(graph);
  }
  if (cData["operate"] == "write"){
    canvas_index = cData["index"];
    canvas_index++;
    prepareWordGraph(cData["cp1x"],cData["cp2x"],cData["cp1y"],cData["cp2y"],cData["word"],cData["index"],cData["size"],cData["shape"],cData["color"],cData["width"],cData["height"])
    changing = false;
    canvas_buffer[cData["index"]] = graph;
    drawWord(graph);
    addWordFunction(graph);
  }

  if (cData["operate"] == "writeChanging"){
    changing = true;
    canvas_buffer[cData["index"]].cp1.x = cData["cp1x"];
    canvas_buffer[cData["index"]].cp1.y = cData["cp1y"];
    canvas_buffer[cData["index"]].cp2.x = cData["cp2x"];
    canvas_buffer[cData["index"]].cp2.y = cData["cp2y"];
    canvas_buffer[cData["index"]].word = cData["word"];
    canvas_buffer[cData["index"]].width = cData["width"];
    canvas_buffer[cData["index"]].height = cData["height"];
    canvas_buffer[cData["index"]].visible = cData["visible"];
    drawWord(canvas_buffer[cData["index"]]);
  }
}

function handleCanvas(message, peerID, peerUsername) {
  if (message["operate"] == "delete") {
    eliminate(canvas_buffer[message["index"]]);
    return;
  }
  syncDataToLocal(message);
}

function eliminate(shp) {
  stage.removeChild(shp);
  delete canvas_buffer[shp.name];
  loseFocus();
  stage.update();
}


// by 治平.