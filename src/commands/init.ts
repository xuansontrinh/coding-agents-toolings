import {gitRoot, isGitRepo} from '../utils/fs.js';
import {log} from '../utils/log.js';
import {writeSkills} from '../installer/write-skills.js';
import {linkClaude} from '../installer/link-claude.js';
import {installCodexHooks} from '../installer/codex-hooks.js';
import {installClaudeHooks} from '../installer/claude-settings.js';
import {ensureGitignore} from '../installer/gitignore.js';

export interface InitOptions {
    force: boolean;
    dryRun: boolean;
    noSymlink: boolean;
    noHook: boolean;
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
    let symlinkChanged = false;
    if (!opts.noSymlink) {
        symlinkChanged = await linkClaude({
            root, dryRun: opts.dryRun, force: opts.force,
        });
    } else {
        log.dim('  Skipped symlink (--no-symlink)');
    }

    // Step 3: Install repo-local Codex and Claude hooks
    let codexHooksChanged = false;
    let claudeHooksChanged = false;
    if (!opts.noHook) {
        codexHooksChanged = installCodexHooks({
            root, dryRun: opts.dryRun,
        });
        claudeHooksChanged = installClaudeHooks({
            root, dryRun: opts.dryRun,
        });
    } else {
        log.dim('  Skipped repo-local hooks (--no-hook)');
    }

    // Step 4: Ensure agent-specs/ is gitignored
    const gitignoreChanged = ensureGitignore({root, dryRun: opts.dryRun});
    const anyChanged = skillsChanged || symlinkChanged || codexHooksChanged || claudeHooksChanged || gitignoreChanged;

    console.log();
    if (opts.dryRun) {
        log.info('Dry run complete. No files were modified.');
    } else if (!anyChanged) {
        log.success('Already up to date — no repo-local agent files changed.');
    } else {
        log.success('Done! Repo-local agent tooling is ready:');
        log.dim('  .agents/skills/spec-create/SKILL.md');
        log.dim('  .agents/skills/spec-update/SKILL.md');
        log.dim('  .agents/skills/spec-complete/SKILL.md');
        log.dim('  .agents/skills/spec-handoff/SKILL.md');
        log.dim('  .agents/skills/ide-mcp/SKILL.md');
        if (!opts.noSymlink) {
            log.dim('  .claude/skills → ../.agents/skills');
        }
        if (!opts.noHook) {
            log.dim('  .codex/config.toml');
            log.dim('  .codex/hooks/ide-mcp-context.mjs');
            log.dim('  .claude/settings.json');
            log.dim('  .claude/hooks/ide-mcp-context.mjs');
        }
        console.log();
        log.info('Use /spec-create, /spec-update, /spec-complete, and /spec-handoff in your agent workflow.');
        log.info('Code-oriented prompts in Codex and Claude will also be nudged toward the repo-local ide-mcp skill by default.');
    }
}
