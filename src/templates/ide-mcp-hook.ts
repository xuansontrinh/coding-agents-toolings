export const IDE_MCP_HOOK_SCRIPT = `#!/usr/bin/env node

async function readStdin() {
  return await new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.resume();
  });
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const STRONG_CODE_HINT_RE = /\\b(refactor|rename|debug|stack trace|find usages|find references|go to definition|definition|implementation|symbol|class|function|method|module|package|codebase|repository|repo|source code|build|test|compile|lint|typecheck|webstorm|intellij|idea)\\b/i;
const CODE_PATH_RE = /(^|[\\s\`"'(])(?:src\\/|app\\/|lib\\/|packages\\/|modules\\/|tests?\\/|spec\\/|[\\w./-]+\\.(?:ts|tsx|js|jsx|mjs|cjs|java|kt|kts|py|rb|go|rs|c|cc|cpp|h|hpp|cs|php|swift|scala))(?:$|[\\s\`"')])/i;

const CODE_KEYWORDS = [
  'code',
  'source',
  'repo',
  'repository',
  'project',
  'symbol',
  'definition',
  'reference',
  'usages',
  'class',
  'function',
  'method',
  'module',
  'package',
  'build',
  'test',
  'compile',
  'lint',
  'debug',
  'fix',
  'bug',
  'refactor',
  'rename',
  'implement',
  'patch',
  'webstorm',
  'intellij',
  'idea',
  'mcp',
];

function shouldSuggest(prompt) {
  const normalized = prompt.toLowerCase();
  if (!normalized.trim()) {
    return false;
  }

  if (STRONG_CODE_HINT_RE.test(prompt) || CODE_PATH_RE.test(prompt)) {
    return true;
  }

  let hits = 0;
  for (const keyword of CODE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      hits += 1;
      if (hits >= 2) {
        return true;
      }
    }
  }

  return false;
}

function buildAdditionalContext() {
  return [
    'Code-oriented request detected.',
    'Load and follow the repo-local \`ide-mcp\` skill before defaulting to shell-only exploration.',
    'If JetBrains IDE MCP servers such as \`webstorm\` or \`idea\` are available, prefer them for symbol lookup, usages, project-aware navigation, inspections, and refactors.',
    'Do not assume a specific transport or endpoint shape; detect the available MCP aliases and capabilities at runtime.',
    'If no suitable IDE MCP server is connected, fall back to repo tools such as \`rg\`, targeted file reads, and local build/test commands without blocking the task.',
  ].join(' ');
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  if (!isObject(payload)) {
    return;
  }

  if (payload.hook_event_name !== 'UserPromptSubmit') {
    return;
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  if (!shouldSuggest(prompt)) {
    return;
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: buildAdditionalContext(),
    },
  }));
}

main().catch(() => {
  process.exit(0);
});
`;
