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
*/

var size = 2000000;
var noOfSRWOnMap = 3000000; //SRW = Short Range Weapons
const wSRW = 30;
const hSRW = 30;
var mapSquareSize = 2000000 ;
var playerSquareDimension = 50 ;
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

module.exports = {
	MapGen: function() {

    	console.time("Generating-map");
		// Generate rocks at random locations
		// for (var i = 1 ; i <= size ; i++)
		// {
		//     rtree.insert({
		//     	x: Math.floor(Math.random() * (mapSquareSize)) + 0,
		//     	y: Math.floor(Math.random() * (mapSquareSize)) + 0,
		//     	w: 50,
		//     	h: 50
		//     },1);
		// }
		// // Generate rocks at random locations (group into biomes later)
		// for (var i = 1 ; i <= size ; i++)
		// {
		//     rtree.insert({
		//         x: Math.floor(Math.random() * (mapSquareSize)) + 0,
		//         y: Math.floor(Math.random() * (mapSquareSize)) + 0,
		//         w: 50,
		//         h: 50
		//     },2);
		// }


		// implement a boundary of rocks, cut this out later. 
		for (var i = 0 ; i < 2000000 ; i+=100)
		{
			rtree.insert({
		        x: 1999950,
		        y: i,
		        w: 100,
		        h: 100
		    },100);
		}
		for (var i = 0 ; i < 2000000 ; i+=100)
		{
			rtree.insert({
		        x: i,
		        y: 1999950,
		        w: 100,
		        h: 100
		    },100);
		}


	    console.timeEnd("Generating-map");
	    console.log("Generation Done");
	}
};