function getGameDataSource() {
  return process.env.GAME_DATA_SOURCE || 'default';
}

function loadGameData() {
  const source = getGameDataSource();

  if (source === 'default') {
    return require('./gameData');
  }

  if (source === 'experimental') {
    return require('./gameData.experimental');
  }

  throw new Error(`Unsupported GAME_DATA_SOURCE: ${source}`);
}

module.exports = {
  getGameDataSource,
  loadGameData
};
