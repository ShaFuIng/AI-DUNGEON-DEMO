const gameData = {
  rooms: {
    entrance: {
      id: "entrance",
      name: "遺跡入口",
      description:
        "你站在古老遺跡的入口，牆面刻著早已模糊的符文。冷風從黑暗深處吹來，彷彿在催促你前進。",
      ascii: `
        _______
       / _____ \\
      / /     \\ \\
      | |入口  | |
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
      name: "守衛長廊",
      description:
        "斑駁的長廊兩側立著破碎石像，地面散落骨片與鏽蝕鐵器。你感受到某種敵意正在逼近。",
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
      name: "回音走廊",
      description:
        "狹長走廊裡回音不斷，腳步聲被放大成不安的節奏。牆邊有微弱藍光閃爍。",
      ascii: `
      =================
       ^   ^   ^   ^
      =================
         回音走廊
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
      name: "祭壇大廳",
      description:
        "你來到一座坍塌過半的祭壇，中央石台仍殘留著古老儀式的痕跡。東側有一道沉重石門。",
      ascii: `
          /\\
         /__\\
        /____\\
          ||
         祭壇
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
      name: "核心密室",
      description:
        "密室深處矗立著殘破機關與巨型守衛。古代核心懸浮在半空，散發不穩定能量。",
      ascii: `
          [====]
         /|    |\\
        /_|____|_\\
          |    |
         / \\  / \\
         遺跡守衛
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
      description: "一支可照明的火把，能在黑暗中提供基本視野。",
      type: "material",
      usageHint: "可作為探索黑暗房間時的基礎照明工具。",
    },

    rusty_key: {
      id: "rusty_key",
      name: "生鏽鑰匙",
      description: "一把佈滿鏽斑的舊鑰匙，看起來可以打開遺跡深處的門。",
      type: "key",
      usageHint: "可以開啟通往核心密室的沉重石門。",
      unlocks: ["boss_room"],
    },

    ancient_core: {
      id: "ancient_core",
      name: "古代核心",
      description: "遺跡能量的來源，帶回入口或許能完成這次探索。",
      type: "quest",
      usageHint: "帶回遺跡入口即可完成這次探索。",
    },

    small_potion: {
      id: "small_potion",
      name: "小型藥水",
      description: "可恢復少量 HP 的藥水。",
      type: "consumable",
      usageHint: "在受傷時使用，可恢復 10 點 HP。",
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
      defense: 1,
      expReward: 12,
      drops: ["small_potion"],
      description: "手持殘刃的骷髏守衛，動作僵硬卻致命。",
    },

    ruin_guardian: {
      id: "ruin_guardian",
      name: "遺跡守護者",
      maxHp: 35,
      hp: 35,
      attack: 7,
      defense: 2,
      expReward: 30,
      drops: [],
      description: "沉睡已久的巨型守護者，誓死守護古代核心。",
    },
  },

  skills: {
    slash: {
      id: "slash",
      name: "斬擊",
      mpCost: 0,
      damage: 8,
      description: "穩定的近戰攻擊技能。",
    },

    fireball: {
      id: "fireball",
      name: "火球術",
      mpCost: 4,
      damage: 14,
      description: "消耗 MP 施放火球造成高傷害。",
    },

    guard: {
      id: "guard",
      name: "防禦姿態",
      mpCost: 2,
      damage: 0,
      description: "進入防禦狀態，下一次受到的傷害減半。",
    },
  },
};

module.exports = gameData;
