#!/usr/bin/env node

import { init } from './commands/init.js';
import { log } from './utils/log.js';

const args = process.argv.slice(2);
const command = args[0];

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

async function main(): Promise<void> {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'init') {
    await init({
      force: hasFlag('force'),
      dryRun: hasFlag('dry-run'),
      noSymlink: hasFlag('no-symlink'),
      noHook: hasFlag('no-hook'),
    });
    return;
  }

  log.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

function printHelp(): void {
  console.log(`
  ${log.bold('coding-agents-toolings')} — Skills, hooks, and toolings for AI coding agents

  Usage:
    npx coding-agents-toolings init [options]

  Commands:
    init          Install agent skills and repo-local agent hooks into the current git repo

  Options:
    --force       Overwrite without prompting
    --dry-run     Show what would happen, no mutations
    --no-symlink  Only write to .agents/skills/, skip .claude/skills link
    --no-hook     Skip repo-local Codex and Claude hook setup
    --help, -h    Show this help
`);
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
