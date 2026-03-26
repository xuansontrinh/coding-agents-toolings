import { join } from 'node:path';
import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { log } from '../utils/log.js';

const SPECS_COMMENT = '# Local AI agent specs — added by coding-agents-toolings';
const SPECS_ENTRY = 'agent-specs/';

export interface GitignoreOptions {
  root: string;
  dryRun: boolean;
}

export function ensureGitignore(opts: GitignoreOptions): boolean {
  const gitignorePath = join(opts.root, '.gitignore');

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes(SPECS_ENTRY)) {
      log.dim(`  .gitignore already contains ${SPECS_ENTRY}`);
      return false;
    }

    if (opts.dryRun) {
      log.dim(`  Would add ${SPECS_ENTRY} to .gitignore`);
      return false;
    }

    const trailing = content.endsWith('\n') ? '' : '\n';
    appendFileSync(gitignorePath, `${trailing}${SPECS_COMMENT}\n${SPECS_ENTRY}\n`, 'utf-8');
  } else {
    if (opts.dryRun) {
      log.dim(`  Would create .gitignore with ${SPECS_ENTRY}`);
      return false;
    }

    writeFileSync(gitignorePath, `${SPECS_COMMENT}\n${SPECS_ENTRY}\n`, 'utf-8');
  }

  log.success(`Added ${SPECS_ENTRY} to .gitignore`);
  return true;
}
