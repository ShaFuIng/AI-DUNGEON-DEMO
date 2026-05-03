function isPlainObject(value) {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function parseProviderJsonOutput(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('Provider output must be a string.');
  }

  const trimmed = rawText.trim();

  if (trimmed.length === 0) {
    throw new Error('Provider output is empty.');
  }

  if (trimmed.includes('```json') || trimmed.includes('```')) {
    throw new Error('Provider output must be raw JSON without markdown code fences.');
  }

  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    throw new Error('Provider output must be a single JSON object.');
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse provider JSON output: ${error.message}`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error('Provider JSON output must be an object.');
  }

  return parsed;
}

module.exports = {
  parseProviderJsonOutput,
  isPlainObject
};

if (require.main === module) {
  const rawInput = process.argv[2];

  if (rawInput === undefined) {
    console.log("Usage: node AI/contentDesignerUtils/parseProviderJsonOutput.js '<json-string>'");
    process.exit(0);
  }

  try {
    const parsed = parseProviderJsonOutput(rawInput);
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
