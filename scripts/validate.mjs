#!/usr/bin/env node

/**
 * Validates all strategy JSON files in the strategies/ directory.
 *
 * Checks match the import logic in openpretext's parseImportedStrategies
 * (src/ai/AIStrategyIO.ts). Run locally before submitting a PR:
 *
 *   node scripts/validate.mjs
 *
 * Exit code 0 = all checks pass, 1 = one or more errors.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VALID_CATEGORIES = ['general', 'pattern', 'workflow', 'organism'];
const FILENAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.json$/;

const strategiesDir = join(fileURLToPath(import.meta.url), '..', '..', 'strategies');

async function main() {
  const entries = await readdir(strategiesDir);
  const files = entries.filter((f) => f.endsWith('.json')).sort();

  if (files.length === 0) {
    console.error('No .json files found in strategies/');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  let passedFiles = 0;
  const idMap = new Map(); // id -> [filename, ...]

  for (const file of files) {
    const { errors, warnings, id } = await validateFile(file);
    totalErrors += errors;
    totalWarnings += warnings;

    if (errors === 0) passedFiles++;

    if (id) {
      if (!idMap.has(id)) idMap.set(id, []);
      idMap.get(id).push(file);
    }
  }

  // Cross-file checks
  console.log('\nCross-file checks:');
  let duplicates = 0;
  for (const [id, filenames] of idMap) {
    if (filenames.length > 1) {
      console.log(`  FAIL  Duplicate id "${id}" in: ${filenames.join(', ')}`);
      duplicates++;
    }
  }
  totalErrors += duplicates;

  if (duplicates === 0) {
    console.log(`  ok    All ${idMap.size} strategy IDs are unique`);
  }

  // Summary
  const failedFiles = files.length - passedFiles;
  console.log(
    `\nResults: ${passedFiles} passed, ${failedFiles} failed, ${totalWarnings} warnings`,
  );
  process.exit(totalErrors > 0 ? 1 : 0);
}

async function validateFile(filename) {
  const filepath = join(strategiesDir, filename);
  const errors = [];
  const warnings = [];
  let id = null;

  console.log(`\nValidating strategies/${filename}`);

  // Filename convention
  if (!FILENAME_RE.test(filename)) {
    errors.push(`Filename "${filename}" must be lowercase, hyphenated (e.g., my-strategy.json)`);
  }

  // Read and parse JSON
  let parsed;
  try {
    const content = await readFile(filepath, 'utf-8');
    parsed = JSON.parse(content);
  } catch (err) {
    errors.push(`Invalid JSON: ${err.message}`);
    printResults(errors, warnings);
    return { errors: errors.length, warnings: warnings.length, id: null };
  }

  // Must be a non-null, non-array object
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    errors.push('Top-level value must be a JSON object');
    printResults(errors, warnings);
    return { errors: errors.length, warnings: warnings.length, id: null };
  }

  // Required fields
  if (typeof parsed.id !== 'string' || !parsed.id) {
    errors.push('Required field "id" is missing or not a non-empty string');
  } else {
    id = parsed.id;
    // Check id matches filename stem
    const stem = basename(filename, extname(filename));
    if (parsed.id !== stem) {
      warnings.push(`id "${parsed.id}" does not match filename stem "${stem}"`);
    }
  }

  if (typeof parsed.name !== 'string' || !parsed.name) {
    errors.push('Required field "name" is missing or not a non-empty string');
  }

  if (typeof parsed.supplement !== 'string') {
    errors.push('Required field "supplement" is missing or not a string');
  }

  // Optional fields with type validation
  if (!('description' in parsed)) {
    warnings.push('Field "description" is missing (will default to empty string on import)');
  } else if (typeof parsed.description !== 'string') {
    errors.push('Field "description" must be a string');
  }

  if (!('category' in parsed)) {
    warnings.push('Field "category" is missing (will default to "general" on import)');
  } else if (!VALID_CATEGORIES.includes(parsed.category)) {
    errors.push(
      `Field "category" is "${parsed.category}", must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  }

  if (!('examples' in parsed)) {
    warnings.push('Field "examples" is missing (will default to empty array on import)');
  } else if (!Array.isArray(parsed.examples)) {
    errors.push('Field "examples" must be an array');
  } else {
    for (let i = 0; i < parsed.examples.length; i++) {
      const ex = parsed.examples[i];
      if (ex === null || typeof ex !== 'object' || Array.isArray(ex)) {
        errors.push(`examples[${i}]: must be an object with "scenario" and "commands" strings`);
        continue;
      }
      if (typeof ex.scenario !== 'string') {
        errors.push(`examples[${i}]: "scenario" must be a string`);
      }
      if (typeof ex.commands !== 'string') {
        errors.push(`examples[${i}]: "commands" must be a string`);
      }
    }
  }

  // Check for unexpected fields
  const knownFields = new Set(['id', 'name', 'description', 'category', 'supplement', 'examples']);
  for (const key of Object.keys(parsed)) {
    if (!knownFields.has(key)) {
      warnings.push(`Unknown field "${key}" (will be ignored on import)`);
    }
  }

  printResults(errors, warnings);
  return { errors: errors.length, warnings: warnings.length, id };
}

function printResults(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) {
    console.log('  ok');
    return;
  }
  for (const msg of errors) {
    console.log(`  FAIL  ${msg}`);
  }
  for (const msg of warnings) {
    console.log(`  WARN  ${msg}`);
  }
}

main();
