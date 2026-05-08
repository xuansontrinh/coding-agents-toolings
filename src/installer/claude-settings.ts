import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { ensureDir, existsSync, writeIfChanged } from '../utils/fs.js';
import { log } from '../utils/log.js';
import { IDE_MCP_HOOK_SCRIPT } from '../templates/ide-mcp-hook.js';

export interface InstallClaudeHooksOptions {
  root: string;
  dryRun: boolean;
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

const SETTINGS_RELATIVE_PATH = '.claude/settings.json';
const HOOK_SCRIPT_RELATIVE_PATH = '.claude/hooks/ide-mcp-context.mjs';
const HOOK_COMMAND = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/ide-mcp-context.mjs"';
const HOOK_PATH_HINT = '.claude/hooks/ide-mcp-context.mjs';

export function installClaudeHooks(opts: InstallClaudeHooksOptions): boolean {
  const settingsPath = join(opts.root, SETTINGS_RELATIVE_PATH);
  const hookScriptPath = join(opts.root, HOOK_SCRIPT_RELATIVE_PATH);

  const currentSettings = existsSync(settingsPath) ? readFileSync(settingsPath, 'utf-8') : '';
  const desiredSettings = formatJson(mergeClaudeHookSettings(parseJsonObject(currentSettings, settingsPath)));
  const currentHookScript = existsSync(hookScriptPath) ? readFileSync(hookScriptPath, 'utf-8') : '';
  const hookScriptChanged = currentHookScript !== IDE_MCP_HOOK_SCRIPT;
  const settingsChanged = currentSettings !== desiredSettings;

  if (opts.dryRun) {
    logDryRun(SETTINGS_RELATIVE_PATH, settingsChanged);
    logDryRun(HOOK_SCRIPT_RELATIVE_PATH, hookScriptChanged);
    return settingsChanged || hookScriptChanged;
  }

  ensureDir(join(opts.root, '.claude', 'hooks'));

  const settingsResult = writeIfChanged(settingsPath, desiredSettings);
  const hookScriptResult = writeIfChanged(hookScriptPath, IDE_MCP_HOOK_SCRIPT);

  logWriteResult(SETTINGS_RELATIVE_PATH, settingsResult);
  logWriteResult(HOOK_SCRIPT_RELATIVE_PATH, hookScriptResult);

  return settingsResult !== 'unchanged' || hookScriptResult !== 'unchanged';
}

function parseJsonObject(content: string, filePath: string): JsonObject {
  if (!content.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Could not parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!isJsonObject(parsed)) {
    throw new Error(`Could not merge ${filePath}: expected a JSON object at the top level.`);
  }

  return parsed;
}

function mergeClaudeHookSettings(settings: JsonObject): JsonObject {
  const next = JSON.parse(JSON.stringify(settings)) as JsonObject;
  const hooksValue = next['hooks'];

  if (hooksValue !== undefined && !isJsonObject(hooksValue)) {
    throw new Error('Could not merge .claude/settings.json: expected "hooks" to be a JSON object.');
  }

  const hooks = hooksValue ? {...hooksValue} as JsonObject : {};
  const userPromptValue = hooks['UserPromptSubmit'];

  if (userPromptValue !== undefined && !Array.isArray(userPromptValue)) {
    throw new Error('Could not merge .claude/settings.json: expected hooks.UserPromptSubmit to be an array.');
  }

  const groups = Array.isArray(userPromptValue) ? [...userPromptValue] : [];
  const desiredGroup = {
    hooks: [
      {
        type: 'command',
        command: HOOK_COMMAND,
      },
    ],
  } satisfies JsonObject;

  let found = false;
  const nextGroups = groups.map((group) => {
    if (!isJsonObject(group)) {
      return group;
    }

    const groupHooks = group['hooks'];
    if (!Array.isArray(groupHooks)) {
      return group;
    }

    const containsManagedHook = groupHooks.some((hook) => {
      return isJsonObject(hook) && typeof hook['command'] === 'string' && hook['command'].includes(HOOK_PATH_HINT);
    });

    if (!containsManagedHook) {
      return group;
    }

    found = true;

    if (groupHooks.length === 1) {
      return desiredGroup;
    }

    return group;
  });

  if (!found) {
    nextGroups.push(desiredGroup);
  }

  hooks['UserPromptSubmit'] = nextGroups;
  next['hooks'] = hooks;
  return next;
}

function formatJson(value: JsonObject): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function logDryRun(relativePath: string, changed: boolean): void {
  if (changed) {
    log.dim(`  Would write ${relativePath}`);
    return;
  }

  log.dim(`  ${relativePath} unchanged`);
}

function logWriteResult(relativePath: string, result: 'created' | 'updated' | 'unchanged'): void {
  switch (result) {
    case 'created':
      log.success(`Created ${relativePath}`);
      break;
    case 'updated':
      log.success(`Updated ${relativePath}`);
      break;
    case 'unchanged':
      log.dim(`  ${relativePath} unchanged`);
      break;
  }
}
