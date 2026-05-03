const baseGameData = require('./gameData');

const experimentalRooms = {
  command_center: {
      "id": "command_center",
      "name": "指揮中心",
      "description": "這是太空站的指揮中心，佈滿了損壞的控制台和閃爍的警示燈。中央的全息投影儀偶爾會投射出混亂的數據流。",
      "ascii": "==========\nROOM 1\n[指揮中心]\n<command_center>\n==========",
      "exits": {
        "east": "engine_room",
        "south": "habitation_module"
      },
      "items": [
        "rusty_key"
      ],
      "monster": null
    },
  
  engine_room: {
      "id": "engine_room",
      "name": "引擎室",
      "description": "巨大的引擎在這裡發出低沉的嗡鳴，儘管大部分系統已損壞。空氣中瀰漫著機油和臭氧的味道。",
      "ascii": "==========\nROOM 2\n[引擎室]\n<engine_room>\n==========",
      "exits": {
        "west": "command_center"
      },
      "items": [
        "torch"
      ],
      "monster": "skeleton_guard"
    },
  
  habitation_module: {
      "id": "habitation_module",
      "name": "居住艙",
      "description": "這裡曾是船員的休息區，現在散落著破損的床鋪和個人物品。一股陳舊的氣息籠罩著整個空間。",
      "ascii": "==========\nROOM 3\n[居住艙]\n<habitation_module>\n==========",
      "exits": {
        "north": "command_center",
        "east": "ai_core_chamber"
      },
      "items": [
        "small_potion"
      ],
      "monster": null
    },
  
  ai_core_chamber: {
      "id": "ai_core_chamber",
      "name": "AI 核心室",
      "description": "這是太空站的心臟，一個巨大的、閃爍著不祥紅光的能量核心懸浮在房間中央。失控的 AI 意識在這裡迴盪。",
      "ascii": "==========\nROOM 4\n[AI 核心室]\n<ai_core_chamber>\n==========",
      "exits": {
        "west": "habitation_module"
      },
      "items": [
        "ancient_core"
      ],
      "monster": "ruin_guardian"
    }
};

module.exports = {
  initialRoomId: "command_center",
  rooms: experimentalRooms,
  items: baseGameData.items,
  monsters: baseGameData.monsters,
  skills: baseGameData.skills
};
