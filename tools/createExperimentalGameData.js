const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = 'outputs/generatedArea.patchSuggestion.json';
const DEFAULT_OUTPUT = 'data/gameData.experimental.js';

function readJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`Input file not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
    }
    throw new Error(`Failed to read JSON at ${filePath}: ${error.message}`);
  }
}

function escapeJsString(value) {
  return JSON.stringify(value);
}

function createAsciiPlaceholder(roomId, roomName, index) {
  return [
    '==========',
    `ROOM ${index + 1}`,
    `[${roomName}]`,
    `<${roomId}>`,
    '=========='
  ].join('\n');
}

function renderRoomObject(room, index) {
  const ascii = typeof room.ascii === 'string' && room.ascii.trim() !== ''
    ? room.ascii
    : createAsciiPlaceholder(room.id, room.name, index);

  const roomData = {
    id: room.id,
    name: room.name,
    description: room.description,
    ascii,
    exits: room.exits || {},
    items: room.items || [],
    monster: room.monster ?? null
  };

  return JSON.stringify(roomData, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function renderExperimentalGameData(patchSuggestion) {
  const roomsToAdd = patchSuggestion.roomsToAdd || {};
  const roomIds = Object.keys(roomsToAdd);

  if (roomIds.length === 0) {
    throw new Error('patchSuggestion.roomsToAdd must contain at least one room.');
  }

  const roomsRendered = roomIds
    .map((roomId, index) => `${roomId}: ${renderRoomObject(roomsToAdd[roomId], index).trimStart()}`)
    .join(',\n\n');

  const initialRoomId = roomIds[0];

  return [
    "const baseGameData = require('./gameData');",
    '',
    'const experimentalRooms = {',
    roomsRendered
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n'),
    '};',
    '',
    'module.exports = {',
    `  initialRoomId: ${escapeJsString(initialRoomId)},`,
    '  rooms: experimentalRooms,',
    '  items: baseGameData.items,',
    '  monsters: baseGameData.monsters,',
    '  skills: baseGameData.skills',
    '};'
  ].join('\n');
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, `${content}\n`, 'utf8');
}

function createExperimentalGameData(inputPath, outputPath) {
  const patchSuggestion = readJson(inputPath);

  if (patchSuggestion.type !== 'gameDataPatchSuggestion') {
    throw new Error('patchSuggestion.type must be gameDataPatchSuggestion.');
  }

  if (!patchSuggestion.roomsToAdd || typeof patchSuggestion.roomsToAdd !== 'object') {
    throw new Error('patchSuggestion.roomsToAdd must be an object.');
  }

  if (patchSuggestion.requiresHumanReview !== true) {
    throw new Error('patchSuggestion.requiresHumanReview must be true.');
  }

  const missing = patchSuggestion.missingReferences || {};
  const hasMissingRefs = (missing.items || []).length > 0 ||
    (missing.monsters || []).length > 0 ||
    (missing.skills || []).length > 0;

  if (hasMissingRefs) {
    throw new Error('Cannot create experimental gameData because patch suggestion has missing references.');
  }

  const roomIdConflicts = patchSuggestion.roomIdConflicts || [];
  if (roomIdConflicts.length > 0) {
    throw new Error('Cannot create experimental gameData because patch suggestion has room id conflicts.');
  }

  const content = renderExperimentalGameData(patchSuggestion);
  writeText(outputPath, content);
  return outputPath;
}

function printHelp() {
  console.log('Usage:');
  console.log('  node tools/createExperimentalGameData.js');
  console.log('  node tools/createExperimentalGameData.js <input-path>');
  console.log('  node tools/createExperimentalGameData.js <input-path> <output-path>');
  console.log('  node tools/createExperimentalGameData.js --help');
  console.log('  node tools/createExperimentalGameData.js -h');
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
    createExperimentalGameData(inputPath, outputPath);
    console.log(`Source patch suggestion file: ${inputPath}`);
    console.log(`Output experimental gameData file: ${outputPath}`);
    console.log('PASS: Experimental gameData written.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  readJson,
  escapeJsString,
  createAsciiPlaceholder,
  renderRoomObject,
  renderExperimentalGameData,
  writeText,
  createExperimentalGameData
};
