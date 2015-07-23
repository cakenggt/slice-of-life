/*
player's x, y, z and degrees position on the map.
y is vertical.
degrees is their current slice.
*/
var position = {
  x: 0.50001,
  y: 0,
  z: 0.50001,
  deg: 0
};

var goal = {
  x:0,
  y:0,
  z:0
};

//map of material to color hex value
var tileMap = {
  0:new tile('#CCFFFF', false),
  1:new tile('#FF6600', true),
  2:new tile('#00FF00', true),
  3:new tile('#993300', true),
  4:new tile('#CC00CC', true)
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
  ]
};

//tile object
function tile(color, solid){
  this.color = color;
  this.solid = solid;
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
var map = [
  [
    [
      1, 2
    ],
    [
      4, 3
    ]
  ],
  [
    [
      1, 2
    ],
    [
      4, 3
    ]
  ]
];

var map1 = {
  playerPos:{
    x: 0.50001,
    y: 4,
    z: 0.50001,
    deg: 0
  },
  goal:{
    x: 4
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
        metaTileMap.air1, metaTileMap.air1
      ]
    ]
  ]
};

//Takes in a pre-compiled map and sets the current map and position to it
function mapGenerator(preMap){
  var metaTileSize = preMap.tiles[0][0][0].length;
  var compiledMap = [];
  //console.log(compiledMap);
  var metaTiles = preMap.tiles;
  for (var my = 0; my < metaTiles.length; my++){
    for (var mx = 0; mx < metaTiles[my].length; mx++){
      for (var mz = 0; mz < metaTiles[my][mx].length; mz++){
        var metaTile = metaTiles[my][mx][mz];
        //console.log(compiledMap);
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
  goal = preMap.goal;
}

mapGenerator(map1);
