export function formatSkillNumbers(skill = {}) {
  const parts = [`MP ${Number(skill.mpCost) || 0}`];
  const damage = Number(skill.damage) || 0;
  const hitCount = Number(skill.hitCount) || 1;
  const heal = Number(skill.heal) || 0;
  const defenseBonus = Number(skill.defenseBonus) || 0;
  const shield = Number(skill.shield) || 0;
  const duration = Number(skill.duration) || 0;

  if (damage > 0) parts.push(`DMG ${damage}`);
  if (hitCount > 1) parts.push(`${hitCount} hits`);
  if (heal > 0) parts.push(`HEAL ${heal}`);
  if (defenseBonus > 0) parts.push(`DEF +${defenseBonus}`);
  if (shield > 0) parts.push(`SHIELD ${shield}`);
  if (duration > 0) parts.push(`${duration} turns`);

  return parts.join(" / ");
}

export function getSkillRoleLabel(skill = {}) {
  return skill.role || (Number(skill.heal) > 0 ? "heal" : "damage");
}
