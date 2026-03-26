import { existsSync, lstatSync, readFileSync, mkdirSync, writeFileSync, symlinkSync, unlinkSync, readdirSync, rmSync, readlinkSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { execSync } from 'node:child_process';

export function isGitRepo(dir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: dir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function gitRoot(dir: string): string {
  return execSync('git rev-parse --show-toplevel', { cwd: dir, stdio: 'pipe' })
    .toString()
    .trim();
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeIfChanged(filePath: string, content: string): 'created' | 'updated' | 'unchanged' {
  ensureDir(dirname(filePath));
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf-8');
    if (existing === content) return 'unchanged';
    writeFileSync(filePath, content, 'utf-8');
    return 'updated';
  }
  writeFileSync(filePath, content, 'utf-8');
  return 'created';
}

export function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export function symlinkTarget(path: string): string | null {
  try {
    return readlinkSync(path);
  } catch {
    return null;
  }
}

export function isEmptyDir(path: string): boolean {
  try {
    return lstatSync(path).isDirectory() && readdirSync(path).length === 0;
  } catch {
    return false;
  }
}

export function dirExists(path: string): boolean {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function createSymlink(target: string, linkPath: string): void {
  ensureDir(dirname(linkPath));
  symlinkSync(target, linkPath, 'dir');
}

export function removeDir(path: string): void {
  rmSync(path, { recursive: true, force: true });
}

export function removePath(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    rmSync(path, { recursive: true, force: true });
  }
}

export { existsSync, readdirSync, join, relative, dirname };
