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

//map of meta tiles, collections of tiles
var metaTileMap = {
  air1:[
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ]
  ],
  ground1:[
    [
      [
        3,1,1,1
      ],
      [
        3,3,1,1
      ],
      [
        1,1,3,1
      ],
      [
        1,1,3,3
      ]
    ],
      [
        [
          1,1,3,1
        ],
        [
          1,3,1,3
        ],
        [
          1,1,3,1
        ],
        [
          1,3,3,1
        ]
      ],
      [
        [
          1,1,3,1
        ],
        [
          3,3,1,1
        ],
        [
          1,1,3,1
        ],
        [
          1,3,1,3
        ]
      ],
      [
        [
          1,3,1,1
        ],
        [
          1,3,3,1
        ],
        [
          1,1,1,3
        ],
        [
          1,1,3,3
        ]
      ]
    ],
  wall1:[
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        4, 4, 4, 4
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        4, 4, 4, 4
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        4, 4, 4, 4
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        4, 4, 4, 4
      ]
    ]
  ],
  goal1:[
    [
      [
        0, 0, 0, 0
      ],
      [
        5, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ],
    [
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ],
      [
        0, 0, 0, 0
      ]
    ]
  ]
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
    return new tile(rgbToHex(trox.r, trox.g, trox.b), trox.t, trox.s);
  }
}

/*
Converts a troxel json export inside of a map to the map format and returns it.
Also mutates the object.
*/
function convertTroxelMap(troxelMap){
  var troxel = troxelMap.troxel;
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

var map1 = {
  playerPos:{
    x: 0.50001,
    y: 4,
    z: 0.50001,
    deg: 0,
    vel: new vector(0, 0, 0)
  },
  tiles:[
    [
      [
        metaTileMap.ground1, metaTileMap.ground1
      ],
      [
        metaTileMap.ground1, metaTileMap.ground1
      ]
    ],
    [
      [
        metaTileMap.wall1, metaTileMap.air1
      ],
      [
        metaTileMap.goal1, metaTileMap.air1
      ]
    ]
  ]
};

//Takes in a pre-compiled map and sets the current map and position to it
function mapGenerator(preMap){
  var metaTileSize = preMap.tiles[0][0][0].length;
  var compiledMap = [];
  var metaTiles = preMap.tiles;
  for (var my = 0; my < metaTiles.length; my++){
    for (var mx = 0; mx < metaTiles[my].length; mx++){
      for (var mz = 0; mz < metaTiles[my][mx].length; mz++){
        var metaTile = metaTiles[my][mx][mz];
        for (var y = 0; y < metaTile.length; y++){
          var compiledY = (metaTileSize*my)+y;
          if (compiledMap[compiledY] === undefined){
            compiledMap[compiledY] = [];
          }
          for (var x = 0; x < metaTile[y].length; x++){
            var compiledX = (metaTileSize*mx)+x;
            if (compiledMap[compiledY][compiledX] === undefined){
              compiledMap[compiledY][compiledX] = [];
            }
            for (var z = 0; z < metaTile[y][x].length; z++){
              var compiledZ = (metaTileSize*mz)+z;
              compiledMap[compiledY][compiledX][compiledZ] =
                metaTile[y][x][z];
            }
          }
        }
      }
    }
  }
  position = preMap.playerPos;
  map = compiledMap;
}

//mapGenerator(map1);
function setGameVarForMap(givenMap){
  givenMap = convertTroxelMap(givenMap);
  position = givenMap.playerPos;
  map = givenMap.tiles;
}
