const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isSnakeCase(value) {
  return typeof value === "string" && /^[a-z0-9_]+$/.test(value);
}

function validateArea(area) {
  const errors = [];

  if (!area || typeof area !== "object" || Array.isArray(area)) {
    errors.push("Root must be an object.");
    return errors;
  }

  const requiredRoot = ["id", "name", "theme", "narrativeHook", "difficulty", "rooms"];
  for (const key of requiredRoot) {
    if (!(key in area)) errors.push(`Missing root field: ${key}`);
  }

  if (!isSnakeCase(area.id) || area.id.length < 3) {
    errors.push("id must be snake_case and at least 3 chars.");
  }

  if (typeof area.name !== "string" || area.name.trim() === "") {
    errors.push("name must be a non-empty string.");
  }

  if (typeof area.theme !== "string" || area.theme.trim() === "") {
    errors.push("theme must be a non-empty string.");
  }

  if (typeof area.narrativeHook !== "string" || area.narrativeHook.trim() === "") {
    errors.push("narrativeHook must be a non-empty string.");
  }

  if (!Number.isInteger(area.difficulty) || area.difficulty < 1 || area.difficulty > 10) {
    errors.push("difficulty must be an integer between 1 and 10.");
  }

  if (!Array.isArray(area.rooms) || area.rooms.length < 1) {
    errors.push("rooms must be a non-empty array.");
    return errors;
  }

  const roomIds = new Set();

  area.rooms.forEach((room, idx) => {
    const prefix = `rooms[${idx}]`;

    if (!room || typeof room !== "object" || Array.isArray(room)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    const requiredRoom = ["id", "name", "description", "exits", "items", "monster"];
    for (const key of requiredRoom) {
      if (!(key in room)) errors.push(`Missing ${prefix}.${key}`);
    }

    if (!isSnakeCase(room.id) || room.id.length < 3) {
      errors.push(`${prefix}.id must be snake_case and at least 3 chars.`);
    } else {
      if (roomIds.has(room.id)) errors.push(`${prefix}.id duplicates another room id.`);
      roomIds.add(room.id);
    }

    if (typeof room.name !== "string" || room.name.trim() === "") {
      errors.push(`${prefix}.name must be a non-empty string.`);
    }

    if (typeof room.description !== "string" || room.description.trim() === "") {
      errors.push(`${prefix}.description must be a non-empty string.`);
    }

    if (!room.exits || typeof room.exits !== "object" || Array.isArray(room.exits)) {
      errors.push(`${prefix}.exits must be an object.`);
    } else {
      const directions = ["north", "south", "east", "west"];
      for (const key of Object.keys(room.exits)) {
        if (!directions.includes(key)) errors.push(`${prefix}.exits has invalid direction: ${key}`);
        if (!isSnakeCase(room.exits[key])) errors.push(`${prefix}.exits.${key} must be snake_case room id.`);
      }
    }

    if (!Array.isArray(room.items)) {
      errors.push(`${prefix}.items must be an array.`);
    } else {
      room.items.forEach((itemId, itemIdx) => {
        if (!isSnakeCase(itemId)) errors.push(`${prefix}.items[${itemIdx}] must be snake_case string.`);
      });
    }

    if (!(room.monster === null || isSnakeCase(room.monster))) {
      errors.push(`${prefix}.monster must be null or snake_case string.`);
    }
  });

  area.rooms.forEach((room, idx) => {
    if (!room || typeof room !== "object" || !room.exits || typeof room.exits !== "object") return;
    for (const [direction, target] of Object.entries(room.exits)) {
      if (typeof target === "string" && !roomIds.has(target)) {
        errors.push(`rooms[${idx}].exits.${direction} points to unknown room id: ${target}`);
      }
    }
  });

  return errors;
}

function main() {
  const inputArg = process.argv[2] || "outputs/generatedArea.json";
  const inputPath = path.resolve(process.cwd(), inputArg);
  const schemaPath = path.resolve(process.cwd(), "schemas/generatedArea.schema.json");

  try {
    readJson(schemaPath);
  } catch (error) {
    console.error("Failed to read schema file:", schemaPath);
    console.error(error.message);
    process.exit(1);
  }

  let area;
  try {
    area = readJson(inputPath);
  } catch (error) {
    console.error("Failed to read area file:", inputPath);
    console.error(error.message);
    process.exit(1);
  }

  const errors = validateArea(area);

  if (errors.length === 0) {
    console.log(`PASS: ${inputArg} is valid for Phase 1 MVP contract.`);
    process.exit(0);
  }

  console.error(`FAIL: ${inputArg} has ${errors.length} validation error(s):`);
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

main();
