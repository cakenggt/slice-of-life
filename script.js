function mod(n, m) {
  return ((n%m)+m)%m;
}

var xWidth;
var zWidth;
var yWidth;
var maxWidth;
var pixelsPerBlock;
var playerWidth;
//this canvas is drawn on and hidden
var realCanvas;
var canvasContext;
//This canvas is displayed
var displayedCanvas;
var displayedCanvasContext;
var keyState = {};
var realSprite;
var reverseSprite;
//in px
var spriteWidth;
var spriteHeight;
//one divided by this number
var interval;
var lastLoopTime;
//player jump given by map
var speed;
//in blocks, calculated from speed
var jumpSpeed;
//calculated from speed
var movementSpeed;
var acceleration;
var gravity;
var mapMap = {
  "Map 1":{url:"maps/map1.js", next:"Map 2"},
  "Map 2":{url:"maps/map2.js", next:"Map 3"},
  "Map 3":{url:"maps/map3.js"}
};
var currentMap = "Map 1";
var won = false;
var spriteReversed = false;
var climbableBlocks;
var totalLogTime = 0;
var totalLogIt = 0;

function loadNextMap(){
  loadMap(mapMap[currentMap].next);
  currentMap = mapMap[currentMap].next;
}

function loadMap(mapName){
  var url = mapMap[mapName].url;
  $.getScript(url, loadAttributes);
}

function loadAttributes(){
  $('#next').hide();
  xWidth = map[0].length;
  zWidth = map[0][0].length;
  yWidth = map.length;
  maxWidth = Math.sqrt(Math.pow(xWidth, 2) + Math.pow(zWidth, 2));
  pixelsPerBlock = realCanvas.width/maxWidth;
  $('#sprite').load(function(){
    realSprite = $(this).get(0);
    //blocks multiplied by pixels to get pixels
    spriteWidth = playerWidth*pixelsPerBlock;
    spriteHeight = (spriteWidth/realSprite.width)*realSprite.height;
  });
  $('#sprite-reverse').load(function(){
    reverseSprite = $(this).get(0);
  });
  jumpSpeed = speed*0.18;
  won = false;
  drawCanvas();
}

//load all variables
$(function(){
  displayedCanvas = $('canvas').get(0);
  realCanvas = document.createElement('canvas');
  resizeCanvas();
  canvasContext = realCanvas.getContext('2d');
  displayedCanvasContext = displayedCanvas.getContext('2d');
  loadAttributes();

  $(document).on('keydown', function(data){
    keyState[data.keyCode || data.which] = true;
    console.log(data.keyCode);
  });
  $(document).on('keyup', function(data){
    keyState[data.keyCode || data.which] = false;
  });
  $('#next').on('click', loadNextMap);

  lastLoopTime = getTime();
  gameLoopFunction();
});

function gameLoopFunction(timestamp){
  interval = timestamp - lastLoopTime;
  lastLoopTime = timestamp;

  movementSpeed = speed*0.004*interval;
  gravity = speed*0.0005*interval;
  acceleration = movementSpeed/4;

  requestAnimationFrame(gameLoopFunction);

  if (map[Math.floor(position.y)][Math.floor(position.x)][Math.floor(position.z)].goal){
    won = true;
  }
  var winText = won ? ' You Won!!!' : '';
  //$('h1').html(Math.floor(position.deg)+'&deg' + winText);
  $('h1').html(winText);
  if (won && mapMap[currentMap].next){
    var next = mapMap[currentMap].next;
    $('#next').text('Next map:' + mapMap[currentMap].next);
    $('#next').show();
  }
  //console.log(Math.floor(position.y) + ', ' + Math.floor(position.x) + ', ' + Math.floor(position.z));
  //console.log(map[Math.floor(position.y)][Math.floor(position.x)][Math.floor(position.z)]);
  //gravity engine
  position.vel.y = position.vel.y > -gravity*10 ? position.vel.y - gravity : position.vel.y;
  var newY = position.y+position.vel.y;
  if (canMoveHere(position.x, newY, position.z)){
    if (canMoveHere(position.x, newY+(spriteHeight/pixelsPerBlock), position.z)){
      position.y = newY;
    }
    else{
      //cancel jump when you hit your head
      position.vel.y = 0;
    }
  }
  else{
    //cancel gravity when you cant move down
    position.vel.y = 0;
    if (position.y%1 !== 0){
      position.y = Math.floor(position.y);
    }
  }
  //movement
  var newX = position.x+position.vel.x;
  var newZ = position.z+position.vel.z;
  /*
  Check to make sure that the player isn't jumping their head through anything.
  Also check to make sure the player won't collide with anything on either side.
  Also do block climbing calculations.
  */
  for (var i = 0; i <= climbableBlocks; i++){
    if (canMoveHere(newX, position.y+(spriteHeight/pixelsPerBlock)+i, newZ) &&
      canMoveHere(newX, position.y+i, newZ)){
      position.x = newX;
      position.z = newZ;
      if (i > 0){
        position.y = Math.floor(position.y+1);
      }
      break;
    }
  }

  //key controls
  var x;
  var z;
  if (keyState[69]){
    //rotate anticlockwise
    position.deg = mod(position.deg - 1.001,360);
    //If turning puts the player into a wall, move them 1/3 of the way
    //to the center of the block
    if (!canMoveHere(position.x, position.y, position.z)){
      position.x -= (position.x-((Math.floor(position.x/speed)+0.5)*speed))/3;
      position.z -= (position.z-((Math.floor(position.z/speed)+0.5)*speed))/3;
    }
    drawCanvas();
  }
  else if (keyState[81]){
    //rotate clockwise
    position.deg = mod(position.deg + 1.001,360);
    //If turning puts the player into a wall, move them 1/3 of the way
    //to the center of the block
    if (!canMoveHere(position.x, position.y, position.z)){
      position.x -= (position.x-((Math.floor(position.x/speed)+0.5)*speed))/3;
      position.z -= (position.z-((Math.floor(position.z/speed)+0.5)*speed))/3;
    }
    drawCanvas();
  }
  if (keyState[39] || keyState[68]){
    //go right
    spriteReversed = false;
    x = position.vel.length() < movementSpeed ? position.vel.x + acceleration*Math.cos(getRadians()) : movementSpeed*Math.cos(getRadians());
    z = position.vel.length() < movementSpeed ? position.vel.z + acceleration*Math.sin(getRadians()) : movementSpeed*Math.sin(getRadians());
    position.vel.x = x;
    position.vel.z = z;
  }
  else if (keyState[37] || keyState[65]){
    //go left
    spriteReversed = true;
    x = position.vel.length() < movementSpeed ? position.vel.x - acceleration*Math.cos(getRadians()) : -movementSpeed*Math.cos(getRadians());
    z = position.vel.length() < movementSpeed ? position.vel.z - acceleration*Math.sin(getRadians()) : -movementSpeed*Math.sin(getRadians());
    position.vel.x = x;
    position.vel.z = z;
  }
  else{
    //movement slowdown
    position.vel.x *= 1/2;
    position.vel.z *= 1/2;
  }
  if (keyState[38]  || keyState[87]){
    //jump
    if (!canMoveHere(position.x, position.y-0.001, position.z)){
      position.vel.y = jumpSpeed;
    }
  }
  else{
    if (position.vel.y > 0){
      position.vel.y *= 1/2;
    }
  }
  drawSprite();
}

/*
Checks for collision on the left and right of provided point. 1/2 of
sprite width is added and subtracted from the line slope to get these
points.
*/
function canMoveHere(x, y, z){
  if (y > yWidth || y < 0){
    return false;
  }
  //points to left and right
  var points = [];
  var spriteBlockWidth = spriteWidth/pixelsPerBlock;
  var halfSpriteWidth = spriteBlockWidth/2;
  points.push(new point(x, z));
  points.push(new point(x+(Math.cos(getRadians())*halfSpriteWidth), z+(Math.sin(getRadians())*halfSpriteWidth)));
  points.push(new point(x-(Math.cos(getRadians())*halfSpriteWidth), z-(Math.sin(getRadians())*halfSpriteWidth)));
  for (var pointIt = 0; pointIt < points.length; pointIt++){
    var selPoint = points[pointIt];
    var canMove = selPoint.x < xWidth && selPoint.x >= 0 &&
      selPoint.z < zWidth && selPoint.z >= 0;
    canMove = canMove && !map[Math.floor(y)][Math.floor(selPoint.x)][Math.floor(selPoint.z)].solid;
    if (!canMove){
      return false;
    }
  }
  return true;
}

//point object
function point(x, z){
  this.x = x;
  this.z = z;
  this.distance = function(other){
    return Math.sqrt(Math.pow(other.x-x, 2) + Math.pow(other.z-z, 2));
  };
}

//line object
function line(slope, zOffset){
  this.slope = slope;
  this.zOffset = zOffset;
  this.getPointGivenX = function(x){
    //Gets the point on this line at a certain x value
    return new point(x, (slope*x)+zOffset);
  };
  this.getPointGivenZ = function(z){
    //Gets the point on this line at a certain z value
    return new point((z-zOffset)/slope, z);
  };
}

//Returns the degrees in the global position variable in radians
function getRadians(){
  return position.deg*(Math.PI/180);
}

/*
Calculates the line that the player's slice represents, and which direction
the player is looking (positive means that X increases in front of the player).
At 90 degrees, direction is positive, at 270 direction is negative.

Returns a map where the keys are:
[line, direction(-1 or 1)]
*/
function getSliceAttributes(){
  var result = {};
  var slope = Math.tan(getRadians());
  var zOffset = position.z-(slope*position.x);
  result.line = new line(slope, zOffset);
  result.direction = position.deg > 90 && position.deg <= 270 ? -1 : 1;
  return result;
}

/*
Gets the list of colored rectangles for the given y level

Returns map where mapWidth is the width of the map and
recList are maps with the rectangle width, and color.
*/
function getColorLine(y){
  var result = {};
  //Get the start and end points of the line of colored rectangles
  var sliceAttributes = getSliceAttributes();
  var xIntercept = sliceAttributes.line.getPointGivenX(0);
  var zIntercept = sliceAttributes.line.getPointGivenZ(0);
  var xEnd = sliceAttributes.line.getPointGivenX(xWidth);
  var zEnd = sliceAttributes.line.getPointGivenZ(zWidth);
  var boundPointList = [xIntercept, zIntercept, xEnd, zEnd];
  for (var r = boundPointList.length-1; r >= 0; r--){
    var selectedPoint = boundPointList[r];
    if (selectedPoint.x > xWidth || selectedPoint.x < 0 ||
      selectedPoint.z > zWidth || selectedPoint.z < 0){
      boundPointList.splice(r, 1);
    }
  }
  var leftPoint = boundPointList.sort(function(a, b){
    return a.x-b.x;
  })[0];
  var rightPoint = boundPointList.sort(function(a, b){
    return b.x-a.x;
  })[0];
  var startPoint = sliceAttributes.direction == 1 ? leftPoint : rightPoint;
  var endPoint = sliceAttributes.direction == 1 ? rightPoint : leftPoint;
  var mapWidth = endPoint.distance(startPoint);
  //This is the width of the map, which will sometimes have air on either side
  result.mapWidth = mapWidth;
  //This is how deep the player is into the map
  result.playerDeepness = new point(position.x, position.z).distance(startPoint);
  var recList = [];
  var pointList = [];
  var intercept = null;
  //get all of the intercept points on the line
  for (var x = 0; x <= xWidth; x++){
    intercept = sliceAttributes.line.getPointGivenX(x);
    if (intercept.z > 0 && intercept.z <= zWidth){
      pointList.push(intercept);
    }
  }
  for (var z = 0; z <= zWidth; z++){
    intercept = sliceAttributes.line.getPointGivenZ(z);
    if (intercept.x > 0 && intercept.x <= xWidth){
      pointList.push(intercept);
    }
  }
  //sort by x value
  pointList.sort(function(a, b){
    return a.x - b.x;
  });
  for (var i = 1; i < pointList.length; i++){
    var currPoint = pointList[i];
    var prevPoint = pointList[i-1];
    var rectangle = {};
    //get color to the left of the point, along the line
    rectangle.width = currPoint.distance(prevPoint);
    var offsetPoint;
    if (Math.abs(sliceAttributes.line.slope) < 0.35) {
      if (sliceAttributes.line.slope < 0){
        offsetPoint = sliceAttributes.line.getPointGivenX(currPoint.x-0.000001);
      }
      else {
        offsetPoint = sliceAttributes.line.getPointGivenX(currPoint.x-0.000001);
      }
    }
    else {
      if (sliceAttributes.line.slope < 0){
        offsetPoint = sliceAttributes.line.getPointGivenZ(currPoint.z+0.000001);
      }
      else{
        offsetPoint = sliceAttributes.line.getPointGivenZ(currPoint.z-0.000001);
      }
    }
    rectangle.color = map[y][Math.floor(offsetPoint.x)][Math.floor(offsetPoint.z)].color;
    if (recList.length > 0 && rectangle.color == recList[recList.length-1].color){
      var prevRectangle = recList[recList.length-1];
      prevRectangle.width += rectangle.width;
      recList[recList.length-1] = prevRectangle;
    }
    else{
      recList.push(rectangle);
    }
  }
  result.recList = recList;
  return result;
}

function drawRectangle(color, x, y, rwidth, rheight, border){
  if (border){
    canvasContextstrokeStyle = '#000000';
    canvasContext.strokeRect(x, y, rwidth, rheight);
  }
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, rwidth, rheight);
}

function resizeCanvas(){
  //Resize canvas to smallest of window width and height
  var newSize = window.innerWidth > window.innerHeight ?
    window.innerHeight : window.innerWidth;
  realCanvas.width = newSize/2;
  realCanvas.height = newSize/2;
  displayedCanvas.width = newSize/2;
  displayedCanvas.height = newSize/2;
  pixelsPerBlock = realCanvas.width/maxWidth;
}

function drawCanvas(){
  var t0 = getTime();
  //clear canvas
  canvasContext.clearRect(0, 0, realCanvas.width, realCanvas.height);
  resizeCanvas();
  var sliceAttributes = getSliceAttributes();
  var indexColorLine = getColorLine(0);
  var padding = Math.floor((realCanvas.width-(indexColorLine.mapWidth*pixelsPerBlock))/2);
  //for each y level
  var yPos = realCanvas.height-Math.floor(pixelsPerBlock);
  //Draw all of the air blocks at once
  drawRectangle(tileMap[0].color, 0,
    realCanvas.height-(map.length*Math.floor(pixelsPerBlock)),
    realCanvas.width, Math.floor(pixelsPerBlock)*map.length);
  for (var y = 0; y < map.length; y++){
    //determine which direction to draw the rectangles with the direction attr
    var colorLine = getColorLine(y);
    var i = sliceAttributes.direction == 1 ? 0 : colorLine.recList.length-1;
    var lastStartPos = padding;
    while (i < colorLine.recList.length && i >= 0){
      var rectangle = colorLine.recList[i];
      var widthInPx = rectangle.width*pixelsPerBlock;
      //if not air, draw rectangle
      if (rectangle.color !== tileMap[0].color){
        //floor the start x and extend the width by the removed amount
        //to prevent white lines between the tiles
        drawRectangle(rectangle.color, Math.floor(lastStartPos), yPos, widthInPx+(lastStartPos%1), Math.floor(pixelsPerBlock), false);
      }
      var nextStartPos = lastStartPos+widthInPx;
      lastStartPos = nextStartPos;
      i = sliceAttributes.direction == 1 ? i+1 : i-1;
    }
    yPos -= Math.floor(pixelsPerBlock);
  }
  logTime(getTime()-t0);
}

function drawSprite(){
  //restore the canvas image
  loadCanvas();
  var indexColorLine = getColorLine(0);
  var padding = Math.floor((realCanvas.width-(indexColorLine.mapWidth*pixelsPerBlock))/2);
  //calculate player's position
  var playerX = padding + indexColorLine.playerDeepness*Math.floor(pixelsPerBlock) - (spriteWidth/2);
  var playerY = realCanvas.height - position.y*Math.floor(pixelsPerBlock) - spriteHeight;
  displayedCanvasContext.drawImage(spriteReversed ? reverseSprite : realSprite, playerX,
    playerY, spriteWidth, spriteHeight);
  //draw ellipse
  var ellipseHeight = spriteWidth*0.1;
  displayedCanvasContext.beginPath();
  var ellipseX = spriteReversed ? playerX+(0.25*spriteWidth) :
    playerX+(0.75*spriteWidth);
  displayedCanvasContext.ellipse(ellipseX, playerY+(0.3*spriteHeight),
    Math.abs(Math.cos(getRadians())*ellipseHeight), ellipseHeight, 0, 0, 2*Math.PI);
  displayedCanvasContext.strokeStyle='green';
  displayedCanvasContext.stroke();
}

//Get time in milliseconds to 1/1000 resolution for debugging
function getTime(){
  return performance.now();
}

//Print differences between each time in a list for debugging
function printTimes(times){
  var str = '';
  for (var i = 1; i < times.length; i++){
    str += (times[i]-times[i-1]) + ', ';
  }
  console.log(str.substring(0, str.length-2));
}

function logTime(time){
  totalLogTime += time;
  totalLogIt ++;
  console.log(totalLogTime/totalLogIt);
}

function resetLogTime(){
  totalLogTime = 0;
  totalLogIt = 0;
}

function loadCanvas(){
  displayedCanvasContext.drawImage(realCanvas, 0, 0);
}
