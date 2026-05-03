function generateRawArea(input = {}) {
  void input;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for gemini provider.');
  }

  throw new Error('Gemini provider API call is not implemented yet.');
}

module.exports = {
  generateRawArea
};
