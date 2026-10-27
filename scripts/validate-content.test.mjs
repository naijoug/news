import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  isRealDate,
  sectionsMatchSchema,
  validateContentTree,
  validateExampleFile,
} from './validate-content.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function story(overrides = {}) {
  return {
    title: '示例标题',
    summary: '这是一段足够长的摘要。',
    sources: [{ name: '示例来源', url: 'https://example.com/a' }],
    ...overrides,
  };
}

function edition(overrides = {}) {
  return {
    date: '2026-10-27',
    edition: 'morning',
    sections: {
      tech: [story()],
      world: [],
      business: [],
      china: [],
    },
    ...overrides,
  };
}

function withTree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhaoxi-'));
  for (const [rel, data] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof data === 'string' ? data : `${JSON.stringify(data)}\n`);
  }
  try {
    return validateContentTree(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function messages(result) {
  return result.errors.map((item) => `${item.file}: ${item.messages.join(' | ')}`).join('\n');
}

test('repository editions and the documented example are valid', () => {
  const content = validateContentTree(path.join(repoRoot, 'content'));
  assert.equal(content.ok, true, messages(content));
  assert.ok(content.files >= 1);
  const example = validateExampleFile();
  assert.equal(example.ok, true, messages(example));
  assert.equal(sectionsMatchSchema().ok, true);
});

test('a matching morning file passes', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition(),
  });
  assert.equal(result.ok, true, messages(result));
});

test('invalid JSON names the file', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': '{',
  });
  assert.equal(result.ok, false);
  assert.match(messages(result), /invalid JSON/);
  assert.match(messages(result), /content\/2026\/10\/2026-10-27-morning\.json/);
});

test('chinese section keys are rejected with the id to use', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({
      sections: {
        tech: [story()],
        world: [],
        business: [],
        china: [],
        科技与AI: [],
      },
    }),
  });
  assert.match(messages(result), /unknown field "科技与AI"/);
  assert.match(messages(result), /use the key "tech"/);
});

test('a missing section is named', () => {
  const data = edition();
  delete data.sections.china;
  const result = withTree({ '2026/10/2026-10-27-morning.json': data });
  assert.match(messages(result), /missing "china"/);
});

test('http sources are rejected', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({
      sections: {
        tech: [story({ sources: [{ name: '示例来源', url: 'http://example.com/a' }] })],
        world: [],
        business: [],
        china: [],
      },
    }),
  });
  assert.match(messages(result), /\/sections\/tech\/0\/sources\/0\/url must be an https URL/);
});

test('filename date must match the date field', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({ date: '2026-10-28' }),
  });
  assert.match(messages(result), /filename date is 2026-10-27 but "date" is "2026-10-28"/);
});

test('filename edition must match the edition field', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({ edition: 'evening' }),
  });
  assert.match(messages(result), /filename edition is morning but "edition" is "evening"/);
  assert.match(messages(result), /morning is 早报/);
});

test('directory month must match the filename', () => {
  const result = withTree({
    '2026/11/2026-10-27-evening.json': edition({ edition: 'evening' }),
  });
  assert.match(messages(result), /directory 2026\/11\/ does not match the filename date 2026-10-27/);
});

test('impossible calendar dates fail', () => {
  assert.equal(isRealDate('2026-02-31'), false);
  const result = withTree({
    '2026/02/2026-02-31-morning.json': edition({ date: '2026-02-31' }),
  });
  assert.match(messages(result), /2026-02-31 is not a real calendar date/);
});

test('extra story fields fail', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({
      sections: {
        tech: [{ ...story(), note: 'nope' }],
        world: [],
        business: [],
        china: [],
      },
    }),
  });
  assert.match(messages(result), /unknown field "note"/);
});

test('an edition with no stories fails', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({
      sections: { tech: [], world: [], business: [], china: [] },
    }),
  });
  assert.match(messages(result), /edition has no stories/);
});

test('unexpected files fail', () => {
  const result = withTree({
    'notes.json': edition(),
  });
  assert.match(messages(result), /path must be content\/YYYY\/MM/);
});

test('a UTF-8 BOM fails', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': `\uFEFF${JSON.stringify(edition())}`,
  });
  assert.match(messages(result), /BOM/);
});

test('早报 is not a valid edition value', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': edition({ edition: '早报' }),
  });
  assert.match(messages(result), /must be one of: morning, evening/);
});
