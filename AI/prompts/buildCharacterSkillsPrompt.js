function buildCharacterSkillsPrompt() {
  return [
    "Character skills rules:",
    "- skills MUST be a JSON object map, NOT an array.",
    "- skills MUST contain exactly 3 skills.",
    "- player.skills MUST be an array of skill ids that exist in skills.",
    "- Each skill MUST include id, name, mpCost, damage, description, role, hitCount, heal, shield, defenseBonus, duration, scaling, flavorText.",
    "- role MUST be one of basic, signature, damage, defense, heal, utility.",
    "- scaling MUST be attack, defense, maxHp, maxMp, or none.",
    "- Use numeric fields even when the value is 0.",
    "- Include one stable low-cost damage skill, one stronger attack skill, and one defense or utility skill.",
    "- Basic skill: mpCost 0 or 1, damage should be player.attack + 1 to 3.",
    "- Signature skill: mpCost 3 to 5, damage should be about 1.5x to 2x the basic skill.",
    "- Defense / utility skill: mpCost 2 to 4, damage 0 unless it is a mixed utility skill.",
    "- Player maxMp must allow the signature skill at least two uses.",
    "- Defensive or utility skills may use damage: 0.",
    "- Heal skills should set heal > 0 and damage 0.",
    "- Defense skills should set defenseBonus or shield and duration.",
    "- Do not use generic ids like slash, fireball, guard unless the character prompt specifically asks for them.",
  ].join("\n");
}

module.exports = {
  buildCharacterSkillsPrompt,
};
