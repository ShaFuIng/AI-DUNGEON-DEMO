const fs = require('fs');
const path = require('path');
const gameData = require('../data/gameData');

const DEFAULT_INPUT = 'outputs/generatedArea.json';
const DEFAULT_OUTPUT = 'outputs/generatedArea.patchSuggestion.json';

function readJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file not found: ${filePath}`);
    }
    if (error.name === 'SyntaxError') {
      throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
    }
    throw new Error(`Failed to read JSON at ${filePath}: ${error.message}`);
  }
}

function writeJson(filePath, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function toRoomMap(rooms) {
  const map = {};
  for (const room of rooms) {
    map[room.id] = {
      id: room.id,
      name: room.name,
      description: room.description,
      ascii: '',
      exits: room.exits,
      items: room.items,
      monster: room.monster
    };
  }
  return map;
}

function collectUniqueReferences(area) {
  const itemSet = new Set();
  const monsterSet = new Set();

  for (const room of area.rooms || []) {
    for (const itemId of room.items || []) {
      itemSet.add(itemId);
    }
    if (room.monster) {
      monsterSet.add(room.monster);
    }
  }

  return {
    itemsReferenced: Array.from(itemSet).sort(),
    monstersReferenced: Array.from(monsterSet).sort(),
    skillsReferenced: []
  };
}

function findMissingReferences(refs, data) {
  const itemKeys = new Set(Object.keys(data.items || {}));
  const monsterKeys = new Set(Object.keys(data.monsters || {}));
  const skillKeys = new Set(Object.keys(data.skills || {}));

  const missingItems = refs.itemsReferenced.filter((id) => !itemKeys.has(id)).sort();
  const missingMonsters = refs.monstersReferenced.filter((id) => !monsterKeys.has(id)).sort();
  const missingSkills = refs.skillsReferenced.filter((id) => !skillKeys.has(id)).sort();

  return {
    missingItems,
    missingMonsters,
    missingSkills
  };
}

function findRoomIdConflicts(area, data) {
  const existing = new Set(Object.keys(data.rooms || {}));
  return (area.rooms || [])
    .map((room) => room.id)
    .filter((id) => existing.has(id))
    .sort();
}

function createPatchSuggestion(area, options = {}) {
  const sourceFile = options.sourceFile || DEFAULT_INPUT;
  const targetFile = options.targetFile || 'data/gameData.js';

  const refs = collectUniqueReferences(area);
  const missing = findMissingReferences(refs, gameData);
  const roomIdConflicts = findRoomIdConflicts(area, gameData);

  const risks = [];
  if (missing.missingItems.length || missing.missingMonsters.length || missing.missingSkills.length) {
    risks.push('存在缺失引用，不能直接合併。');
  }
  if (roomIdConflicts.length) {
    risks.push('存在 room id 衝突，不能直接覆蓋既有房間。');
  }
  risks.push('直接合併可能影響既有通關流程，需人工測試。');

  return {
    type: 'gameDataPatchSuggestion',
    sourceAreaId: area.id,
    sourceFile,
    targetFile,
    status: 'draft',
    requiresHumanReview: true,
    summary: `建議將「${area.name}」加入 gameData rooms。`,
    roomsToAdd: toRoomMap(area.rooms || []),
    itemsReferenced: refs.itemsReferenced,
    monstersReferenced: refs.monstersReferenced,
    skillsReferenced: refs.skillsReferenced,
    missingReferences: {
      items: missing.missingItems,
      monsters: missing.missingMonsters,
      skills: missing.missingSkills
    },
    roomIdConflicts,
    engineCompatibilityNotes: [
      'roomsToAdd 目前僅為建議，尚未套用到 data/gameData.js。',
      '新增房間若要成為遊戲入口，需人工檢查起始房間與 engine 流程。',
      'ascii 目前以空字串 placeholder 產生，需人工補齊或確認 UI 可接受。'
    ],
    humanReviewNotes: [
      '請依 docs/CONTENT_DESIGNER_HUMAN_REVIEW_CHECKLIST.md 審查。',
      'validator PASS 不代表內容可直接合併。'
    ],
    risks,
    rollbackNotes: [
      '合併前請先保留 data/gameData.js 的 git diff。',
      '若 runtime 測試失敗，請 revert 對 data/gameData.js 的修改。'
    ]
  };
}

function printHelp() {
  console.log('Usage:');
  console.log('  node tools/createAreaPatchSuggestion.js');
  console.log('  node tools/createAreaPatchSuggestion.js <input-path>');
  console.log('  node tools/createAreaPatchSuggestion.js <input-path> <output-path>');
  console.log('  node tools/createAreaPatchSuggestion.js --help');
  console.log('  node tools/createAreaPatchSuggestion.js -h');
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const inputArg = args[0] || DEFAULT_INPUT;
  const outputArg = args[1] || DEFAULT_OUTPUT;

  const inputPath = path.resolve(process.cwd(), inputArg);
  const outputPath = path.resolve(process.cwd(), outputArg);

  try {
    const area = readJson(inputPath);
    const patchSuggestion = createPatchSuggestion(area, {
      sourceFile: inputArg,
      targetFile: 'data/gameData.js'
    });
    writeJson(outputPath, patchSuggestion);

    console.log(`Source area file: ${inputPath}`);
    console.log(`Output patch suggestion file: ${outputPath}`);
    console.log('PASS: Patch suggestion written.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  readJson,
  writeJson,
  toRoomMap,
  collectUniqueReferences,
  findMissingReferences,
  findRoomIdConflicts,
  createPatchSuggestion
};
