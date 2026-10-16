/* Portrait market: geometry is authored against the supplied 1024 x 1536 image. */
(function () {
  'use strict';
  const world=window.MarketWorld={width:1024,height:1536};
  // These floor polygons are independent of the route graph. Anything outside
  // them (buildings, tree enclosure, counters, water) is NOT navigable.
  world.ground=[
    [[480,190],[550,190],[549,300],[545,390],[550,500],[553,610],[540,650],[470,650],[469,560],[467,430],[470,330]],
    [[470,630],[535,650],[425,710],[370,760],[340,815],[355,865],[400,925],[455,970],[500,995],[480,1035],[415,1005],[355,960],[305,900],[280,830],[287,775],[320,715],[390,670]],
    [[445,970],[505,980],[490,1070],[452,1130],[465,1190],[500,1250],[560,1300],[550,1360],[510,1410],[470,1460],[440,1515],[390,1515],[420,1440],[465,1370],[490,1320],[450,1270],[415,1200],[408,1130],[440,1050]],
    [[470,975],[560,970],[645,950],[665,985],[565,1030],[470,1040]]
  ];
  world.routes=[
    [[512,210],[515,280],[506,350],[510,430],[510,520],[512,600],[495,650]],
    [[495,650],[410,690],[350,745],[315,805],[330,865],[385,935],[445,985],[475,1010]],
    [[475,1010],[460,1060],[430,1130],[440,1190],[475,1260],[520,1320],[500,1380],[460,1440],[420,1500]],
    [[475,1010],[560,1000],[635,980]]
  ];
  function inside(x,y,polygon){
    let hit=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }
    return hit;
  }
  world.isWalkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&world.ground.some(p=>inside(x,y,p));
  // Fixed points on roofs / in water make regression tests independent of routes.
  world.forbiddenSamples=[[300,335],[290,480],[110,690],[690,320],[845,420],[825,715],[280,1015],[820,995],[520,1120],[860,1175],[140,1200],[750,1420],[515,820],[510,910]];
})();
