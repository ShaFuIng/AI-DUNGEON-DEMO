const fs = require("fs");
const path = require("path");
const gameData = require("../data/gameData");

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const ROOM_DIRECTIONS = ["north", "south", "east", "west"];
const OPPOSITE_DIRECTION = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

const ALLOWED_ROOT_KEYS = [
  "id",
  "name",
  "theme",
  "narrativeHook",
  "difficulty",
  "rooms",
  "items",
  "monsters",
  "skills",
  "traps",
];

const REQUIRED_ROOT_KEYS = ["id", "name", "theme", "narrativeHook", "difficulty", "rooms"];
const REQUIRED_ROOM_KEYS = ["id", "name", "description", "exits", "items", "monster"];
const ALLOWED_ROOM_KEYS = ["id", "name", "description", "exits", "items", "monster", "traps"];
const ALLOWED_ITEM_KEYS = ["id", "name", "description", "type", "effect"];
const ALLOWED_MONSTER_KEYS = ["id", "name", "description", "maxHp", "attack", "tags"];
const ALLOWED_SKILL_KEYS = ["id", "name", "description", "mpCost", "damage", "effect"];
const ALLOWED_TRAP_KEYS = ["id", "name", "description", "damage", "trigger"];

const ITEM_TYPES = ["tool", "key", "quest", "consumable", "material"];
const TRAP_TRIGGERS = ["enter_room", "take_item", "open_exit", "inspect"];

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSnakeCase(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function hasOnlyAllowedKeys(obj, allowedKeys, label, errors) {
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${label} has unknown field: ${key}`);
    }
  }
}

function validateRequiredFields(obj, requiredFields, label, errors) {
  for (const field of requiredFields) {
    if (!(field in obj)) {
      errors.push(`Missing ${label}.${field}`);
    }
  }
}

function validateNoDuplicateStrings(values, label, errors) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${label} has duplicate id: ${value}`);
    }
    seen.add(value);
  }
}

function validateRootItems(area, errors) {
  const createdItemIds = new Set();
  if (!("items" in area)) return createdItemIds;

  if (!isPlainObject(area.items)) {
    errors.push("Root.items must be an object.");
    return createdItemIds;
  }

  const itemKeys = Object.keys(area.items);
  validateNoDuplicateStrings(itemKeys, "Root.items", errors);

  for (const key of itemKeys) {
    const label = `items.${key}`;
    if (!isSnakeCase(key)) {
      errors.push(`${label} key must be snake_case.`);
      continue;
    }

    const item = area.items[key];
    if (!isPlainObject(item)) {
      errors.push(`${label} must be an object.`);
      continue;
    }

    hasOnlyAllowedKeys(item, ALLOWED_ITEM_KEYS, label, errors);
    validateRequiredFields(item, ["id", "name", "description", "type"], label, errors);

    if (!isSnakeCase(item.id)) {
      errors.push(`${label}.id must be snake_case.`);
    }

    if (item.id !== key) {
      errors.push(`${label}.id must match key: ${key}`);
    }

    if (!isNonEmptyString(item.name)) {
      errors.push(`${label}.name must be a non-empty string.`);
    }

    if (!isNonEmptyString(item.description)) {
      errors.push(`${label}.description must be a non-empty string.`);
    }

    if (!ITEM_TYPES.includes(item.type)) {
      errors.push(`${label}.type must be one of: ${ITEM_TYPES.join(", ")}.`);
    }

    if ("effect" in item) {
      if (!isPlainObject(item.effect)) {
        errors.push(`${label}.effect must be an object.`);
      } else {
        hasOnlyAllowedKeys(item.effect, ["hp", "mp", "attack", "defense"], `${label}.effect`, errors);

        if ("hp" in item.effect && (!Number.isInteger(item.effect.hp) || item.effect.hp < 0)) {
          errors.push(`${label}.effect.hp must be an integer >= 0.`);
        }

        if ("mp" in item.effect && (!Number.isInteger(item.effect.mp) || item.effect.mp < 0)) {
          errors.push(`${label}.effect.mp must be an integer >= 0.`);
        }

        if ("attack" in item.effect && !Number.isInteger(item.effect.attack)) {
          errors.push(`${label}.effect.attack must be an integer.`);
        }

        if ("defense" in item.effect && !Number.isInteger(item.effect.defense)) {
          errors.push(`${label}.effect.defense must be an integer.`);
        }
      }
    }

    createdItemIds.add(key);
  }

  return createdItemIds;
}

function validateRootMonsters(area, errors) {
  const createdMonsterIds = new Set();
  if (!("monsters" in area)) return createdMonsterIds;

  if (!isPlainObject(area.monsters)) {
    errors.push("Root.monsters must be an object.");
    return createdMonsterIds;
  }

  const monsterKeys = Object.keys(area.monsters);
  validateNoDuplicateStrings(monsterKeys, "Root.monsters", errors);

  for (const key of monsterKeys) {
    const label = `monsters.${key}`;
    if (!isSnakeCase(key)) {
      errors.push(`${label} key must be snake_case.`);
      continue;
    }

    const monster = area.monsters[key];
    if (!isPlainObject(monster)) {
      errors.push(`${label} must be an object.`);
      continue;
    }

    hasOnlyAllowedKeys(monster, ALLOWED_MONSTER_KEYS, label, errors);
    validateRequiredFields(monster, ["id", "name", "description", "maxHp", "attack"], label, errors);

    if (!isSnakeCase(monster.id)) {
      errors.push(`${label}.id must be snake_case.`);
    }

    if (monster.id !== key) {
      errors.push(`${label}.id must match key: ${key}`);
    }

    if (!isNonEmptyString(monster.name)) {
      errors.push(`${label}.name must be a non-empty string.`);
    }

    if (!isNonEmptyString(monster.description)) {
      errors.push(`${label}.description must be a non-empty string.`);
    }

    if (!Number.isInteger(monster.maxHp) || monster.maxHp < 1) {
      errors.push(`${label}.maxHp must be an integer >= 1.`);
    }

    if (!Number.isInteger(monster.attack) || monster.attack < 0) {
      errors.push(`${label}.attack must be an integer >= 0.`);
    }

    if ("tags" in monster) {
      if (!Array.isArray(monster.tags)) {
        errors.push(`${label}.tags must be an array.`);
      } else {
        const seenTags = new Set();
        monster.tags.forEach((tag, tagIdx) => {
          if (typeof tag !== "string") {
            errors.push(`${label}.tags[${tagIdx}] must be a string.`);
            return;
          }
          if (seenTags.has(tag)) {
            errors.push(`${label}.tags has duplicate tag: ${tag}`);
          }
          seenTags.add(tag);
        });
      }
    }

    createdMonsterIds.add(key);
  }

  return createdMonsterIds;
}

function validateRootSkills(area, errors) {
  if (!("skills" in area)) return;

  if (!isPlainObject(area.skills)) {
    errors.push("Root.skills must be an object.");
    return;
  }

  for (const key of Object.keys(area.skills)) {
    const label = `skills.${key}`;
    if (!isSnakeCase(key)) {
      errors.push(`${label} key must be snake_case.`);
      continue;
    }

    const skill = area.skills[key];
    if (!isPlainObject(skill)) {
      errors.push(`${label} must be an object.`);
      continue;
    }

    hasOnlyAllowedKeys(skill, ALLOWED_SKILL_KEYS, label, errors);
    validateRequiredFields(skill, ["id", "name", "description", "mpCost", "damage"], label, errors);

    if (!isSnakeCase(skill.id)) {
      errors.push(`${label}.id must be snake_case.`);
    }

    if (skill.id !== key) {
      errors.push(`${label}.id must match key: ${key}`);
    }

    if (!isNonEmptyString(skill.name)) {
      errors.push(`${label}.name must be a non-empty string.`);
    }

    if (!isNonEmptyString(skill.description)) {
      errors.push(`${label}.description must be a non-empty string.`);
    }

    if (!Number.isInteger(skill.mpCost) || skill.mpCost < 0) {
      errors.push(`${label}.mpCost must be an integer >= 0.`);
    }

    if (!Number.isInteger(skill.damage) || skill.damage < 0) {
      errors.push(`${label}.damage must be an integer >= 0.`);
    }

    if ("effect" in skill) {
      if (!isPlainObject(skill.effect)) {
        errors.push(`${label}.effect must be an object.`);
      } else {
        hasOnlyAllowedKeys(skill.effect, ["guard", "heal", "status"], `${label}.effect`, errors);

        if ("guard" in skill.effect && typeof skill.effect.guard !== "boolean") {
          errors.push(`${label}.effect.guard must be a boolean.`);
        }

        if ("heal" in skill.effect && (!Number.isInteger(skill.effect.heal) || skill.effect.heal < 0)) {
          errors.push(`${label}.effect.heal must be an integer >= 0.`);
        }

        if ("status" in skill.effect && typeof skill.effect.status !== "string") {
          errors.push(`${label}.effect.status must be a string.`);
        }
      }
    }
  }
}

function validateRootTraps(area, errors) {
  const trapIdSet = new Set();
  if (!("traps" in area)) return trapIdSet;

  if (!Array.isArray(area.traps)) {
    errors.push("Root.traps must be an array.");
    return trapIdSet;
  }

  area.traps.forEach((trap, idx) => {
    const label = `traps[${idx}]`;
    if (!isPlainObject(trap)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    hasOnlyAllowedKeys(trap, ALLOWED_TRAP_KEYS, label, errors);
    validateRequiredFields(trap, ["id", "name", "description", "damage"], label, errors);

    if (!isSnakeCase(trap.id)) {
      errors.push(`${label}.id must be snake_case.`);
    } else if (trapIdSet.has(trap.id)) {
      errors.push(`${label}.id duplicates another trap id: ${trap.id}`);
    } else {
      trapIdSet.add(trap.id);
    }

    if (!isNonEmptyString(trap.name)) {
      errors.push(`${label}.name must be a non-empty string.`);
    }

    if (!isNonEmptyString(trap.description)) {
      errors.push(`${label}.description must be a non-empty string.`);
    }

    if (!Number.isInteger(trap.damage) || trap.damage < 0) {
      errors.push(`${label}.damage must be an integer >= 0.`);
    }

    if ("trigger" in trap && !TRAP_TRIGGERS.includes(trap.trigger)) {
      errors.push(`${label}.trigger must be one of: ${TRAP_TRIGGERS.join(", ")}`);
    }
  });

  return trapIdSet;
}

function validateBidirectionalExits(area, roomById, errors) {
  area.rooms.forEach((room, idx) => {
    if (!isPlainObject(room) || !isPlainObject(room.exits)) return;

    for (const [direction, targetId] of Object.entries(room.exits)) {
      if (!ROOM_DIRECTIONS.includes(direction) || typeof targetId !== "string") continue;

      const targetRoom = roomById.get(targetId);
      if (!targetRoom || !isPlainObject(targetRoom.room) || !isPlainObject(targetRoom.room.exits)) continue;

      const backDirection = OPPOSITE_DIRECTION[direction];
      if (targetRoom.room.exits[backDirection] !== room.id) {
        errors.push(
          `rooms[${idx}].exits.${direction} points to ${targetId}, but target room does not point back via ${backDirection}.`
        );
      }
    }
  });
}

function validateReachability(area, roomById, errors) {
  if (!area.rooms.length || !isPlainObject(area.rooms[0])) return;

  const startId = area.rooms[0].id;
  if (!isSnakeCase(startId)) return;

  const visited = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = roomById.get(currentId);
    if (!current || !isPlainObject(current.room) || !isPlainObject(current.room.exits)) continue;

    for (const targetId of Object.values(current.room.exits)) {
      if (typeof targetId === "string" && roomById.has(targetId) && !visited.has(targetId)) {
        queue.push(targetId);
      }
    }
  }

  area.rooms.forEach((room, idx) => {
    if (isPlainObject(room) && isSnakeCase(room.id) && !visited.has(room.id)) {
      errors.push(`rooms[${idx}] is unreachable from start room: ${startId}`);
    }
  });
}

function validateRoomReferences(area, gameDataSource, createdItemIds, createdMonsterIds, trapIdSet, errors) {
  const baseItems = new Set(Object.keys((gameDataSource && gameDataSource.items) || {}));
  const baseMonsters = new Set(Object.keys((gameDataSource && gameDataSource.monsters) || {}));

  area.rooms.forEach((room, roomIdx) => {
    if (!isPlainObject(room)) return;

    if (Array.isArray(room.items)) {
      room.items.forEach((itemId, itemIdx) => {
        if (typeof itemId !== "string") return;
        if (!baseItems.has(itemId) && !createdItemIds.has(itemId)) {
          errors.push(`rooms[${roomIdx}].items[${itemIdx}] references unknown item id: ${itemId}`);
        }
      });
    }

    if (typeof room.monster === "string") {
      if (!baseMonsters.has(room.monster) && !createdMonsterIds.has(room.monster)) {
        errors.push(`rooms[${roomIdx}].monster references unknown monster id: ${room.monster}`);
      }
    }

    if (Array.isArray(room.traps)) {
      room.traps.forEach((trapId, trapIdx) => {
        if (typeof trapId !== "string") return;
        if (!trapIdSet.has(trapId)) {
          errors.push(`rooms[${roomIdx}].traps[${trapIdx}] references unknown trap id: ${trapId}`);
        }
      });
    }
  });
}

function validateArea(area) {
  const errors = [];

  if (!isPlainObject(area)) {
    errors.push("Root must be an object.");
    return errors;
  }

  hasOnlyAllowedKeys(area, ALLOWED_ROOT_KEYS, "Root", errors);
  validateRequiredFields(area, REQUIRED_ROOT_KEYS, "root field", errors);

  if (!isSnakeCase(area.id) || area.id.length < 3) {
    errors.push("id must be snake_case and at least 3 chars.");
  }

  if (!isNonEmptyString(area.name)) {
    errors.push("name must be a non-empty string.");
  }

  if (!isNonEmptyString(area.theme)) {
    errors.push("theme must be a non-empty string.");
  }

  if (!isNonEmptyString(area.narrativeHook)) {
    errors.push("narrativeHook must be a non-empty string.");
  }

  if (!Number.isInteger(area.difficulty) || area.difficulty < 1 || area.difficulty > 10) {
    errors.push("difficulty must be an integer between 1 and 10.");
  }

  const createdItemIds = validateRootItems(area, errors);
  const createdMonsterIds = validateRootMonsters(area, errors);
  validateRootSkills(area, errors);
  const trapIdSet = validateRootTraps(area, errors);

  if (!Array.isArray(area.rooms) || area.rooms.length < 1) {
    errors.push("rooms must be a non-empty array.");
    return errors;
  }

  const roomById = new Map();
  const roomIds = new Set();

  area.rooms.forEach((room, idx) => {
    const prefix = `rooms[${idx}]`;

    if (!isPlainObject(room)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    hasOnlyAllowedKeys(room, ALLOWED_ROOM_KEYS, prefix, errors);
    validateRequiredFields(room, REQUIRED_ROOM_KEYS, prefix, errors);

    if (!isSnakeCase(room.id) || room.id.length < 3) {
      errors.push(`${prefix}.id must be snake_case and at least 3 chars.`);
    } else {
      if (roomIds.has(room.id)) {
        errors.push(`${prefix}.id duplicates another room id.`);
      }
      roomIds.add(room.id);
      roomById.set(room.id, { room, idx });
    }

    if (!isNonEmptyString(room.name)) {
      errors.push(`${prefix}.name must be a non-empty string.`);
    }

    if (!isNonEmptyString(room.description)) {
      errors.push(`${prefix}.description must be a non-empty string.`);
    }

    if (!isPlainObject(room.exits)) {
      errors.push(`${prefix}.exits must be an object.`);
    } else {
      for (const key of Object.keys(room.exits)) {
        if (!ROOM_DIRECTIONS.includes(key)) {
          errors.push(`${prefix}.exits has invalid direction: ${key}`);
          continue;
        }

        if (!isSnakeCase(room.exits[key])) {
          errors.push(`${prefix}.exits.${key} must be snake_case room id.`);
        }
      }
    }

    if (!Array.isArray(room.items)) {
      errors.push(`${prefix}.items must be an array.`);
    } else {
      const seenItemIds = new Set();
      room.items.forEach((itemId, itemIdx) => {
        if (!isSnakeCase(itemId)) {
          errors.push(`${prefix}.items[${itemIdx}] must be snake_case string.`);
          return;
        }

        if (seenItemIds.has(itemId)) {
          errors.push(`${prefix}.items has duplicate item id: ${itemId}`);
        }
        seenItemIds.add(itemId);
      });
    }

    if (!(room.monster === null || isSnakeCase(room.monster))) {
      errors.push(`${prefix}.monster must be null or snake_case string.`);
    }

    if ("traps" in room) {
      if (!Array.isArray(room.traps)) {
        errors.push(`${prefix}.traps must be an array.`);
      } else {
        const seenTrapIds = new Set();
        room.traps.forEach((trapId, trapIdx) => {
          if (!isSnakeCase(trapId)) {
            errors.push(`${prefix}.traps[${trapIdx}] must be snake_case string.`);
            return;
          }
          if (seenTrapIds.has(trapId)) {
            errors.push(`${prefix}.traps has duplicate trap id: ${trapId}`);
          }
          seenTrapIds.add(trapId);
        });
      }
    }
  });

  area.rooms.forEach((room, idx) => {
    if (!isPlainObject(room) || !isPlainObject(room.exits)) return;
    for (const [direction, target] of Object.entries(room.exits)) {
      if (typeof target === "string" && !roomIds.has(target)) {
        errors.push(`rooms[${idx}].exits.${direction} points to unknown room id: ${target}`);
      }
    }
  });

  validateBidirectionalExits(area, roomById, errors);
  validateReachability(area, roomById, errors);
  validateRoomReferences(area, gameData, createdItemIds, createdMonsterIds, trapIdSet, errors);

  return errors;
}

function failWithMessage(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

function printHelp() {
  const lines = [
    "AI-DUNGEON-DEMO Area Validator",
    "",
    "Validate generatedArea JSON files for Content Designer Agent MVP / Phase 1.5.",
    "",
    "Usage:",
    "  node tools/validateArea.js [area-json-path]",
    "",
    "Examples:",
    "  node tools/validateArea.js",
    "  node tools/validateArea.js outputs/generatedArea.json",
    "  node tools/validateArea.js tools/sampleGeneratedArea.json",
    "  node tools/validateArea.js tools/validator-test-cases/validArea.json",
    "",
    "Default:",
    "  If no path is provided, validates outputs/generatedArea.json.",
    "",
    "Exit codes:",
    "  0 = validation passed",
    "  1 = validation failed or file error",
    "",
    "Notes:",
    "  - This validator is currently a hand-written validator.",
    "  - It reads schemas/generatedArea.schema.json but does not yet fully apply JSON Schema validation with AJV.",
    "  - Do not use this tool to modify gameData.js automatically."
  ];
  console.log(lines.join("\n"));
}

function resolveInputPath(inputArg) {
  return path.resolve(process.cwd(), inputArg || "outputs/generatedArea.json");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJsonFile(filePath, label, displayPath) {
  if (!fileExists(filePath)) {
    if (label === "area") {
      failWithMessage(`ERROR: Area file not found:\n${filePath}\n\nHint:\nCheck the path and try again.`);
    }

    failWithMessage(`ERROR: Schema file not found:\n${filePath}`);
  }

  try {
    return readJson(filePath);
  } catch (error) {
    const upperLabel = label === "area" ? "area" : "schema";
    failWithMessage(
      `ERROR: Failed to parse ${upperLabel} JSON file:\n${displayPath}\n\nResolved path:\n${filePath}\n\nReason:\n${error.message}`
    );
  }
}

function printRuntimeInfo(schemaPath, inputPath) {
  console.log(`Schema:\n${schemaPath}\n`);
  console.log(`Area file:\n${inputPath}\n`);
}

function main() {
  const arg1 = process.argv[2];

  if (arg1 === "--help" || arg1 === "-h") {
    printHelp();
    process.exit(0);
  }

  const inputArg = arg1 || "outputs/generatedArea.json";
  const inputPath = resolveInputPath(inputArg);
  const schemaArg = "schemas/generatedArea.schema.json";
  const schemaPath = path.resolve(process.cwd(), schemaArg);

  readJsonFile(schemaPath, "schema", schemaArg);
  const area = readJsonFile(inputPath, "area", inputArg);

  printRuntimeInfo(schemaPath, inputPath);

  const errors = validateArea(area);

  if (errors.length === 0) {
    console.log(`PASS: ${inputArg} is valid for Content Designer Agent contract.`);
    process.exit(0);
  }

  console.error(`FAIL: ${inputArg} has ${errors.length} validation error(s):`);
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

main();
