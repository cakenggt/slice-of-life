function mod(n, m) {
  return ((n%m)+m)%m;
}

var canvas;
var width;
var height;
var xWidth;
var zWidth;
var yWidth;
var maxWidth;
var pixelsPerBlock;
var realCanvas;
var canvasContext;
var keyState = {};
var movementSpeed = 0.15;
var jumpSpeed = 0.15;
var spriteWidth = 30;
var spriteHeight = 40;

//load all variables
$(function(){
  canvas = $('canvas');
  width = canvas.width();
  height = canvas.height();
  xWidth = map[0].length;
  zWidth = map[0][0].length;
  yWidth = map.length;
  maxWidth = Math.sqrt(Math.pow(xWidth, 2) + Math.pow(zWidth, 2));
  pixelsPerBlock = width/maxWidth;
  realCanvas = canvas.get(0);
  canvasContext = realCanvas.getContext('2d');

  //movement engine
  setInterval(function(){
    //gravity engine
    position.vel[1] = position.vel[1] > -0.1 ? position.vel[1] - 0.01 : position.vel[1];
    var newY = position.y+position.vel[1];
    if (canMoveHere(position.x, newY, position.z)){
      position.y = newY;
    }
    else{
      if (position.y%1 !== 0){
        position.y = Math.floor(position.y);
      }
    }
    //movement
    var newX = position.x+position.vel[0];
    var newZ = position.z+position.vel[2];
    //Check to make sure that the player isn't jumping their head through anything
    if (canMoveHere(newX, position.y+(spriteHeight/pixelsPerBlock), newZ)){
      position.x = newX;
      position.z = newZ;
    }
    //movement slowdown
    position.vel[0] /= 2;
    position.vel[2] /= 2;

    //key controls
    var x;
    var z;
    if (keyState[69]){
      position.deg = mod(position.deg - 1.001,360);
    }
    else if (keyState[81]){
      position.deg = mod(position.deg + 1.001,360);
    }
    if (keyState[39]){
      //go right
      x = position.vel[0] < movementSpeed ? position.vel[0] + 0.01*Math.cos(getRadians()) : movementSpeed;
      z = position.vel[2] < movementSpeed ? position.vel[2] + 0.01*Math.sin(getRadians()) : movementSpeed;
      position.vel[0] = x;
      position.vel[2] = z;
    }
    else if (keyState[37]){
      //go left
      x = position.vel[0] > -1*movementSpeed ? position.vel[0] - 0.01*Math.cos(getRadians()) : -1*movementSpeed;
      z = position.vel[2] > -1*movementSpeed ? position.vel[2] - 0.01*Math.sin(getRadians()) : -1*movementSpeed;
      position.vel[0] = x;
      position.vel[2] = z;
    }
    if (keyState[38]){
      //jump
      if (position.y%1 === 0){
        position.vel[1] = jumpSpeed;
      }
    }

    drawCanvas();
  }, 20);

  drawCanvas();
  $(document).on('keydown', function(data){
    keyState[data.keyCode || data.which] = true;
    console.log(data.keyCode);
  });
  $(document).on('keyup', function(data){
    keyState[data.keyCode || data.which] = false;
  });
});

function canMoveHere(x, y, z){
  var canMove = x < xWidth && x >= 0 &&
    z < zWidth && z >= 0 &&
    y < yWidth && y >= 0;
  canMove = canMove && !tileMap[map[Math.floor(y)][Math.floor(x)][Math.floor(z)]].solid;
  return canMove;
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
    rectangle.color = tileMap[map[y][Math.floor(offsetPoint.x)][Math.floor(offsetPoint.z)]].color;
    recList.push(rectangle);
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

function drawCanvas(){
  var winText = (goal.x === undefined || Math.floor(position.x) == goal.x) &&
    (goal.y === undefined || Math.floor(position.y) == goal.y) &&
    (goal.z === undefined || Math.floor(position.z) == goal.z) ?
    ' You Won!!!' : '';
  $('h1').html(Math.floor(position.deg)+'&deg' + winText);
  canvasContext.clearRect(0, 0, width, height);
  var sliceAttributes = getSliceAttributes();
  var indexColorLine = getColorLine(0);
  var padding = Math.floor((width-(indexColorLine.mapWidth*pixelsPerBlock))/2);
  //for each y level
  var yPos = height-Math.floor(pixelsPerBlock);
  for (var y = 0; y < map.length; y++){
    //determine which direction to draw the rectangles with the direction attr
    var colorLine = getColorLine(y);
    var i = sliceAttributes.direction == 1 ? 0 : colorLine.recList.length-1;
    //var i = 0;
    //add air to the beginning
    drawRectangle(tileMap[0].color, 0, yPos, padding, Math.floor(pixelsPerBlock));
    var lastStartPos = padding;
    while (i < colorLine.recList.length && i >= 0){
      var rectangle = colorLine.recList[i];
      var widthInPx = rectangle.width*pixelsPerBlock;
      drawRectangle(rectangle.color, lastStartPos, yPos, widthInPx, Math.floor(pixelsPerBlock), false);
      var nextStartPos = Math.floor(lastStartPos+widthInPx);
      lastStartPos = nextStartPos;
      i = sliceAttributes.direction == 1 ? i+1 : i-1;
      //i++;
    }
    //add air to the end too
    drawRectangle(tileMap[0].color, lastStartPos, yPos, padding, Math.floor(pixelsPerBlock));
    yPos -= Math.floor(pixelsPerBlock);
  }

  //calculate player's position
  var playerX = padding + indexColorLine.playerDeepness*pixelsPerBlock - (spriteWidth/2);
  var playerY = height - position.y*pixelsPerBlock - spriteHeight;
  canvasContext.drawImage($('#sprite').get(0), playerX, playerY, spriteWidth, spriteHeight);
}
