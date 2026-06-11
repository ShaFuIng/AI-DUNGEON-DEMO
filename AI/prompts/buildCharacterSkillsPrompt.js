function buildCharacterSkillsPrompt() {
  return [
    "Character skills rules:",
    "- skills MUST be a JSON object map, NOT an array.",
    "- skills MUST contain exactly 3 skills.",
    "- player.skills MUST be an array of skill ids that exist in skills.",
    "- Each skill MUST include id, name, mpCost, damage, description, role.",
    "- role MUST be one of damage, defense, utility.",
    "- Include one stable low-cost damage skill, one stronger attack skill, and one defense or utility skill.",
    "- Defensive or utility skills may use damage: 0.",
    "- Do not use generic ids like slash, fireball, guard unless the character prompt specifically asks for them.",
  ].join("\n");
}

module.exports = {
  buildCharacterSkillsPrompt,
};
