import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {existsSync, lstatSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execSync} from 'node:child_process';

function createTempGitRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), 'cat-test-'));
    execSync('git init', {cwd: dir, stdio: 'pipe'});
    execSync('git config user.email "test@test.com"', {cwd: dir, stdio: 'pipe'});
    execSync('git config user.name "Test"', {cwd: dir, stdio: 'pipe'});
    return dir;
}

function runCli(cwd: string, args: string = ''): { stdout: string; stderr: string; exitCode: number } {
    const entry = join(__dirname, '..', 'dist', 'index.js');
    try {
        const stdout = execSync(`node ${entry} ${args}`, {
            cwd, stdio: 'pipe', env: {...process.env, NO_COLOR: '1'},
        }).toString();
        return {stdout, stderr: '', exitCode: 0};
    } catch (err: any) {
        return {
            stdout: err.stdout?.toString() ?? '', stderr: err.stderr?.toString() ?? '', exitCode: err.status ?? 1,
        };
    }
}

describe('coding-agents-toolings init', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = createTempGitRepo();
    });

    afterEach(() => {
        rmSync(tmpDir, {recursive: true, force: true});
    });

    it('creates skill files and symlink in a fresh repo', () => {
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        // Check skill files exist
        const specCreate = join(tmpDir, '.agents', 'skills', 'spec-create', 'SKILL.md');
        const specUpdate = join(tmpDir, '.agents', 'skills', 'spec-update', 'SKILL.md');
        const specComplete = join(tmpDir, '.agents', 'skills', 'spec-complete', 'SKILL.md');
        const specHandoff = join(tmpDir, '.agents', 'skills', 'spec-handoff', 'SKILL.md');
        expect(existsSync(specCreate)).toBe(true);
        expect(existsSync(specUpdate)).toBe(true);
        expect(existsSync(specComplete)).toBe(true);
        expect(existsSync(specHandoff)).toBe(true);

        // Check content
        const content = readFileSync(specCreate, 'utf-8');
        expect(content).toContain('name: spec-create');
        expect(content).toContain('agent-specs/active/');
        expect(content).toContain('## Codebase Map');
        expect(content).toContain('### Repositories');
        expect(content).toContain('Repo / Codebase');
        expect(content).toContain('history/');

        const updateContent = readFileSync(specUpdate, 'utf-8');
        expect(updateContent).toContain('name: spec-update');
        expect(updateContent).toContain('agent-specs/active/');
        expect(updateContent).toContain('Codebase Map');
        expect(updateContent).toContain('multiple microservices or repos');
        expect(updateContent).toContain('history/');

        const doneContent = readFileSync(specComplete, 'utf-8');
        expect(doneContent).toContain('name: spec-complete');
        expect(doneContent).toContain('agent-specs/completed/');
        expect(doneContent).toContain('history/');

        const handoffContent = readFileSync(specHandoff, 'utf-8');
        expect(handoffContent).toContain('name: spec-handoff');
        expect(handoffContent).toContain('agent-specs/active/');
        expect(handoffContent).toContain('Codebase Map');
        expect(handoffContent).toContain('repo-qualified');

        // Check symlink
        const symlinkPath = join(tmpDir, '.claude', 'skills');
        expect(lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
        expect(readlinkSync(symlinkPath)).toBe('../.agents/skills');

        // Verify symlink actually resolves — can read a skill through it
        const viaSymlink = readFileSync(join(symlinkPath, 'spec-create', 'SKILL.md'), 'utf-8');
        expect(viaSymlink).toContain('name: spec-create');
    });

    it('is idempotent — re-running makes no changes', () => {
        runCli(tmpDir, 'init --force');
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('unchanged');
        expect(result.stdout).toContain('already linked');
    });

    it('dry-run creates no files', () => {
        const result = runCli(tmpDir, 'init --dry-run');
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Dry run');
        expect(existsSync(join(tmpDir, '.agents'))).toBe(false);
        expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
    });

    it('--no-symlink skips symlink creation', () => {
        const result = runCli(tmpDir, 'init --force --no-symlink');
        expect(result.exitCode).toBe(0);

        expect(existsSync(join(tmpDir, '.agents', 'skills', 'spec-create', 'SKILL.md'))).toBe(true);
        expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
    });

    it('fails outside a git repo', () => {
        const nonGitDir = mkdtempSync(join(tmpdir(), 'cat-nogit-'));
        const result = runCli(nonGitDir, 'init');
        expect(result.exitCode).not.toBe(0);
        rmSync(nonGitDir, {recursive: true, force: true});
    });

    it('adds agent-specs/ to .gitignore', () => {
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        const gitignore = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
        expect(gitignore).toContain('agent-specs/');
    });

    it('does not duplicate agent-specs/ in existing .gitignore', () => {
        writeFileSync(join(tmpDir, '.gitignore'), 'node_modules/\nagent-specs/\n');
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        const gitignore = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
        const matches = gitignore.split('\n').filter(l => l.trim() === 'agent-specs/');
        expect(matches.length).toBe(1);
    });

    it('appends to existing .gitignore without overwriting', () => {
        writeFileSync(join(tmpDir, '.gitignore'), 'node_modules/\n');
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        const gitignore = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
        expect(gitignore).toContain('node_modules/');
        expect(gitignore).toContain('agent-specs/');
    });

    it('shows help with no command', () => {
        const result = runCli(tmpDir, '');
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('coding-agents-toolings');
        expect(result.stdout).toContain('init');
    });
});
