/*
	RTREE Type Chart :
    -1 : Grass
	 0 : Player
	 1 : Rock
	 2 : Tree
     3 : Short Range Weapon
     4 : Water (OCEAN TOP STRIP)
     5 : Water (OCEAN LEFT STRIP)
	 6 : Snow (Centre Block)
	 7 : Desert (Centre Block)
	 8 : Weapon (SRW) (Sword)
*/


var size = 1000000;
var noOfSRWOnMap = 3000000; //SRW = Short Range Weapons
const wSRW = 30;
const hSRW = 30;
var mapSquareSize = 2000000 ;
var playerSquareDimension = 30 ;
var playerSquareDimensions = playerSquareDimension ;
var MapSize = mapSquareSize ;

/*
These variables define the area of the map over which biomes can be randomly generated. 
They do not generate over water. 
*/
var lower = 0 ;
var upper = mapSquareSize; 

/* end */

// Variables describing Snow Biomes
var SnowBiomes = 5000 ;
var lowerRangeDimensionSnowBiomes = 45000 ;
var higherRangeDimensionSnowBiomes = 55000 ;
// end

// Variables describing Desert Biomes
var DesertBiomes = 5000 ;
var lowerRangeDimensionDesertBiomes = 45000 ;
var higherRangeDimensionDesertBiomes = 55000 ;
// end
exports.mapSquareSize = mapSquareSize ;
exports.playerSquareDimension = playerSquareDimension ;
module.exports = {
	MapGen: function() {

    	console.time("Generating-map");
		// Generate rocks at random locations
		for (var i = 1 ; i <= size ; i++)
		{
		    rtree.insert({
		    	x: Math.floor(Math.random() * (mapSquareSize)) + 0,
		    	y: Math.floor(Math.random() * (mapSquareSize)) + 0,
		    	w: 50,
		    	h: 50
		    },1);
		}
		// Generate trees at random locations (group into biomes later)
		for (var i = 1 ; i <= size ; i++)
		{
		    rtree.insert({
		        x: Math.floor(Math.random() * (mapSquareSize)) + 0,
		        y: Math.floor(Math.random() * (mapSquareSize)) + 0,
		        w: 50,
		        h: 50
		    },2);
		}
		// Generate pickable SRWs at random locations
		for(var i = 1; i <= 1; i++){
		    rtree.insert({
		        x: Math.floor(Math.random() * (mapSquareSize)) + 0,
		        y: Math.floor(Math.random() * (mapSquareSize)) + 0,
		        w: wSRW,
		        h: hSRW
		    },3);
		}
		// Generate water around the map

		// rtree.insert({
		// 	x: 0,
		// 	y: 0,
		// 	w: mapSquareSize,
		// 	h: widthOfWater
		// },4);
		// rtree.insert({
		// 	x: 0,
		// 	y: 0,
		// 	w: widthOfWater,
		// 	h: mapSquareSize
		// },5);
		// Generate snow biomes around the map
		for (var i = 1 ; i <= 1 ; i++)
		{
			rtree.insert({
				//x: Math.floor(Math.random()*(upper-lower+1)) + lower,
				//y: Math.floor(Math.random()*(upper-lower+1)) + lower,
				x: 1000,
				y: 1000,
				w: 45000,
				h: 45000
			},6);

		}
		for (var i = 1 ; i <= 1 ; i++)
		{
			rtree.insert({
				x: Math.floor(Math.random()*(upper-lower+1)) + lower,
				y: Math.floor(Math.random()*(upper-lower+1)) + lower,
				w: 45000,
				h: 45000
			},7);
		}

	    console.timeEnd("Generating-map");
	    console.log("Generation Done");
	},
	getDistance: function(id1,id2)
	{
	    return(Math.sqrt((userArray[id1].x-userArray[id2].x)^2+(userArray[id1].y-userArray[id2].y)^2));
	},
	// naive function rn, replace with better algo
	findNearestPlayer: function(ID)
	{
	    var minID = -1 ;
	    var minDist = mapSquareSize ;
	    for (var i = 0 ; i < userArray.length ; i++)
	    {
	        if (i != ID)
	        {
	            if (minDist > module.exports.getDistance(ID,i))
	            {
	                minDist = module.exports.getDistance(ID,i) ;
	                minID = i ;
	            }
	        }
	    }
	    return minID ;
	}
};