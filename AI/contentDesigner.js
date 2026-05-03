const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const mockProvider = require('./contentDesignerProviders/mockProvider');

function getArgValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return undefined;
  }
  return args[index + 1];
}

function resolveProvider(providerName) {
  const effectiveProvider = providerName || 'mock';

  if (effectiveProvider === 'mock') {
    return mockProvider;
  }

  throw new Error(`Unsupported content designer provider: ${effectiveProvider}`);
}

function generateAreaWithProvider(providerName, input = {}) {
  const provider = resolveProvider(providerName);
  return provider.generateArea(input);
}

function createMockGeneratedArea() {
  return generateAreaWithProvider('mock');
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
  console.log('  node AI/contentDesigner.js                                      Print generatedArea JSON (default provider: mock)');
  console.log('  node AI/contentDesigner.js --provider mock                      Print generatedArea JSON with mock provider');
  console.log('  node AI/contentDesigner.js --provider mock --write              Write generatedArea JSON to outputs/generatedArea.json');
  console.log('  node AI/contentDesigner.js --provider mock --write --validate   Write generatedArea JSON and run validator');
  console.log('  node AI/contentDesigner.js --help                               Show this help message');
}

module.exports = {
  createMockGeneratedArea,
  writeGeneratedArea,
  getDefaultOutputPath,
  getProjectRoot,
  validateGeneratedArea,
  getArgValue,
  resolveProvider,
  generateAreaWithProvider
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const wantsHelp = args.includes('--help') || args.includes('-h');
  const wantsWrite = args.includes('--write');
  const wantsValidate = args.includes('--validate');
  const providerName = getArgValue(args, '--provider');

  if (wantsHelp) {
    printHelp();
    process.exit(0);
  }

  if (wantsValidate && !wantsWrite) {
    console.error('ERROR: --validate must be used with --write.');
    process.exit(1);
  }

  let area;
  try {
    area = generateAreaWithProvider(providerName);
  } catch (error) {
    console.error(error.message);
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
