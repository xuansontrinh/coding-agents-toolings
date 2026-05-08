import { join } from 'node:path';
import { writeIfChanged, ensureDir } from '../utils/fs.js';
import { log } from '../utils/log.js';
import { SPEC_CREATE_SKILL } from '../templates/spec-create.js';
import { SPEC_UPDATE_SKILL } from '../templates/spec-update.js';
import { SPEC_COMPLETE_SKILL } from '../templates/spec-complete.js';
import { SPEC_HANDOFF_SKILL } from '../templates/spec-handoff.js';
import { IDE_MCP_SKILL } from '../templates/ide-mcp.js';

export interface WriteSkillsOptions {
  root: string;
  dryRun: boolean;
  force: boolean;
}

interface SkillDef {
  name: string;
  content: string;
}

const SKILLS: SkillDef[] = [
  { name: 'spec-create', content: SPEC_CREATE_SKILL },
  { name: 'spec-update', content: SPEC_UPDATE_SKILL },
  { name: 'spec-complete', content: SPEC_COMPLETE_SKILL },
  { name: 'spec-handoff', content: SPEC_HANDOFF_SKILL },
  { name: 'ide-mcp', content: IDE_MCP_SKILL },
];

export function writeSkills(opts: WriteSkillsOptions): boolean {
  const skillsDir = join(opts.root, '.agents', 'skills');
  let anyChanged = false;

  for (const skill of SKILLS) {
    const skillDir = join(skillsDir, skill.name);
    const filePath = join(skillDir, 'SKILL.md');

    if (opts.dryRun) {
      log.dim(`  Would write ${filePath}`);
      continue;
    }

    ensureDir(skillDir);
    const result = writeIfChanged(filePath, skill.content);

    switch (result) {
      case 'created':
        log.success(`Created ${skill.name}/SKILL.md`);
        anyChanged = true;
        break;
      case 'updated':
        log.success(`Updated ${skill.name}/SKILL.md`);
        anyChanged = true;
        break;
      case 'unchanged':
        log.dim(`  ${skill.name}/SKILL.md unchanged`);
        break;
    }
  }

  return anyChanged;
}
