function generateArea(input = {}) {
  const theme = input.theme || '冰封遺跡';
  const difficulty = input.difficulty || 5;
  const roomCount = input.roomCount || 4;

  if (difficulty < 1 || difficulty > 10) {
    throw new Error('Difficulty must be between 1 and 10.');
  }

  if (roomCount < 2 || roomCount > 4) {
    throw new Error('Mock provider only supports roomCount between 2 and 4.');
  }

  const roomsPool = [
    {
      id: 'frozen_gate',
      name: '冰封外門',
      description: '半毀石門覆滿厚冰，寒氣從裂縫滲出。遠處有金屬摩擦聲在迴盪。',
      exits: {
        north: 'frost_hall'
      },
      items: ['torch'],
      monster: null
    },
    {
      id: 'frost_hall',
      name: '霜痕長廊',
      description: '狹長走廊佈滿霜紋，牆面刻痕被冰晶填滿。每一步都像踩在薄玻璃上。',
      exits: {
        south: 'frozen_gate',
        east: 'crystal_chamber'
      },
      items: ['rusty_key'],
      monster: 'skeleton_guard'
    },
    {
      id: 'crystal_chamber',
      name: '冰晶密室',
      description: '高聳冰柱垂落於密室中央，折射出的冷光照亮了破碎祭器。',
      exits: {
        west: 'frost_hall',
        north: 'ancient_ice_core'
      },
      items: ['small_potion'],
      monster: null
    },
    {
      id: 'ancient_ice_core',
      name: '古冰核心室',
      description: '核心機關埋在古冰之下，低鳴仍在運轉。守衛者在霧中緩慢甦醒。',
      exits: {
        south: 'crystal_chamber'
      },
      items: ['ancient_core'],
      monster: 'ruin_guardian'
    }
  ];

  const roomExitsByCount = {
    2: {
      frozen_gate: { north: 'frost_hall' },
      frost_hall: { south: 'frozen_gate' }
    },
    3: {
      frozen_gate: { north: 'frost_hall' },
      frost_hall: { south: 'frozen_gate', east: 'crystal_chamber' },
      crystal_chamber: { west: 'frost_hall' }
    },
    4: {
      frozen_gate: { north: 'frost_hall' },
      frost_hall: { south: 'frozen_gate', east: 'crystal_chamber' },
      crystal_chamber: { west: 'frost_hall', north: 'ancient_ice_core' },
      ancient_ice_core: { south: 'crystal_chamber' }
    }
  };

  const selectedRooms = roomsPool.slice(0, roomCount).map((room) => ({
    ...room,
    exits: roomExitsByCount[roomCount][room.id]
  }));

  return {
    id: 'frozen_ruins',
    name: '冰封遺跡',
    theme,
    narrativeHook: '你踏過結霜的石階，冰晶在火光裡折射出古老機關尚未熄滅的寒芒。',
    difficulty,
    rooms: selectedRooms
  };
}

module.exports = {
  generateArea
};
