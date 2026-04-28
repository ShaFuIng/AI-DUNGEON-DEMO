const gameData = {
  rooms: {
    entrance: {
      id: "entrance",
      name: "遺跡入口",
      description:
        "你站在古代地下遺跡的入口。冷風從石門縫隙中吹出，牆上刻著模糊的符號。",
      ascii: `
        _______
       / _____ \\
      / /     \\ \\
      | |入口 | |
      | |_____| |
      \\_________/
      `,
      exits: {
        north: "hall",
      },
      items: ["torch"],
      monster: null,
    },

    hall: {
      id: "hall",
      name: "石像大廳",
      description:
        "巨大的石像排列在大廳兩側。它們的眼窩空洞，像是在注視著闖入者。",
      ascii: `
       O      O
      /|\\    /|\\
      / \\    / \\
     石像    石像
      `,
      exits: {
        south: "entrance",
        east: "corridor",
      },
      items: ["rusty_key"],
      monster: "skeleton_guard",
    },

    corridor: {
      id: "corridor",
      name: "陷阱走廊",
      description:
        "狹窄的走廊地面布滿裂痕。你感覺只要走錯一步，就可能觸發古老機關。",
      ascii: `
      =================
       ^   ^   ^   ^
      =================
        陷阱走廊
      `,
      exits: {
        west: "hall",
        north: "altar",
      },
      items: ["small_potion"],
      monster: null,
    },

    altar: {
      id: "altar",
      name: "地下祭壇",
      description:
        "祭壇中央漂浮著微弱的藍光。空氣中瀰漫著古代魔法殘留的氣息。",
      ascii: `
          /\\
         /__\\
        /____\\
          ||
        地下祭壇
      `,
      exits: {
        south: "corridor",
        east: "boss_room",
      },
      items: [],
      monster: null,
    },

    boss_room: {
      id: "boss_room",
      name: "守護者房間",
      description:
        "沉重的石門後方，是一座圓形空間。遺跡守護者站在中央，守著古代核心。",
      ascii: `
          [====]
         /|    |\\
        /_|____|_\\
          |    |
         / \\  / \\
        遺跡守護者
      `,
      exits: {
        west: "altar",
      },
      items: ["ancient_core"],
      monster: "ruin_guardian",
    },
  },

  items: {
    torch: {
      id: "torch",
      name: "火把",
      description: "一支還能燃燒的火把，可以照亮黑暗角落。",
      type: "tool",
    },

    rusty_key: {
      id: "rusty_key",
      name: "生鏽鑰匙",
      description: "一把生鏽的古老鑰匙，也許能打開某道門。",
      type: "key",
    },

    ancient_core: {
      id: "ancient_core",
      name: "古代核心",
      description: "散發藍色光芒的神秘核心，是這趟探險的目標。",
      type: "quest",
    },

    small_potion: {
      id: "small_potion",
      name: "小藥水",
      description: "恢復少量 HP 的藥水。",
      type: "consumable",
      effect: {
        hp: 10,
      },
    },
  },

  monsters: {
    skeleton_guard: {
      id: "skeleton_guard",
      name: "骷髏守衛",
      maxHp: 16,
      hp: 16,
      attack: 4,
      description: "一具手持破舊短劍的骷髏守衛，正在大廳中巡邏。",
    },

    ruin_guardian: {
      id: "ruin_guardian",
      name: "遺跡守護者",
      maxHp: 35,
      hp: 35,
      attack: 7,
      description: "由古代魔法驅動的巨大守護者，沉默地守護著古代核心。",
    },
  },

  skills: {
    slash: {
      id: "slash",
      name: "斬擊",
      mpCost: 0,
      damage: 8,
      description: "普通的近戰攻擊技能。",
    },

    fireball: {
      id: "fireball",
      name: "火球術",
      mpCost: 4,
      damage: 14,
      description: "消耗 MP，造成較高傷害。",
    },

    guard: {
      id: "guard",
      name: "防禦姿態",
      mpCost: 2,
      damage: 0,
      description: "進入防禦狀態，降低下一次受到的傷害。",
    },
  },
};

module.exports = gameData;