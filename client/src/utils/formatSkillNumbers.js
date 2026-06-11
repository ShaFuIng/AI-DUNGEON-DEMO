export function formatSkillNumbers(skill = {}) {
  const parts = [`MP ${Number(skill.mpCost) || 0}`];
  const damage = Number(skill.damage) || 0;
  const hitCount = Number(skill.hitCount) || 1;
  const heal = Number(skill.heal) || 0;
  const defenseBonus = Number(skill.defenseBonus) || 0;
  const shield = Number(skill.shield) || 0;
  const duration = Number(skill.duration) || 0;

  if (damage > 0) parts.push(`傷害 ${damage}`);
  if (hitCount > 1) parts.push(`${hitCount} 段`);
  if (heal > 0) parts.push(`治療 ${heal}`);
  if (defenseBonus > 0) parts.push(`防禦 +${defenseBonus}`);
  if (shield > 0) parts.push(`護盾 ${shield}`);
  if (duration > 0) parts.push(`${duration} 回合`);

  return parts.join(" / ");
}

export function getSkillRoleLabel(skill = {}) {
  const role = skill.role || (Number(skill.heal) > 0 ? "heal" : "damage");
  return {
    basic: "基礎",
    signature: "招牌",
    damage: "攻擊",
    defense: "防禦",
    heal: "治療",
    utility: "輔助",
  }[role] || role;
}
