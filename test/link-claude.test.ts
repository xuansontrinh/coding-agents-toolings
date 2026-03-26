import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, lstatSync, readlinkSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, rmSync } from 'node:child_process';

function createTempGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cat-link-'));
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  return dir;
}

function runCli(cwd: string, args: string = ''): { stdout: string; exitCode: number } {
  const entry = join(__dirname, '..', 'dist', 'index.js');
  try {
    const stdout = execSync(`node ${entry} ${args}`, {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, NO_COLOR: '1' },
    }).toString();
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout?.toString() ?? '', exitCode: err.status ?? 1 };
  }
}

describe('link-claude conflict handling', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempGitRepo();
  });

  afterEach(() => {
    require('node:fs').rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles empty .claude/skills/ directory', () => {
    mkdirSync(join(tmpDir, '.claude', 'skills'), { recursive: true });
    const result = runCli(tmpDir, 'init --force');
    expect(result.exitCode).toBe(0);
    expect(lstatSync(join(tmpDir, '.claude', 'skills')).isSymbolicLink()).toBe(true);
  });

  it('handles existing correct symlink', () => {
    // Pre-create the correct symlink
    mkdirSync(join(tmpDir, '.agents', 'skills'), { recursive: true });
    mkdirSync(join(tmpDir, '.claude'), { recursive: true });
    symlinkSync('../.agents/skills', join(tmpDir, '.claude', 'skills'), 'dir');

    const result = runCli(tmpDir, 'init --force');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('already linked');
  });

  it('replaces wrong symlink with --force', () => {
    mkdirSync(join(tmpDir, '.claude'), { recursive: true });
    mkdirSync(join(tmpDir, 'other'), { recursive: true });
    symlinkSync('../other', join(tmpDir, '.claude', 'skills'), 'dir');

    const result = runCli(tmpDir, 'init --force');
    expect(result.exitCode).toBe(0);
    expect(readlinkSync(join(tmpDir, '.claude', 'skills'))).toBe('../.agents/skills');
  });

  it('force-merges .claude/skills/ directory with content', () => {
    // Create .claude/skills/ with an existing skill
    const existingSkillDir = join(tmpDir, '.claude', 'skills', 'my-skill');
    mkdirSync(existingSkillDir, { recursive: true });
    writeFileSync(join(existingSkillDir, 'SKILL.md'), '# My Skill');

    const result = runCli(tmpDir, 'init --force');
    expect(result.exitCode).toBe(0);

    // Existing skill should be merged into .agents/skills/
    expect(existsSync(join(tmpDir, '.agents', 'skills', 'my-skill', 'SKILL.md'))).toBe(true);

    // Symlink should exist
    expect(lstatSync(join(tmpDir, '.claude', 'skills')).isSymbolicLink()).toBe(true);
  });
});
