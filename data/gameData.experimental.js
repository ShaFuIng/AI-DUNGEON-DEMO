const baseGameData = require('./gameData');

const experimentalRooms = {
  frozen_gate: {
      "id": "frozen_gate",
      "name": "冰封外門",
      "description": "半毀石門覆滿厚冰，寒氣從裂縫滲出。遠處有金屬摩擦聲在迴盪。",
      "ascii": "==========\nROOM 1\n[冰封外門]\n<frozen_gate>\n==========",
      "exits": {
        "north": "frost_hall"
      },
      "items": [
        "torch"
      ],
      "monster": null
    },
  
  frost_hall: {
      "id": "frost_hall",
      "name": "霜痕長廊",
      "description": "狹長走廊佈滿霜紋，牆面刻痕被冰晶填滿。每一步都像踩在薄玻璃上。",
      "ascii": "==========\nROOM 2\n[霜痕長廊]\n<frost_hall>\n==========",
      "exits": {
        "south": "frozen_gate",
        "east": "crystal_chamber"
      },
      "items": [
        "rusty_key"
      ],
      "monster": "skeleton_guard"
    },
  
  crystal_chamber: {
      "id": "crystal_chamber",
      "name": "冰晶密室",
      "description": "高聳冰柱垂落於密室中央，折射出的冷光照亮了破碎祭器。",
      "ascii": "==========\nROOM 3\n[冰晶密室]\n<crystal_chamber>\n==========",
      "exits": {
        "west": "frost_hall",
        "north": "ancient_ice_core"
      },
      "items": [
        "small_potion"
      ],
      "monster": null
    },
  
  ancient_ice_core: {
      "id": "ancient_ice_core",
      "name": "古冰核心室",
      "description": "核心機關埋在古冰之下，低鳴仍在運轉。守衛者在霧中緩慢甦醒。",
      "ascii": "==========\nROOM 4\n[古冰核心室]\n<ancient_ice_core>\n==========",
      "exits": {
        "south": "crystal_chamber"
      },
      "items": [
        "ancient_core"
      ],
      "monster": "ruin_guardian"
    }
};

module.exports = {
  initialRoomId: "frozen_gate",
  rooms: experimentalRooms,
  items: baseGameData.items,
  monsters: baseGameData.monsters,
  skills: baseGameData.skills
};
