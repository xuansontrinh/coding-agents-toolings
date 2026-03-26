import { isSymlink, symlinkTarget, isEmptyDir, dirExists, existsSync, readdirSync } from '../utils/fs.js';

export type ConflictKind =
  | 'none'              // path doesn't exist
  | 'correct-symlink'   // already points to .agents/skills
  | 'wrong-symlink'     // symlink points elsewhere
  | 'empty-dir'         // real empty directory
  | 'dir-with-content'; // real directory with files

export interface ConflictResult {
  kind: ConflictKind;
  currentTarget?: string;
  files?: string[];
}

export function detectConflict(claudeSkillsPath: string, expectedTarget: string): ConflictResult {
  if (!existsSync(claudeSkillsPath) && !isSymlink(claudeSkillsPath)) {
    return { kind: 'none' };
  }

  if (isSymlink(claudeSkillsPath)) {
    const target = symlinkTarget(claudeSkillsPath);
    if (target === expectedTarget) {
      return { kind: 'correct-symlink', currentTarget: target ?? undefined };
    }
    return { kind: 'wrong-symlink', currentTarget: target ?? undefined };
  }

  if (dirExists(claudeSkillsPath)) {
    if (isEmptyDir(claudeSkillsPath)) {
      return { kind: 'empty-dir' };
    }
    return {
      kind: 'dir-with-content',
      files: readdirSync(claudeSkillsPath),
    };
  }

  return { kind: 'none' };
}
