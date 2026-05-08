export const IDE_MCP_HOOK_SCRIPT = `#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

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

const JETBRAINS_ALIASES = ['idea', 'webstorm', 'pycharm', 'goland', 'rider', 'phpstorm', 'rubymine', 'rustrover', 'clion', 'datagrip', 'dataspell'];
const STRONG_CODE_HINT_RE = /\\b(refactor|rename|debug|stack trace|find usages|find references|go to definition|definition|implementation|symbol|class|function|method|module|package|codebase|repository|repo|source code|build|test|compile|lint|typecheck|webstorm|intellij|idea|pycharm|goland|rider|phpstorm|rubymine|rustrover|clion|datagrip|dataspell)\\b/i;
const CODE_PATH_RE = /(^|[\\s\`"'(])(?:src\\/|app\\/|lib\\/|packages\\/|modules\\/|tests?\\/|spec\\/|[\\w./-]+\\.(?:ts|tsx|js|jsx|mjs|cjs|java|kt|kts|py|rb|go|rs|c|cc|cpp|h|hpp|cs|php|swift|scala|sql|ipynb))(?:$|[\\s\`"')])/i;

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
  'python',
  'go',
  'golang',
  'dotnet',
  '.net',
  'c#',
  'csharp',
  'php',
  'ruby',
  'rust',
  'sql',
  'webstorm',
  'intellij',
  'idea',
  'pycharm',
  'goland',
  'rider',
  'phpstorm',
  'rubymine',
  'rustrover',
  'clion',
  'datagrip',
  'dataspell',
  'mcp',
];

const ROUTES = [
  {
    aliases: ['idea'],
    patterns: [
      /\\b(kotlin|java|scala|gradle|maven|spring|ktor|jvm|android|intellij(?: idea| platform)?)\\b/i,
      /(?:build\\.gradle(?:\\.kts)?|settings\\.gradle(?:\\.kts)?|pom\\.xml|gradle\\.properties|\\.kt\\b|\\.kts\\b|\\.java\\b|\\.scala\\b)/i,
    ],
    guidance: 'Prompt suggests Kotlin/JVM or IntelliJ-oriented work. Prefer \`idea\` first, and avoid leading with \`webstorm\` for Kotlin, Java, Gradle, or Maven tasks unless project evidence clearly points there.',
  },
  {
    aliases: ['webstorm'],
    patterns: [
      /\\b(typescript|javascript|node(?:\\.js)?|react|next(?:\\.js)?|vue|nuxt|angular|svelte|vite|webpack|tailwind|frontend|front-end|css|html)\\b/i,
      /(?:package\\.json|tsconfig\\.json|vite\\.config|webpack\\.config|next\\.config|nuxt\\.config|\\.ts\\b|\\.tsx\\b|\\.js\\b|\\.jsx\\b|\\.css\\b|\\.scss\\b|\\.sass\\b|\\.html\\b)/i,
    ],
    guidance: 'Prompt suggests JS/TS or frontend work. Prefer \`webstorm\` first for web app navigation, component refactors, and package-level frontend search.',
  },
  {
    aliases: ['pycharm'],
    patterns: [
      /\\b(python|django|flask|fastapi|pytest|poetry|pipenv|jupyter|notebook|pandas|numpy)\\b/i,
      /(?:pyproject\\.toml|requirements(?:-dev)?\\.txt|poetry\\.lock|Pipfile|\\.py\\b|\\.ipynb\\b)/i,
    ],
    guidance: 'Prompt suggests Python or notebook-oriented work. Prefer \`pycharm\` first for Python modules, tests, frameworks, and project structure.',
  },
  {
    aliases: ['goland'],
    patterns: [
      /\\b(go|golang|gin|fiber|cobra)\\b/i,
      /(?:go\\.mod|go\\.sum|\\.go\\b)/i,
    ],
    guidance: 'Prompt suggests Go work. Prefer \`goland\` first for Go packages, interfaces, modules, and refactors.',
  },
  {
    aliases: ['rider'],
    patterns: [
      /(?:\\bcsharp\\b|c#|\\bdotnet\\b|asp\\.net|\\bnuget\\b|\\bxunit\\b|\\bnunit\\b|\\bblazor\\b)/i,
      /(?:\\.cs\\b|\\.csproj\\b|\\.sln\\b|Directory\\.Build\\.props)/i,
    ],
    guidance: 'Prompt suggests C# or .NET work. Prefer \`rider\` first for solution-aware navigation, usages, and refactors.',
  },
  {
    aliases: ['phpstorm'],
    patterns: [
      /\\b(php|laravel|symfony|composer)\\b/i,
      /(?:composer\\.json|composer\\.lock|\\.php\\b)/i,
    ],
    guidance: 'Prompt suggests PHP work. Prefer \`phpstorm\` first for framework-aware search and refactors.',
  },
  {
    aliases: ['rubymine'],
    patterns: [
      /\\b(ruby|rails|rspec|bundler|sidekiq)\\b/i,
      /(?:Gemfile|Gemfile\\.lock|\\.rb\\b)/i,
    ],
    guidance: 'Prompt suggests Ruby work. Prefer \`rubymine\` first for Rails apps, Ruby classes, and test navigation.',
  },
  {
    aliases: ['rustrover'],
    patterns: [
      /\\b(rust|cargo|tokio|actix)\\b/i,
      /(?:Cargo\\.toml|Cargo\\.lock|\\.rs\\b)/i,
    ],
    guidance: 'Prompt suggests Rust work. Prefer \`rustrover\` first for crate-aware navigation and Cargo projects.',
  },
  {
    aliases: ['clion'],
    patterns: [
      /\\b(c\\+\\+|cpp|c language|cmake|makefile|native code)\\b/i,
      /(?:CMakeLists\\.txt|\\.c\\b|\\.cc\\b|\\.cpp\\b|\\.h\\b|\\.hpp\\b)/i,
    ],
    guidance: 'Prompt suggests C or C++ work. Prefer \`clion\` first for native code and CMake projects.',
  },
  {
    aliases: ['datagrip'],
    patterns: [
      /\\b(sql|database|schema|migration|postgres|mysql|sqlite|jdbc)\\b/i,
      /(?:\\.sql\\b|schema\\.sql|flyway|liquibase)/i,
    ],
    guidance: 'Prompt suggests database or SQL work. Prefer \`datagrip\` first when the task is primarily schema, query, or connection focused.',
  },
  {
    aliases: ['dataspell'],
    patterns: [
      /\\b(data science|machine learning|ml|notebook|jupyter|pandas|numpy|scikit|sklearn)\\b/i,
      /(?:\\.ipynb\\b)/i,
    ],
    guidance: 'Prompt suggests notebook-heavy or data-science work. Prefer \`dataspell\` first when that IDE alias is available.',
  },
];

function shouldSuggest(prompt) {
  const normalized = prompt.toLowerCase();
  if (!normalized.trim()) {
    return false;
  }

  if (
    STRONG_CODE_HINT_RE.test(prompt) ||
    CODE_PATH_RE.test(prompt) ||
    ROUTES.some((route) => route.patterns.some((pattern) => pattern.test(prompt)))
  ) {
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

function inferRoute(prompt) {
  const matches = ROUTES.filter((route) => {
    return route.patterns.some((pattern) => pattern.test(prompt));
  });

  if (matches.length === 1) {
    return {
      aliases: [...matches[0].aliases],
      guidance: matches[0].guidance,
    };
  }

  if (matches.length > 1) {
    const aliases = Array.from(new Set(matches.flatMap((route) => route.aliases)))
      .map((alias) => '\`' + alias + '\`')
      .join(', ');

    return {
      aliases: Array.from(new Set(matches.flatMap((route) => route.aliases))),
      guidance: 'Prompt spans multiple stacks or JetBrains IDE specializations. Prefer the server whose alias best matches the referenced files or module. Likely candidates: ' + aliases + '. Use file extensions, build files, and project ownership to choose, then switch once if the first choice is clearly wrong.',
    };
  }

  return {
    aliases: [...JETBRAINS_ALIASES],
    guidance: 'Choose among JetBrains IDE aliases such as \`idea\`, \`webstorm\`, \`pycharm\`, \`goland\`, \`rider\`, \`phpstorm\`, \`rubymine\`, \`rustrover\`, \`clion\`, \`datagrip\`, or \`dataspell\` by language, framework, file extensions, build files, and project ownership rather than alias order.',
  };
}

function buildAdditionalContext(prompt) {
  const route = inferRoute(prompt);
  return [
    'Code-oriented request detected.',
    'Load and follow the repo-local \`ide-mcp\` skill before defaulting to shell-only exploration.',
    route.guidance,
    'If JetBrains IDE MCP servers such as \`idea\`, \`webstorm\`, \`pycharm\`, \`goland\`, \`rider\`, \`phpstorm\`, \`rubymine\`, \`rustrover\`, \`clion\`, \`datagrip\`, or \`dataspell\` are available, prefer the best-matching one for symbol lookup, usages, project-aware navigation, inspections, and refactors.',
    'Do not assume a specific transport or endpoint shape; detect the available MCP aliases and capabilities at runtime.',
    'If the exact specialized IDE alias is not available, use the closest JetBrains IDE that appears to own the target project or module.',
    'After the first successful JetBrains MCP lookup, prefer a meaningful IDE-native follow-up such as usages, implementations, or related framework navigation before broad text search.',
    'If the first server choice cannot resolve the symbol or clearly does not match the stack, switch once before falling back.',
    'If no suitable IDE MCP server is connected, fall back to repo tools such as \`rg\`, targeted file reads, and local build/test commands without blocking the task.',
  ].join(' ');
}

function getStateFile(payload) {
  const keyParts = [
    typeof payload.cwd === 'string' ? payload.cwd : '',
    typeof payload.session_id === 'string' ? payload.session_id : '',
    typeof payload.turn_id === 'string' ? payload.turn_id : '',
  ].filter(Boolean);

  if (keyParts.length === 0) {
    return null;
  }

  const safeKey = keyParts.join('__').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-180);
  if (!safeKey) {
    return null;
  }

  return join(os.tmpdir(), 'coding-agents-toolings-ide-mcp', safeKey + '.json');
}

function loadState(payload) {
  const stateFile = getStateFile(payload);
  if (!stateFile) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return null;
  }
}

function saveState(payload, state) {
  const stateFile = getStateFile(payload);
  if (!stateFile) {
    return;
  }

  mkdirSync(join(os.tmpdir(), 'coding-agents-toolings-ide-mcp'), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state), 'utf8');
}

function getCommand(payload) {
  if (!isObject(payload.tool_input)) {
    return '';
  }

  return typeof payload.tool_input.command === 'string' ? payload.tool_input.command.trim() : '';
}

function isJetBrainsMcpToolName(toolName) {
  if (typeof toolName !== 'string' || !toolName.startsWith('mcp__')) {
    return false;
  }

  return JETBRAINS_ALIASES.some((alias) => toolName.includes('__' + alias + '__'));
}

function isBroadSearchCommand(command) {
  if (!command) {
    return false;
  }

  const normalized = command.trim();
  if (/^(cat|sed|nl|head|tail|awk|less)\\b/.test(normalized)) {
    return false;
  }

  if (!/^(rg|grep|git grep|fd|find)\\b/.test(normalized)) {
    return false;
  }

  if (/^rg\\s+--files\\b/.test(normalized)) {
    return false;
  }

  if (/(^|[\\s"'\`])(src\\/|app\\/|lib\\/|packages\\/|modules\\/|tests?\\/|spec\\/|[\\w./-]+\\.(?:kt|kts|java|scala|ts|tsx|js|jsx|py|rb|go|rs|c|cc|cpp|h|hpp|cs|php|sql|xml|yaml|yml|json))($|[\\s"'\`])/.test(normalized)) {
    return false;
  }

  return true;
}

function preferredAliasText(state) {
  const aliases = Array.isArray(state?.preferredAliases) && state.preferredAliases.length > 0
    ? state.preferredAliases
    : JETBRAINS_ALIASES;

  return aliases.map((alias) => '\`' + alias + '\`').join(', ');
}

function buildBashBlockReason(state) {
  if ((state?.jetbrainsMcpCalls ?? 0) === 0) {
    return 'This turn is using \`ide-mcp\`. Before broad shell search, start with the best-matching JetBrains MCP server for symbol lookup or project-aware navigation. Preferred aliases for this turn: ' + preferredAliasText(state) + '.';
  }

  return 'JetBrains MCP has only been used once on this turn. Before broad shell search, take a meaningful IDE-native follow-up such as usages, implementations, related symbol lookup, or framework wiring in ' + preferredAliasText(state) + '.';
}

function handleUserPromptSubmit(payload) {
  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  if (!shouldSuggest(prompt)) {
    return null;
  }

  const route = inferRoute(prompt);
  saveState(payload, {
    sessionId: payload.session_id ?? null,
    turnId: payload.turn_id ?? null,
    codeOriented: true,
    preferredAliases: route.aliases,
    jetbrainsMcpCalls: 0,
    bashBlocks: 0,
  });

  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: buildAdditionalContext(prompt),
    },
  };
}

function handlePreToolUse(payload) {
  if (payload.tool_name !== 'Bash') {
    return null;
  }

  const state = loadState(payload);
  if (!state?.codeOriented) {
    return null;
  }

  const command = getCommand(payload);
  if (!isBroadSearchCommand(command)) {
    return null;
  }

  if ((state.jetbrainsMcpCalls ?? 0) >= 2 || (state.bashBlocks ?? 0) >= 2) {
    return null;
  }

  state.bashBlocks = (state.bashBlocks ?? 0) + 1;
  saveState(payload, state);

  const reason = buildBashBlockReason(state);
  return {
    systemMessage: 'ide-mcp guardrail: prefer JetBrains IDE navigation before broad shell search.',
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
}

function handlePostToolUse(payload) {
  const state = loadState(payload);
  if (!state?.codeOriented) {
    return null;
  }

  if (!isJetBrainsMcpToolName(payload.tool_name)) {
    return null;
  }

  state.jetbrainsMcpCalls = (state.jetbrainsMcpCalls ?? 0) + 1;
  saveState(payload, state);

  if (state.jetbrainsMcpCalls !== 1) {
    return null;
  }

  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: 'JetBrains MCP returned project-aware context for this turn. Before broad text search, prefer a meaningful IDE-native follow-up such as usages, implementations, related symbols, or framework wiring.',
    },
  };
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

  let result = null;
  switch (payload.hook_event_name) {
    case 'UserPromptSubmit':
      result = handleUserPromptSubmit(payload);
      break;
    case 'PreToolUse':
      result = handlePreToolUse(payload);
      break;
    case 'PostToolUse':
      result = handlePostToolUse(payload);
      break;
    default:
      result = null;
  }

  if (!result) {
    return;
  }

  process.stdout.write(JSON.stringify(result));
}

main().catch(() => {
  process.exit(0);
});
`;
