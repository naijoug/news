import Ajv2020 from 'ajv/dist/2020.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(repoRoot, 'schemas', 'edition.schema.json');
const examplePath = path.join(repoRoot, 'schemas', 'edition.example.json');
const sectionsPath = path.join(repoRoot, 'schemas', 'sections.json');

const FILE_RE = /^(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})-(morning|evening)\.json$/;

const FIELD_HINTS = {
  科技与AI: ' — use the key "tech"',
  国际与政治: ' — use the key "world"',
  商业与市场: ' — use the key "business"',
  中国: ' — use the key "china"',
  早报: ' — use "morning"',
  晚报: ' — use "evening"',
};

export function loadSchema() {
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

export function sectionIds() {
  return loadSchema().properties.sections.required;
}

function hintFor(name) {
  return FIELD_HINTS[name] ?? '';
}

function formatAjvError(error) {
  const loc = error.instancePath || '(root)';
  switch (error.keyword) {
    case 'additionalProperties':
      return `${loc} has unknown field "${error.params.additionalProperty}"${hintFor(error.params.additionalProperty)}`;
    case 'required':
      return `${loc} is missing "${error.params.missingProperty}"`;
    case 'enum': {
      const allowed = error.params.allowedValues.join(', ');
      const editionHint =
        error.instancePath === '/edition' ? ' (morning is 早报, evening is 晚报)' : '';
      return `${loc} must be one of: ${allowed}${editionHint}`;
    }
    case 'type':
      return `${loc} must be ${error.params.type}`;
    case 'minLength':
      return `${loc} must be at least ${error.params.limit} characters`;
    case 'maxLength':
      return `${loc} must be at most ${error.params.limit} characters`;
    case 'minItems':
      return `${loc} must contain at least ${error.params.limit} item(s)`;
    case 'maxItems':
      return `${loc} must contain at most ${error.params.limit} items`;
    case 'pattern':
      if (String(error.schema).includes('https://') || String(error.message).includes('https://')) {
        return `${loc} must be an https URL`;
      }
      return `${loc} ${error.message}`;
    default:
      return `${loc} ${error.message}`;
  }
}

export function isRealDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

function filenameErrors(relPath, data) {
  const errors = [];
  const match = FILE_RE.exec(relPath);
  if (!match) {
    errors.push(
      'path must be content/YYYY/MM/YYYY-MM-DD-morning.json or content/YYYY/MM/YYYY-MM-DD-evening.json ' +
        `(month is two digits; got content/${relPath})`,
    );
    return errors;
  }
  const [, year, month, date, edition] = match;
  if (year !== date.slice(0, 4) || month !== date.slice(5, 7)) {
    errors.push(`directory ${year}/${month}/ does not match the filename date ${date}`);
  }
  if (data && typeof data.date === 'string' && data.date !== date) {
    errors.push(`filename date is ${date} but "date" is ${JSON.stringify(data.date)}`);
  }
  if (data && (data.edition === 'morning' || data.edition === 'evening') && data.edition !== edition) {
    errors.push(
      `filename edition is ${edition} but "edition" is ${JSON.stringify(data.edition)} (morning is 早报, evening is 晚报)`,
    );
  }
  return errors;
}

function contentErrors(data, ids) {
  const errors = [];
  if (!data || typeof data !== 'object') return errors;
  if (typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && !isRealDate(data.date)) {
    errors.push(`date ${data.date} is not a real calendar date`);
  }
  const sections = data.sections;
  if (!sections || typeof sections !== 'object') return errors;
  let stories = 0;
  let sawLists = true;
  for (const id of ids) {
    const list = sections[id];
    if (!Array.isArray(list)) {
      sawLists = false;
      continue;
    }
    stories += list.length;
    list.forEach((story, index) => {
      if (!story || typeof story !== 'object') return;
      const loc = `/sections/${id}/${index}`;
      if (typeof story.title === 'string' && story.title.trim().length < 2) {
        errors.push(`${loc}/title must not be blank`);
      }
      if (typeof story.summary === 'string' && story.summary.trim().length < 8) {
        errors.push(`${loc}/summary must not be blank`);
      }
      if (!Array.isArray(story.sources)) return;
      story.sources.forEach((source, sourceIndex) => {
        if (!source || typeof source !== 'object' || typeof source.url !== 'string') return;
        if (!/^https:\/\/\S+$/.test(source.url)) return;
        const sourceLoc = `${loc}/sources/${sourceIndex}/url`;
        try {
          const url = new URL(source.url);
          if (url.protocol !== 'https:' || !url.hostname.includes('.')) {
            errors.push(`${sourceLoc} must be an https URL with a host name`);
          }
        } catch {
          errors.push(`${sourceLoc} must be an https URL with a host name`);
        }
      });
    });
  }
  if (sawLists && ids.length > 0 && stories === 0) {
    errors.push('edition has no stories; add at least one across the four sections');
  }
  return errors;
}

function compile(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(schema);
}

export function validateDocument(raw, { relPath, validate, ids }) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [`invalid JSON: ${message}`];
  }
  const errors = [];
  if (!validate(data) && validate.errors) {
    errors.push(...validate.errors.map(formatAjvError));
  }
  if (relPath) errors.push(...filenameErrors(relPath, data));
  errors.push(...contentErrors(data, ids));
  return errors;
}

function readUtf8(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { error: 'file starts with a UTF-8 BOM; save it as UTF-8 without a BOM' };
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { error: 'file is not valid UTF-8' };
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}

export function validateContentTree(contentDir, { schema = loadSchema() } = {}) {
  const validate = compile(schema);
  const ids = schema.properties.sections.required;
  const errors = [];
  const files = listFiles(contentDir);
  const seen = new Map();
  if (files.length === 0) {
    errors.push({
      file: path.relative(repoRoot, contentDir) || 'content',
      messages: ['no edition files found; add content/YYYY/MM/YYYY-MM-DD-morning.json'],
    });
  }
  for (const file of files) {
    const relPath = path.relative(contentDir, file).split(path.sep).join('/');
    const display = `content/${relPath}`;
    const raw = readUtf8(file);
    if (raw.error) {
      errors.push({ file: display, messages: [raw.error] });
      continue;
    }
    const messages = validateDocument(raw.text, { relPath, validate, ids });
    const match = FILE_RE.exec(relPath);
    if (match && messages.length === 0) {
      const key = `${match[3]}-${match[4]}`;
      if (seen.has(key)) {
        messages.push(`duplicates ${seen.get(key)}`);
      }
      seen.set(key, display);
    }
    if (messages.length > 0) errors.push({ file: display, messages });
  }
  return { ok: errors.length === 0, files: files.length, errors };
}

export function validateExampleFile(file = examplePath, { schema = loadSchema() } = {}) {
  const validate = compile(schema);
  const ids = schema.properties.sections.required;
  const raw = readUtf8(file);
  const display = path.relative(repoRoot, file).split(path.sep).join('/');
  if (raw.error) return { ok: false, errors: [{ file: display, messages: [raw.error] }] };
  const messages = validateDocument(raw.text, { validate, ids });
  return { ok: messages.length === 0, errors: messages.length ? [{ file: display, messages }] : [] };
}

export function sectionsMatchSchema() {
  const sections = JSON.parse(fs.readFileSync(sectionsPath, 'utf8'));
  const ids = sections.map((section) => section.id);
  const required = loadSchema().properties.sections.required;
  return { ids, required, ok: JSON.stringify(ids) === JSON.stringify(required) };
}

export function report(result) {
  if (result.ok) {
    const count = result.files ?? 0;
    console.log(count ? `Validated ${count} edition file(s).` : 'Validated.');
    return;
  }
  console.error('Edition content is invalid.\n');
  for (const item of result.errors) {
    console.error(item.file);
    for (const message of item.messages) console.error(`  - ${message}`);
    console.error('');
  }
  console.error('See README.md (“Authoring spec”) and schemas/edition.schema.json.');
}

function isMain() {
  const invoked = process.argv[1];
  if (!invoked) return false;
  return path.resolve(invoked) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  const content = validateContentTree(path.join(repoRoot, 'content'));
  const example = validateExampleFile();
  const sections = sectionsMatchSchema();
  const errors = [...content.errors, ...example.errors];
  if (!sections.ok) {
    errors.push({
      file: 'schemas/sections.json',
      messages: [
        `section ids [${sections.ids.join(', ')}] do not match schema required [${sections.required.join(', ')}]`,
      ],
    });
  }
  const ok = errors.length === 0;
  report({ ok, files: content.files, errors });
  if (!example.ok || !sections.ok) process.exitCode = 1;
  if (!content.ok) process.exitCode = 1;
}
