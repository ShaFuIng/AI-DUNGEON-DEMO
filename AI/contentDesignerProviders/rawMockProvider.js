const mockProvider = require('./mockProvider');

function generateRawArea(input = {}) {
  const area = mockProvider.generateArea(input);
  return JSON.stringify(area, null, 2);
}

module.exports = {
  generateRawArea
};
