const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function createMockGeneratedArea() {
  return {
    id: 'frozen_ruins',
    name: '冰封遺跡',
    theme: '寒霜、冰晶、古代機關、被凍結的遺跡',
    narrativeHook: '你踏過結霜的石階，冰晶在火光裡折射出古老機關尚未熄滅的寒芒。',
    difficulty: 5,
    rooms: [
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
    ]
  };
}

function writeGeneratedArea(area, outputPath) {
  const content = `${JSON.stringify(area, null, 2)}\n`;
  fs.writeFileSync(outputPath, content, 'utf8');
}

function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

function getDefaultOutputPath() {
  return path.resolve(__dirname, '..', 'outputs', 'generatedArea.json');
}

function validateGeneratedArea(outputPath) {
  const validatorPath = path.join(getProjectRoot(), 'tools', 'validateArea.js');
  const result = spawnSync('node', [validatorPath, outputPath], {
    cwd: getProjectRoot(),
    stdio: 'inherit'
  });

  if (typeof result.status === 'number') {
    return result.status;
  }

  return 1;
}

function printHelp() {
  console.log('Usage:');
  console.log('  node AI/contentDesigner.js                    Print mock generatedArea JSON');
  console.log('  node AI/contentDesigner.js --write            Write mock JSON to outputs/generatedArea.json');
  console.log('  node AI/contentDesigner.js --write --validate Write mock JSON and run validator');
  console.log('  node AI/contentDesigner.js --help             Show this help message');
}

module.exports = {
  createMockGeneratedArea,
  writeGeneratedArea,
  getDefaultOutputPath,
  getProjectRoot,
  validateGeneratedArea
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const wantsHelp = args.includes('--help') || args.includes('-h');
  const wantsWrite = args.includes('--write');
  const wantsValidate = args.includes('--validate');
  const area = createMockGeneratedArea();

  if (wantsHelp) {
    printHelp();
    process.exit(0);
  }

  if (wantsValidate && !wantsWrite) {
    console.error('ERROR: --validate must be used with --write.');
    process.exit(1);
  }

  if (!wantsWrite) {
    console.log(JSON.stringify(area, null, 2));
    process.exit(0);
  }

  const outputPath = getDefaultOutputPath();
  writeGeneratedArea(area, outputPath);
  console.log(`Wrote generated area to: ${outputPath}`);

  if (wantsValidate) {
    const exitCode = validateGeneratedArea(outputPath);
    process.exit(exitCode);
  }
}
