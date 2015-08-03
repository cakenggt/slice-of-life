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
  givenMap.tiles = convertLinkToMap(givenMap.troxelLink);
  position = givenMap.playerPos;
  map = givenMap.tiles;
  playerWidth = givenMap.playerWidth;
  scale = givenMap.scale;
  climbableBlocks = givenMap.climbableBlocks;
}

//Convert link to tile array
function convertLinkToMap(url){
  var ref = atob(url.substring(url.indexOf('#m=')+3, url.length)).split('').map(function(c){
    return c.charCodeAt(0);
  });
  var voxels = [];
  var x = ref[0];
  var y = ref[1];
  var z = ref[2];
  var readOnly = ref[3];
  var slice = [].slice;
  var data = 5 <= ref.length ? slice.call(ref, 4) : [];
  var i = 0;
  var r = 0;
  if (data[0] === 85){
    paletteSize = 256 * data[1] + data[2];
    short = data[1] === 0 && data[2] < 128 ? 1 : 2;
    palette = [null];
    for (j = k = 3, ref = paletteSize * 5 + 3; k < ref; j = k += 5) {
      palette.push({
        r: data[j + 1],
        g: data[j + 2],
        b: data[j + 3],
        a: data[j + 4],
        s: data[j] % 16,
        t: data[j] >> 4
      });
    }
    i = paletteSize * 5 + 3;
    for (zj = 0; zj < z; zj += 1) {
      for (yj = 0; yj < y; yj += 1) {
        for (xj = 0; xj < x; xj += 1) {
          if (r === 0) {
            if (data[i] > 127) {
              r = data[i] - 126;
              i++;
            } else {
              r = 1;
            }
            if (short === 1) {
              index = data[i];
            } else {
              index = data[i] * 256 + data[i + 1];
            }
            if (index !== 0) {
              vox = palette[index];
            } else {
              vox = null;
            }
            i += short;
          }
          voxels[yj] = voxels[yj] ? voxels[yj] : [];
          voxels[yj][xj] = voxels[yj][xj] ? voxels[yj][xj] : [];
          voxels[yj][xj][zj] = vox ? convertTroxelToTile({
            r: vox.r,
            g: vox.g,
            b: vox.b,
            a: vox.a,
            s: vox.s,
            t: vox.t
          }) : convertTroxelToTile(null);
          r--;
        }
      }
    }
  }
  else {
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
          }// apply vox data repeat often
          voxels[yi] = voxels[yi] ? voxels[yi] : [];
          voxels[yi][xi] = voxels[yi][xi] ? voxels[yi][xi] : [];
          voxels[yi][xi][zi] = vox ? convertTroxelToTile({r: vox.r, g: vox.g, b: vox.b, a: vox.a, s: vox.s, t: vox.t}) :
            convertTroxelToTile(null);
          r--;
        }
      }
    }
  }
  return voxels;
}
