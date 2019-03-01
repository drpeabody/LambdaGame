function Weapon(width, height,damage)
{
	return {
		damage : damage,
		w : width,
		h : height
	}
}
/*
Initialize all weapons here (Eventually create a file of weapons and use that to load them)
*/

module.exports.allWeapons = [];
module.exports.allWeapons[0] = Weapon(30,30,5); // 0 = ShortRangeWeapon (Sword)

/* end */

/* This array defines the RTREE Leaf entries which correspond to different types of Weapons */
/* Also note that the array is indexed in such a way that (index = WeaponID) */

var rtreeWeapons = [3];

/* end */


module.exports.weaponRemove = (rectangle) =>{
    rtree.remove({x: rectangle.x, y: rectangle.y, w: rectangle.w, h: rectangle.h});
}
module.exports.updateWeapon = (rtreeID,ID) =>{
	var v = module.exports.allWeapons[rtreeWeapons.indexOf(rtreeID)];
    userArray[ID].weapons.push(v);
    userArray[ID].currentWeapon = v;
}
module.exports.isWeapon = (rtreeID) => {
	return(rtreeWeapons.includes(rtreeID));
}
module.exports.getWeaponID = (rtreeID) => {
	return(rtreeWeapons.indexOf(rtreeID));
}