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
    id: 'sample-story',
    originalLang: 'zh',
    title: { zh: '示例标题' },
    summary: { zh: '这是一段足够长的摘要。' },
    sources: [{ name: '示例来源', url: 'https://example.com/a' }],
    ...overrides,
  };
}

function emptyPart(tech = []) {
  return { tech, world: [], business: [], china: [] };
}

function day(overrides = {}) {
  return {
    date: '2026-10-27',
    am: emptyPart([story()]),
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

test('repository days and the documented example are valid', () => {
  const content = validateContentTree(path.join(repoRoot, 'content'));
  assert.equal(content.ok, true, messages(content));
  assert.ok(content.files >= 1);
  const example = validateExampleFile();
  assert.equal(example.ok, true, messages(example));
  assert.equal(sectionsMatchSchema().ok, true);
});

test('a matching day file passes', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day(),
  });
  assert.equal(result.ok, true, messages(result));
});

test('afternoon stories live in pm on the same file', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      pm: emptyPart([
        story({
          id: 'later-note',
          originalLang: 'en',
          title: { en: 'Later note', zh: '稍后的笔记' },
          summary: {
            en: 'Afternoon placeholder with both languages present.',
            zh: '下午的占位条目，中英都有。',
          },
        }),
      ]),
    }),
  });
  assert.equal(result.ok, true, messages(result));
});

test('invalid JSON names the file', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': '{',
  });
  assert.equal(result.ok, false);
  assert.match(messages(result), /invalid JSON/);
  assert.match(messages(result), /content\/2026\/10\/2026-10-27\.json/);
});

test('chinese section keys are rejected with the id to use', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: { ...emptyPart([story()]), 科技与AI: [] },
    }),
  });
  assert.match(messages(result), /unknown field "科技与AI"/);
  assert.match(messages(result), /use the key "tech"/);
});

test('a missing section is named', () => {
  const data = day();
  delete data.am.china;
  const result = withTree({ '2026/10/2026-10-27.json': data });
  assert.match(messages(result), /missing "china"/);
});

test('http sources are rejected', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: emptyPart([story({ sources: [{ name: '示例来源', url: 'http://example.com/a' }] })]),
    }),
  });
  assert.match(messages(result), /\/am\/tech\/0\/sources\/0\/url must be an https URL/);
});

test('filename date must match the date field', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({ date: '2026-10-28' }),
  });
  assert.match(messages(result), /filename date is 2026-10-27 but "date" is "2026-10-28"/);
});

test('old morning and evening filenames are rejected', () => {
  const result = withTree({
    '2026/10/2026-10-27-morning.json': day(),
  });
  assert.match(messages(result), /old morning\/evening split/);
  assert.match(messages(result), /"pm"/);
});

test('edition and sections fields point at am and pm', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      edition: 'morning',
      sections: emptyPart(),
    }),
  });
  assert.match(messages(result), /unknown field "edition"/);
  assert.match(messages(result), /"am"/);
  assert.match(messages(result), /unknown field "sections"/);
  assert.match(messages(result), /"pm"/);
});

test('directory month must match the filename', () => {
  const result = withTree({
    '2026/11/2026-10-27.json': day(),
  });
  assert.match(messages(result), /directory 2026\/11\/ does not match the filename date 2026-10-27/);
});

test('impossible calendar dates fail', () => {
  assert.equal(isRealDate('2026-02-31'), false);
  const result = withTree({
    '2026/02/2026-02-31.json': day({ date: '2026-02-31' }),
  });
  assert.match(messages(result), /2026-02-31 is not a real calendar date/);
});

test('extra story fields fail', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: emptyPart([{ ...story(), note: 'nope' }]),
    }),
  });
  assert.match(messages(result), /unknown field "note"/);
});

test('a day with no stories fails', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({ am: emptyPart() }),
  });
  assert.match(messages(result), /day has no stories/);
});

test('an empty pm block fails', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({ pm: emptyPart() }),
  });
  assert.match(messages(result), /omit "pm"/);
});

test('duplicate story ids fail', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: {
        tech: [story({ id: 'same-id' })],
        world: [story({ id: 'same-id' })],
        business: [],
        china: [],
      },
    }),
  });
  assert.match(messages(result), /duplicates am\/tech/);
});

test('original language text is required', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: emptyPart([
        story({
          originalLang: 'en',
          title: { zh: '示例标题' },
          summary: { zh: '这是一段足够长的摘要。' },
        }),
      ]),
    }),
  });
  assert.match(messages(result), /title is missing "en"/);
});

test('a translation title needs a summary in the same language', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': day({
      am: emptyPart([
        story({
          title: { zh: '示例标题', en: 'Sample title' },
          summary: { zh: '这是一段足够长的摘要。' },
        }),
      ]),
    }),
  });
  assert.match(messages(result), /title\.en without summary\.en/);
});

test('unexpected files fail', () => {
  const result = withTree({
    'notes.json': day(),
  });
  assert.match(messages(result), /path must be content\/YYYY\/MM/);
});

test('a UTF-8 BOM fails', () => {
  const result = withTree({
    '2026/10/2026-10-27.json': `\uFEFF${JSON.stringify(day())}`,
  });
  assert.match(messages(result), /BOM/);
});
