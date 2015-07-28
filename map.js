//vector object
function vector(x, y, z){
  this.x = x;
  this.y = y;
  this.z = z;
  this.multiply = function(mult){
    this.x *= mult;
    this.y *= mult;
    this.z *= mult;
  };
  this.length = function(){
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
  };
}

/*
player's x, y, z and degrees position on the map.
y is vertical.
degrees is their current slice.
*/
var position = {
  x: 0.50001,
  y: 0,
  z: 0.50001,
  deg: 0,
  vel: new vector(0, 0, 0)
};

//map of material to color hex value
var tileMap = {
  //air block
  0:new tile('#CCFFFF', false, false),
  1:new tile('#FF6600', true, false),
  2:new tile('#00FF00', true, false),
  3:new tile('#993300', true, false),
  4:new tile('#CC00CC', true, false),
  //goal block
  5:new tile('#FFD700', false, true)
};



function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

//tile object
function tile(color, solid, goal){
  this.color = color;
  this.solid = solid;
  this.goal = goal;
}

/*
converts Troxel voxel to tile
t is used for solid
s is used for goal
*/
function convertTroxelToTile(trox){
  //return air if empty
  if (!trox){
    return tileMap[0];
  }
  else{
    return new tile(rgbToHex(trox.r, trox.g, trox.b), !trox.t, trox.s);
  }
}

/*
Converts a troxel json export inside of a map to the map format and returns it.
Also mutates the object.
*/
function convertTroxelMap(troxelMap){
  var troxel = convertLinkToMap(troxelMap.troxelLink);
  var result = [];
  var voxels = troxel.voxels;
  for (var y = 0; y < troxel.y; y++){
    result[y] = [];
    for (var x = 0; x < troxel.x; x++){
      result[y][x] = [];
      for (var z = 0; z < troxel.z; z++){
        //If the troxel doesn't exist, then fill with air
        if (voxels[x]){
          if (voxels[x][y]){
            if (voxels[x][y][z]){
              result[y][x][z] = convertTroxelToTile(voxels[x][y][z]);
            }
            else{
              result[y][x][z] = tileMap[0];
            }
          }
          else{
            result[y][x][z] = tileMap[0];
          }
        }
        else{
          result[y][x][z] = tileMap[0];
        }
      }
    }
  }
  troxelMap.tiles = result;
  return troxelMap;
}

/*list of tile materials in 3d
  format is [y][x][z]
  Like this:
     z
  0 1 2 3 4 5 6
  1
  2
x 3
  4
  5
  6

  y increases the further you go down the map. The ground is the first slice
*/
var map;

function setGameVarForMap(givenMap){
  givenMap = convertTroxelMap(givenMap);
  position = givenMap.playerPos;
  map = givenMap.tiles;
  playerWidth = givenMap.playerWidth;
  playerJump = givenMap.playerJump;
  climbableBlocks = givenMap.climbableBlocks;
}

//Convert link to troxel map
function convertLinkToMap(url){
  var data = atob(url.substring(url.indexOf('#m=')+3, url.length)).split('').map(function(c){
    return c.charCodeAt(0);
  });
  var voxels = [];
  var x = data[0];
  var y = data[1];
  var z = data[2];
  var readOnly = data[3];
  var i = 4;
  var r = 0;
  for (var zi = 0; zi < z; zi++){
    for (var yi = 0; yi < y; yi++){
      for (var xi = 0; xi < x; xi++){
        if (r === 0){
          if (data[i] > 127) {// read repeat value
            r = data[i] - 127;
            i++;
          }
          else{
            r = 1;
          }
          if (data[i] < 64) {// cache vox data
            vox = {r: data[i + 1], g: data[i + 2], b: data[i + 3], a: data[i + 4], s: data[i] % 8, t: data[i] >> 3};
            i += 5;
          }
          else{
            vox = null;
            i++;
          }
        }
        if (vox) {// apply vox data repeat often (if vox not empty)
          voxels[zi] = voxels[zi] ? voxels[zi] : [];
          voxels[zi][yi] = voxels[zi][yi] ? voxels[zi][yi] : [];
          voxels[zi][yi][xi] = {r: vox.r, g: vox.g, b: vox.b, a: vox.a, s: vox.s, t: vox.t};
        }
        r--;
      }
    }
  }
  return {'x':x, 'y':y, 'z':z, 'voxels':voxels};
}
