setGameVarForMap({
  playerPos:{
  x: 1.50001,
  y: 3,
  z: 1.50001,
  deg: 0,
  vel: new vector(0, 0, 0)
  },
  playerWidth:0.9,
  scale:1,
  climbableBlocks:0,
  animation:function(timestamp){

  },
  troxelLink:'https://cakenggt.github.io/Troxel/#m=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'
});
