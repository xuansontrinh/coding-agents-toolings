import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { ensureDir, existsSync, writeIfChanged } from '../utils/fs.js';
import { log } from '../utils/log.js';
import { IDE_MCP_HOOK_SCRIPT } from '../templates/ide-mcp-hook.js';

export interface InstallCodexHooksOptions {
  root: string;
  dryRun: boolean;
}

const CONFIG_RELATIVE_PATH = '.codex/config.toml';
const HOOK_SCRIPT_RELATIVE_PATH = '.codex/hooks/ide-mcp-context.mjs';
const MANAGED_BLOCK_START = '# BEGIN coding-agents-toolings ide-mcp';
const MANAGED_BLOCK_END = '# END coding-agents-toolings ide-mcp';

const MANAGED_HOOK_BLOCK = [
  MANAGED_BLOCK_START,
  '[[hooks.UserPromptSubmit]]',
  '[[hooks.UserPromptSubmit.hooks]]',
  'type = "command"',
  `command = 'node "$(git rev-parse --show-toplevel)/${HOOK_SCRIPT_RELATIVE_PATH}"'`,
  'statusMessage = "Loading IDE MCP context"',
  '[[hooks.PreToolUse]]',
  'matcher = "^Bash$"',
  '[[hooks.PreToolUse.hooks]]',
  'type = "command"',
  `command = 'node "$(git rev-parse --show-toplevel)/${HOOK_SCRIPT_RELATIVE_PATH}"'`,
  'statusMessage = "Checking IDE MCP guardrail"',
  '[[hooks.PostToolUse]]',
  'matcher = "^mcp__.*$"',
  '[[hooks.PostToolUse.hooks]]',
  'type = "command"',
  `command = 'node "$(git rev-parse --show-toplevel)/${HOOK_SCRIPT_RELATIVE_PATH}"'`,
  'statusMessage = "Reinforcing IDE MCP navigation"',
  MANAGED_BLOCK_END,
].join('\n');

export function installCodexHooks(opts: InstallCodexHooksOptions): boolean {
  const configPath = join(opts.root, CONFIG_RELATIVE_PATH);
  const hookScriptPath = join(opts.root, HOOK_SCRIPT_RELATIVE_PATH);

  const currentConfig = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : '';
  const desiredConfig = upsertManagedHookBlock(ensureCodexHooksFeature(currentConfig));
  const currentHookScript = existsSync(hookScriptPath) ? readFileSync(hookScriptPath, 'utf-8') : '';
  const hookScriptChanged = currentHookScript !== IDE_MCP_HOOK_SCRIPT;
  const configChanged = currentConfig !== desiredConfig;

  if (opts.dryRun) {
    logDryRun(CONFIG_RELATIVE_PATH, configChanged);
    logDryRun(HOOK_SCRIPT_RELATIVE_PATH, hookScriptChanged);
    return configChanged || hookScriptChanged;
  }

  ensureDir(join(opts.root, '.codex', 'hooks'));

  const configResult = writeIfChanged(configPath, desiredConfig);
  const hookScriptResult = writeIfChanged(hookScriptPath, IDE_MCP_HOOK_SCRIPT);

  logWriteResult(CONFIG_RELATIVE_PATH, configResult);
  logWriteResult(HOOK_SCRIPT_RELATIVE_PATH, hookScriptResult);

  return configResult !== 'unchanged' || hookScriptResult !== 'unchanged';
}

function ensureCodexHooksFeature(content: string): string {
  const lines = normalizeNewlines(content).split('\n');
  if (lines.length === 1 && lines[0] === '') {
    return '[features]\ncodex_hooks = true\n';
  }

  const featuresIndex = lines.findIndex((line) => line.trim() === '[features]');

  if (featuresIndex === -1) {
    const base = normalizeNewlines(content).trimEnd();
    return `${base}\n\n[features]\ncodex_hooks = true\n`;
  }

  let sectionEnd = lines.length;
  for (let index = featuresIndex + 1; index < lines.length; index += 1) {
    if (/^\s*\[/.test(lines[index])) {
      sectionEnd = index;
      break;
    }
  }

  for (let index = featuresIndex + 1; index < sectionEnd; index += 1) {
    if (/^\s*codex_hooks\s*=/.test(lines[index])) {
      lines[index] = 'codex_hooks = true';
      return `${lines.join('\n').trimEnd()}\n`;
    }
  }

  lines.splice(featuresIndex + 1, 0, 'codex_hooks = true');
  return `${lines.join('\n').trimEnd()}\n`;
}

function upsertManagedHookBlock(content: string): string {
  const normalized = normalizeNewlines(content);
  const blockPattern = new RegExp(
    `${escapeRegExp(MANAGED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(MANAGED_BLOCK_END)}\\n?`,
    'm',
  );

  if (blockPattern.test(normalized)) {
    return `${normalized.replace(blockPattern, `${MANAGED_HOOK_BLOCK}\n`).trimEnd()}\n`;
  }

  const base = normalized.trimEnd();
  if (!base) {
    return `${MANAGED_HOOK_BLOCK}\n`;
  }

  return `${base}\n\n${MANAGED_HOOK_BLOCK}\n`;
}

function normalizeNewlines(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

function escapeRegExp(content: string): string {
  return content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
