import {gitRoot, isGitRepo} from '../utils/fs.js';
import {log} from '../utils/log.js';
import {writeSkills} from '../installer/write-skills.js';
import {linkClaude} from '../installer/link-claude.js';
import {ensureGitignore} from '../installer/gitignore.js';

export interface InitOptions {
    force: boolean;
    dryRun: boolean;
    noSymlink: boolean;
}

export async function init(opts: InitOptions): Promise<void> {
    const cwd = process.cwd();

    if (!isGitRepo(cwd)) {
        log.error('Not inside a git repository. Run this from a git repo root.');
        process.exit(1);
    }

    const root = gitRoot(cwd);

    if (opts.dryRun) {
        log.info('Dry run — no files will be written\n');
    }

    log.info(`Installing agent skills into ${log.bold(root)}\n`);

    // Step 1: Write skill files
    const skillsChanged = writeSkills({
        root, dryRun: opts.dryRun, force: opts.force,
    });

    // Step 2: Create symlink
    if (!opts.noSymlink) {
        await linkClaude({
            root, dryRun: opts.dryRun, force: opts.force,
        });
    } else {
        log.dim('  Skipped symlink (--no-symlink)');
    }

    // Step 3: Ensure agent-specs/ is gitignored
    ensureGitignore({root, dryRun: opts.dryRun});

    console.log();
    if (opts.dryRun) {
        log.info('Dry run complete. No files were modified.');
    } else {
        log.success('Done! Skills installed:');
        log.dim('  .agents/skills/spec-create/SKILL.md');
        log.dim('  .agents/skills/spec-update/SKILL.md');
        log.dim('  .agents/skills/spec-complete/SKILL.md');
        if (!opts.noSymlink) {
            log.dim('  .claude/skills → ../.agents/skills');
        }
        console.log();
        log.info('Use /spec-create, /spec-update, and /spec-complete in Claude Code.');
    }
}
