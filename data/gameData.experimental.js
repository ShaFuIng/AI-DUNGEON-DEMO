const baseGameData = require('./gameData');

const experimentalRooms = {
  starting_chamber: {
      "id": "starting_chamber",
      "name": "起始密室",
      "description": "你在一間陰暗潮濕的密室中醒來，空氣中瀰漫著塵土和霉味。唯一的光源來自牆壁上微弱的苔蘚。",
      "ascii": "==========\nROOM 1\n[起始密室]\n<starting_chamber>\n==========",
      "exits": {
        "north": "hallway_of_whispers"
      },
      "items": [
        "torch"
      ],
      "monster": null
    },
  
  hallway_of_whispers: {
      "id": "hallway_of_whispers",
      "name": "低語迴廊",
      "description": "這條狹長的迴廊迴盪著若有似無的低語聲，彷彿有什麼東西在暗中窺視。牆壁上刻滿了古老的符文。",
      "ascii": "==========\nROOM 2\n[低語迴廊]\n<hallway_of_whispers>\n==========",
      "exits": {
        "south": "starting_chamber",
        "east": "armory",
        "west": "library"
      },
      "items": [
        "rusty_key"
      ],
      "monster": "skeleton_guard"
    },
  
  armory: {
      "id": "armory",
      "name": "軍械庫",
      "description": "這裡曾是存放武器裝備的地方，如今只剩下生鏽的刀劍和破碎的盔甲。空氣中充滿了鐵鏽的味道。",
      "ascii": "==========\nROOM 3\n[軍械庫]\n<armory>\n==========",
      "exits": {
        "west": "hallway_of_whispers",
        "north": "treasury"
      },
      "items": [
        "small_potion"
      ],
      "monster": null
    },
  
  library: {
      "id": "library",
      "name": "圖書館",
      "description": "書架上堆滿了泛黃的古籍，散發著紙張的陳舊氣息。有些書頁上記載著關於大同城的秘密。",
      "ascii": "==========\nROOM 4\n[圖書館]\n<library>\n==========",
      "exits": {
        "east": "hallway_of_whispers"
      },
      "items": [],
      "monster": "ruin_guardian"
    },
  
  treasury: {
      "id": "treasury",
      "name": "寶庫",
      "description": "你終於找到了傳說中的寶庫，中央擺放著一個閃耀著奇異光芒的古老核心。這是逃離的關鍵！",
      "ascii": "==========\nROOM 5\n[寶庫]\n<treasury>\n==========",
      "exits": {
        "south": "armory"
      },
      "items": [
        "ancient_core"
      ],
      "monster": null
    }
};

module.exports = {
  initialRoomId: "starting_chamber",
  rooms: experimentalRooms,
  items: baseGameData.items,
  monsters: baseGameData.monsters,
  skills: baseGameData.skills
};
