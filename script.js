/*
player's x, y, z and degrees position on the map.
y is vertical.
degrees is their current slice.
*/
var position = {
  x: 0.5,
  y: 0,
  z: 0.5,
  deg: 0.02
};

var canvas;
var width;
var height;
var xWidth;
var zWidth;
var maxWidth;
var pixelsPerBlock;
var realCanvas;
var canvasContext;

//load all variables
$(function(){
  canvas = $('canvas');
  width = canvas.width();
  height = canvas.height();
  xWidth = map.length;
  zWidth = map[0][0].length;
  maxWidth = Math.sqrt(Math.pow(xWidth, 2) + Math.pow(zWidth, 2));
  pixelsPerBlock = width/maxWidth;
  realCanvas = canvas.get(0);
  canvasContext = realCanvas.getContext('2d');

  setInterval(function(){
    position.deg = (position.deg + 1.001)%360;
    $('h1').text(position.deg);
    drawCanvas();
  }, 100);

  //position.deg = 91;
  //drawCanvas();
});

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
  var xWidth = map.length;
  var zWidth = map[0][0].length;
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
        offsetPoint = sliceAttributes.line.getPointGivenX(currPoint.x-0.00000001);
      }
      else {
        offsetPoint = sliceAttributes.line.getPointGivenX(currPoint.x-0.00000001);
      }
    }
    else {
      if (sliceAttributes.line.slope < 0){
        offsetPoint = sliceAttributes.line.getPointGivenZ(currPoint.z+0.00000001);
      }
      else{
        offsetPoint = sliceAttributes.line.getPointGivenZ(currPoint.z-0.00000001);
      }
    }
    console.log(sliceAttributes.line.slope);
      console.log(offsetPoint.x + ', ' + y + ', ' + offsetPoint.z);
    rectangle.color = colorMap[map[Math.floor(offsetPoint.x)][y][Math.floor(offsetPoint.z)]];
    console.log(Math.floor(offsetPoint.x) + ', ' + Math.floor(offsetPoint.z));
    recList.push(rectangle);
  }
  result.recList = recList;
  return result;
}

function drawRectangle(color, x, y, rwidth, rheight){
  canvasContextstrokeStyle = '#000000';
  canvasContext.strokeRect(x, y, rwidth, rheight);
  canvasContext.fillStyle = color;
  canvasContext.fillRect(x, y, rwidth, rheight);
  //console.log('draw ' + color + ', ' + x + ', ' + y + ', ' + rwidth + ', ' + rheight);
}

function drawCanvas(){
  canvasContext.clearRect(0, 0, width, height);
  var sliceAttributes = getSliceAttributes();
  var padding = Math.floor((width-(getColorLine(0).mapWidth*pixelsPerBlock))/2);
  for (var y = 0; y < map[0].length; y++){
    //for each y level
    var yPos = Math.floor(height - (y+1)*pixelsPerBlock);
    //determine which direction to draw the rectangles with the direction attr
    var colorLine = getColorLine(y);
    var i = sliceAttributes.direction == 1 ? 0 : colorLine.recList.length-1;
    //var i = 0;
    //add air to the beginning
    drawRectangle(colorMap[0], 0, yPos, padding, Math.floor(pixelsPerBlock));
    var lastStartPos = padding;
    while (i < colorLine.recList.length && i >= 0){
      var rectangle = colorLine.recList[i];
      var widthInPx = rectangle.width*pixelsPerBlock;
      drawRectangle(rectangle.color, lastStartPos, yPos, widthInPx, Math.floor(pixelsPerBlock));
      var nextStartPos = Math.floor(lastStartPos+widthInPx);
      lastStartPos = nextStartPos;
      i = sliceAttributes.direction == 1 ? i+1 : i-1;
      //i++;
    }
    //add air to the end too
    drawRectangle(colorMap[0], lastStartPos, yPos, padding, Math.floor(pixelsPerBlock));
  }
}
