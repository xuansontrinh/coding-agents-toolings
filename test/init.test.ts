import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execSync, spawnSync} from 'node:child_process';

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

function readJson(filePath: string): any {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('coding-agents-toolings init', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = createTempGitRepo();
    });

    afterEach(() => {
        rmSync(tmpDir, {recursive: true, force: true});
    });

    it('creates skills, symlink, and repo-local Codex/Claude hook files in a fresh repo', () => {
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        // Check skill files exist
        const specCreate = join(tmpDir, '.agents', 'skills', 'spec-create', 'SKILL.md');
        const specUpdate = join(tmpDir, '.agents', 'skills', 'spec-update', 'SKILL.md');
        const specComplete = join(tmpDir, '.agents', 'skills', 'spec-complete', 'SKILL.md');
        const specHandoff = join(tmpDir, '.agents', 'skills', 'spec-handoff', 'SKILL.md');
        const ideMcp = join(tmpDir, '.agents', 'skills', 'ide-mcp', 'SKILL.md');
        expect(existsSync(specCreate)).toBe(true);
        expect(existsSync(specUpdate)).toBe(true);
        expect(existsSync(specComplete)).toBe(true);
        expect(existsSync(specHandoff)).toBe(true);
        expect(existsSync(ideMcp)).toBe(true);

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

        const ideMcpContent = readFileSync(ideMcp, 'utf-8');
        expect(ideMcpContent).toContain('name: ide-mcp');
        expect(ideMcpContent).toContain('WebStorm');
        expect(ideMcpContent).toContain('IntelliJ IDEA');
        expect(ideMcpContent).toContain('`pycharm`');
        expect(ideMcpContent).toContain('`goland`');
        expect(ideMcpContent).toContain('`rider`');
        expect(ideMcpContent).toContain('prefer `idea` first for Kotlin');
        expect(ideMcpContent).toContain('prefer `webstorm` first for TypeScript');
        expect(ideMcpContent).toContain('falling back');

        // Check symlink
        const symlinkPath = join(tmpDir, '.claude', 'skills');
        expect(lstatSync(symlinkPath).isSymbolicLink()).toBe(true);
        expect(readlinkSync(symlinkPath)).toBe('../.agents/skills');

        // Verify symlink actually resolves — can read a skill through it
        const viaSymlink = readFileSync(join(symlinkPath, 'spec-create', 'SKILL.md'), 'utf-8');
        expect(viaSymlink).toContain('name: spec-create');

        const ideViaSymlink = readFileSync(join(symlinkPath, 'ide-mcp', 'SKILL.md'), 'utf-8');
        expect(ideViaSymlink).toContain('name: ide-mcp');

        // Check Codex repo-local config and hook script
        const codexConfig = join(tmpDir, '.codex', 'config.toml');
        const codexHookScript = join(tmpDir, '.codex', 'hooks', 'ide-mcp-context.mjs');
        expect(existsSync(codexConfig)).toBe(true);
        expect(existsSync(codexHookScript)).toBe(true);
        const codexConfigContent = readFileSync(codexConfig, 'utf-8');
        expect(codexConfigContent).toContain('[features]');
        expect(codexConfigContent).toContain('codex_hooks = true');
        expect(codexConfigContent).toContain('BEGIN coding-agents-toolings ide-mcp');
        expect(codexConfigContent).toContain('[[hooks.UserPromptSubmit]]');
        expect(codexConfigContent).toContain('[[hooks.PreToolUse]]');
        expect(codexConfigContent).toContain('[[hooks.PostToolUse]]');
        expect(codexConfigContent).toContain('.codex/hooks/ide-mcp-context.mjs');

        // Check Claude repo-local settings and hook script
        const claudeSettingsPath = join(tmpDir, '.claude', 'settings.json');
        const claudeHookScript = join(tmpDir, '.claude', 'hooks', 'ide-mcp-context.mjs');
        expect(existsSync(claudeSettingsPath)).toBe(true);
        expect(existsSync(claudeHookScript)).toBe(true);
        const claudeSettings = readJson(claudeSettingsPath);
        expect(claudeSettings.hooks.UserPromptSubmit).toBeInstanceOf(Array);
        expect(JSON.stringify(claudeSettings.hooks.UserPromptSubmit)).toContain('.claude/hooks/ide-mcp-context.mjs');

        expect(existsSync(join(tmpDir, '.mcp.json'))).toBe(false);
    });

    it('generated ide-mcp hook scripts route Kotlin/JVM prompts toward idea', () => {
        runCli(tmpDir, 'init --force');

        const codexHookScript = join(tmpDir, '.codex', 'hooks', 'ide-mcp-context.mjs');
        const codePrompt = JSON.stringify({
            cwd: tmpDir,
            session_id: 'session-kotlin',
            turn_id: 'turn-kotlin',
            hook_event_name: 'UserPromptSubmit',
            prompt: 'Find the Kotlin service class in build.gradle.kts and rename the OrderService symbol',
        });
        const codeResult = spawnSync('node', [codexHookScript], {
            input: codePrompt, encoding: 'utf-8',
        });
        expect(codeResult.status).toBe(0);
        expect(codeResult.stdout.trim()).not.toBe('');
        const codeOutput = JSON.parse(codeResult.stdout);
        expect(codeOutput.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
        expect(codeOutput.hookSpecificOutput.additionalContext).toContain('ide-mcp');
        expect(codeOutput.hookSpecificOutput.additionalContext).toContain('Prefer `idea` first');
    });

    it('generated ide-mcp hook scripts route Python prompts toward pycharm', () => {
        runCli(tmpDir, 'init --force');

        const codexHookScript = join(tmpDir, '.codex', 'hooks', 'ide-mcp-context.mjs');
        const pythonPromptResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                cwd: tmpDir,
                session_id: 'session-python',
                turn_id: 'turn-python',
                hook_event_name: 'UserPromptSubmit',
                prompt: 'Trace the FastAPI endpoint in app/api/users.py and update the pytest coverage',
            }),
            encoding: 'utf-8',
        });
        expect(pythonPromptResult.status).toBe(0);
        expect(pythonPromptResult.stdout.trim()).not.toBe('');
        const pythonOutput = JSON.parse(pythonPromptResult.stdout);
        expect(pythonOutput.hookSpecificOutput.additionalContext).toContain('Prefer `pycharm` first');
    });

    it('generated ide-mcp hook scripts route JS/TS prompts toward webstorm and stay silent for non-code prompts', () => {
        runCli(tmpDir, 'init --force');

        const codexHookScript = join(tmpDir, '.codex', 'hooks', 'ide-mcp-context.mjs');
        const webPromptResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                cwd: tmpDir,
                session_id: 'session-web',
                turn_id: 'turn-web',
                hook_event_name: 'UserPromptSubmit',
                prompt: 'Refactor the React component in src/components/App.tsx and update the Next.js route',
            }),
            encoding: 'utf-8',
        });
        expect(webPromptResult.status).toBe(0);
        expect(webPromptResult.stdout.trim()).not.toBe('');
        const webOutput = JSON.parse(webPromptResult.stdout);
        expect(webOutput.hookSpecificOutput.additionalContext).toContain('Prefer `webstorm` first');

        const nonCodeResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                cwd: tmpDir,
                session_id: 'session-note',
                turn_id: 'turn-note',
                hook_event_name: 'UserPromptSubmit',
                prompt: 'Write a short release note for this sprint',
            }),
            encoding: 'utf-8',
        });
        expect(nonCodeResult.status).toBe(0);
        expect(nonCodeResult.stdout.trim()).toBe('');
    });

    it('Codex guardrail blocks broad shell search until enough JetBrains MCP steps have happened', () => {
        runCli(tmpDir, 'init --force');

        const codexHookScript = join(tmpDir, '.codex', 'hooks', 'ide-mcp-context.mjs');
        const context = {
            cwd: tmpDir,
            session_id: 'session-guardrail',
            turn_id: 'turn-guardrail',
        };

        const submitResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'UserPromptSubmit',
                prompt: 'Trace how HubEmbeddedUiPassThroughAuthenticationParser is wired through Spring security in the Kotlin backend',
            }),
            encoding: 'utf-8',
        });
        expect(submitResult.status).toBe(0);
        expect(submitResult.stdout.trim()).not.toBe('');

        const firstMcpResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'PostToolUse',
                tool_name: 'mcp__idea__search_symbol',
                tool_response: {content: [{type: 'text', text: 'Found symbol'}]},
            }),
            encoding: 'utf-8',
        });
        expect(firstMcpResult.status).toBe(0);
        expect(firstMcpResult.stdout.trim()).not.toBe('');
        const firstMcpOutput = JSON.parse(firstMcpResult.stdout);
        expect(firstMcpOutput.hookSpecificOutput.additionalContext).toContain('meaningful IDE-native follow-up');

        const blockedSearchResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'PreToolUse',
                tool_name: 'Bash',
                tool_input: {
                    command: 'rg "HubEmbeddedUiPassThroughAuthenticationParser"',
                },
            }),
            encoding: 'utf-8',
        });
        expect(blockedSearchResult.status).toBe(0);
        expect(blockedSearchResult.stdout.trim()).not.toBe('');
        const blockedSearchOutput = JSON.parse(blockedSearchResult.stdout);
        expect(blockedSearchOutput.hookSpecificOutput.permissionDecision).toBe('deny');
        expect(blockedSearchOutput.hookSpecificOutput.permissionDecisionReason).toContain('JetBrains MCP has only been used once');

        const secondMcpResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'PostToolUse',
                tool_name: 'mcp__idea__find_usages',
                tool_response: {content: [{type: 'text', text: 'Found usages'}]},
            }),
            encoding: 'utf-8',
        });
        expect(secondMcpResult.status).toBe(0);
        expect(secondMcpResult.stdout.trim()).toBe('');

        const allowedSearchResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'PreToolUse',
                tool_name: 'Bash',
                tool_input: {
                    command: 'rg "HubEmbeddedUiPassThroughAuthenticationParser"',
                },
            }),
            encoding: 'utf-8',
        });
        expect(allowedSearchResult.status).toBe(0);
        expect(allowedSearchResult.stdout.trim()).toBe('');

        const fileReadResult = spawnSync('node', [codexHookScript], {
            input: JSON.stringify({
                ...context,
                hook_event_name: 'PreToolUse',
                tool_name: 'Bash',
                tool_input: {
                    command: 'sed -n \'1,120p\' src/main/kotlin/example/Foo.kt',
                },
            }),
            encoding: 'utf-8',
        });
        expect(fileReadResult.status).toBe(0);
        expect(fileReadResult.stdout.trim()).toBe('');
    });

    it('is idempotent — re-running makes no duplicate hook registrations', () => {
        runCli(tmpDir, 'init --force');
        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('unchanged');
        expect(result.stdout).toContain('already linked');

        const codexConfig = readFileSync(join(tmpDir, '.codex', 'config.toml'), 'utf-8');
        expect(codexConfig.match(/BEGIN coding-agents-toolings ide-mcp/g)?.length ?? 0).toBe(1);

        const claudeSettings = readFileSync(join(tmpDir, '.claude', 'settings.json'), 'utf-8');
        expect(claudeSettings.match(/ide-mcp-context\.mjs/g)?.length ?? 0).toBe(1);
    });

    it('dry-run creates no files', () => {
        const result = runCli(tmpDir, 'init --dry-run');
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Dry run');
        expect(existsSync(join(tmpDir, '.agents'))).toBe(false);
        expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
        expect(existsSync(join(tmpDir, '.codex'))).toBe(false);
        expect(existsSync(join(tmpDir, '.claude', 'settings.json'))).toBe(false);
    });

    it('merges existing Codex and Claude settings without overwriting unrelated config', () => {
        mkdirSync(join(tmpDir, '.codex'), {recursive: true});
        mkdirSync(join(tmpDir, '.claude'), {recursive: true});
        writeFileSync(join(tmpDir, '.codex', 'config.toml'), `[model_providers.local]\nname = "Local"\n\n[features]\nexperimental = true\ncodex_hooks = false\n\n[[hooks.Stop]]\n[[hooks.Stop.hooks]]\ntype = "command"\ncommand = "echo stop"\n`);
        writeFileSync(join(tmpDir, '.claude', 'settings.json'), JSON.stringify({
            theme: 'dark',
            hooks: {
                Stop: [
                    {
                        hooks: [
                            {type: 'command', command: 'echo stop'},
                        ],
                    },
                ],
                UserPromptSubmit: [
                    {
                        hooks: [
                            {type: 'command', command: 'echo existing'},
                        ],
                    },
                ],
            },
        }, null, 2));

        const result = runCli(tmpDir, 'init --force');
        expect(result.exitCode).toBe(0);

        const codexConfig = readFileSync(join(tmpDir, '.codex', 'config.toml'), 'utf-8');
        expect(codexConfig).toContain('[model_providers.local]');
        expect(codexConfig).toContain('name = "Local"');
        expect(codexConfig).toContain('experimental = true');
        expect(codexConfig).toContain('codex_hooks = true');
        expect(codexConfig).toContain('command = "echo stop"');
        expect(codexConfig).toContain('BEGIN coding-agents-toolings ide-mcp');

        const claudeSettings = readJson(join(tmpDir, '.claude', 'settings.json'));
        expect(claudeSettings.theme).toBe('dark');
        expect(claudeSettings.hooks.Stop).toBeInstanceOf(Array);
        expect(JSON.stringify(claudeSettings.hooks.Stop)).toContain('echo stop');
        expect(claudeSettings.hooks.UserPromptSubmit).toHaveLength(2);
        expect(JSON.stringify(claudeSettings.hooks.UserPromptSubmit)).toContain('echo existing');
        expect(JSON.stringify(claudeSettings.hooks.UserPromptSubmit)).toContain('.claude/hooks/ide-mcp-context.mjs');
    });

    it('--no-symlink skips symlink creation', () => {
        const result = runCli(tmpDir, 'init --force --no-symlink');
        expect(result.exitCode).toBe(0);

        expect(existsSync(join(tmpDir, '.agents', 'skills', 'spec-create', 'SKILL.md'))).toBe(true);
        expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
    });

    it('--no-hook skips repo-local Codex and Claude hook creation', () => {
        const result = runCli(tmpDir, 'init --force --no-hook');
        expect(result.exitCode).toBe(0);

        expect(existsSync(join(tmpDir, '.agents', 'skills', 'ide-mcp', 'SKILL.md'))).toBe(true);
        expect(lstatSync(join(tmpDir, '.claude', 'skills')).isSymbolicLink()).toBe(true);
        expect(existsSync(join(tmpDir, '.codex'))).toBe(false);
        expect(existsSync(join(tmpDir, '.claude', 'settings.json'))).toBe(false);
        expect(existsSync(join(tmpDir, '.claude', 'hooks'))).toBe(false);
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
