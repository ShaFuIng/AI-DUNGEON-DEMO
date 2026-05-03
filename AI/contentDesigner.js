const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const mockProvider = require('./contentDesignerProviders/mockProvider');
const rawMockProvider = require('./contentDesignerProviders/rawMockProvider');
const geminiProvider = require('./contentDesignerProviders/geminiProvider');
const { parseProviderJsonOutput } = require('./contentDesignerUtils/parseProviderJsonOutput');

function getArgValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) {
    return undefined;
  }
  return args[index + 1];
}

function parseIntegerArg(args, name) {
  const value = getArgValue(args, name);
  if (value === undefined) {
    return undefined;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Invalid integer value for ${name}: ${value}`);
  }

  return Number(value);
}

function buildProviderInput(args) {
  return {
    theme: getArgValue(args, '--theme'),
    difficulty: parseIntegerArg(args, '--difficulty'),
    roomCount: parseIntegerArg(args, '--room-count')
  };
}

function resolveProvider(providerName) {
  const effectiveProvider = providerName || 'mock';

  if (effectiveProvider === 'mock') {
    return mockProvider;
  }

  if (effectiveProvider === 'raw-mock') {
    return rawMockProvider;
  }

  if (effectiveProvider === 'gemini') {
    return geminiProvider;
  }

  throw new Error(`Unsupported content designer provider: ${effectiveProvider}`);
}

function generateAreaFromRawProvider(provider, input = {}) {
  if (typeof provider.generateRawArea !== 'function') {
    throw new Error('Provider does not support raw area generation.');
  }

  const rawText = provider.generateRawArea(input);
  return parseProviderJsonOutput(rawText);
}

function generateAreaWithProvider(providerName, input = {}) {
  const provider = resolveProvider(providerName);

  if (typeof provider.generateArea === 'function') {
    return provider.generateArea(input);
  }

  if (typeof provider.generateRawArea === 'function') {
    return generateAreaFromRawProvider(provider, input);
  }

  throw new Error('Provider must implement generateArea() or generateRawArea().');
}

function createMockGeneratedArea(input = {}) {
  return generateAreaWithProvider('mock', input);
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
  console.log('  node AI/contentDesigner.js                                                                      Print generatedArea JSON (default provider: mock)');
  console.log('  node AI/contentDesigner.js --provider mock                                                      Print generatedArea JSON with mock provider');
  console.log('  node AI/contentDesigner.js --provider raw-mock                                                  Print generatedArea JSON with raw-mock provider');
  console.log('  node AI/contentDesigner.js --provider gemini --theme "冰封遺跡"                                 Run gemini provider skeleton (API not implemented yet)');
  console.log('  node AI/contentDesigner.js --provider mock --write                                              Write generatedArea JSON to outputs/generatedArea.json');
  console.log('  node AI/contentDesigner.js --provider mock --write --validate                                   Write generatedArea JSON and run validator');
  console.log('  node AI/contentDesigner.js --provider raw-mock --theme "沉沒圖書館" --write --validate           Generate, parse, write, and validate with raw-mock provider');
  console.log('  node AI/contentDesigner.js --provider mock --theme "冰封遺跡"                                     Generate JSON with a custom theme');
  console.log('Options:');
  console.log('  --provider <name>       Provider name (supported: mock, raw-mock, gemini)');
  console.log('  --theme <text>          Theme input for provider');
  console.log('  --difficulty <1-10>     Difficulty input for provider (integer)');
  console.log('  --room-count <number>   Room count input for provider (integer)');
  console.log('  --write                 Write generated JSON to outputs/generatedArea.json');
  console.log('  --validate              Run validator after --write');
  console.log('  --help, -h              Show this help message');
}

module.exports = {
  createMockGeneratedArea,
  writeGeneratedArea,
  getDefaultOutputPath,
  getProjectRoot,
  validateGeneratedArea,
  getArgValue,
  resolveProvider,
  generateAreaWithProvider,
  parseIntegerArg,
  buildProviderInput,
  generateAreaFromRawProvider
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
    const input = buildProviderInput(args);
    area = generateAreaWithProvider(providerName, input);
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
