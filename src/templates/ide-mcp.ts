export const IDE_MCP_SKILL = `---
name: ide-mcp
description: Prefer connected JetBrains IDE MCP servers for code search, symbol navigation, refactors, and project-aware analysis before falling back to shell exploration
---

# ide-mcp - Prefer JetBrains IDE MCP for Code Work

Use this skill when the task touches source code and the current agent session may have JetBrains IDE MCP servers connected, for example IntelliJ IDEA (\`idea\`), WebStorm (\`webstorm\`), PyCharm (\`pycharm\`), GoLand (\`goland\`), Rider (\`rider\`), PhpStorm (\`phpstorm\`), RubyMine (\`rubymine\`), RustRover (\`rustrover\`), CLion (\`clion\`), DataGrip (\`datagrip\`), or DataSpell (\`dataspell\`).

## Goal

Prefer IDE-aware MCP tools for project navigation and refactors without making them a hard dependency. The skill should help both Codex and Claude-compatible sessions take advantage of the user's existing IDE MCP setup when it is present.

## Workflow

1. Check whether the current session exposes JetBrains IDE MCP servers, and note which aliases are actually available.
2. Route to the IDE server that best matches the language and project:
   - prefer \`idea\` first for Kotlin, Java, Scala, Gradle, Maven, Spring, Android, and other JVM-oriented work
   - prefer \`webstorm\` first for TypeScript, JavaScript, Node.js, React, Next.js, Vue, Nuxt, Angular, Svelte, CSS, and HTML work
   - prefer \`pycharm\` first for Python, Django, Flask, FastAPI, pytest, and Python-heavy notebook or backend work
   - prefer \`goland\` first for Go modules, Go services, and \`go.mod\`-driven repos
   - prefer \`rider\` first for C#, .NET, ASP.NET, and \`.sln\` or \`.csproj\` work
   - prefer \`phpstorm\` first for PHP, Laravel, Symfony, Composer, and \`.php\` codebases
   - prefer \`rubymine\` first for Ruby, Rails, Bundler, and \`Gemfile\`-based apps
   - prefer \`rustrover\` first for Rust, Cargo, and \`Cargo.toml\` projects
   - prefer \`clion\` first for C, C++, and CMake-based native code
   - prefer \`datagrip\` first for SQL, schema, migration, and database-connection work
   - prefer \`dataspell\` first for notebook-heavy or data-science workflows when that alias is available
   - when the prompt mentions a concrete file path, extension, framework, or build tool, use that as the strongest signal
   - when the prompt is ambiguous, inspect repo markers such as \`build.gradle.kts\`, \`pom.xml\`, \`package.json\`, \`tsconfig.json\`, or the touched file extensions before choosing
   - do not pick a server only because its alias appears first or because it handled the last task
3. If a suitable server is available, prefer it for project-aware work:
   - symbol lookup and navigation
   - go-to-definition, implementations, and usages
   - project-wide search with IDE context
   - rename, move, and refactor flows
   - IDE inspections and code-aware analysis
   - in Codex sessions, after the first successful MCP lookup, prefer a meaningful IDE-native follow-up such as usages, implementations, or related framework navigation before broad text search
4. Use normal repo tools alongside MCP when they are the better fit:
   - \`rg\` and targeted file reads for quick text search
   - local build, test, and lint commands for verification
   - git history or diff inspection as usual
5. Do not assume one transport or endpoint shape. Detect the available MCP server by alias and capabilities at runtime.
6. If multiple JetBrains IDE servers are present, choose based on language, framework, file types, and which project the server seems to own.
7. If the exact specialized IDE is not connected, use the closest available JetBrains IDE that appears to own the right project, then fall back to shell tools if the IDE context is still wrong.
8. If the first server choice looks wrong, for example \`webstorm\` cannot resolve a Kotlin class or \`idea\` is missing frontend context, switch once before falling back.
9. If no JetBrains IDE MCP server is available, say so briefly and continue with the normal repo workflow instead of blocking the task.

## Routing Heuristics

- **Prefer \`idea\`**:
  - Kotlin or Java classes
  - \`.kt\`, \`.kts\`, \`.java\`, or \`.scala\` files
  - Gradle or Maven files such as \`build.gradle.kts\`, \`settings.gradle\`, or \`pom.xml\`
  - Spring, Android, Ktor, JVM, or IntelliJ Platform work
- **Prefer \`webstorm\`**:
  - \`.ts\`, \`.tsx\`, \`.js\`, \`.jsx\`, \`.css\`, or \`.html\` files
  - React, Next.js, Vue, Nuxt, Angular, Svelte, Vite, or webpack work
  - package-level web app tasks such as component refactors, route lookup, or frontend build issues
- **Prefer \`pycharm\`**:
  - \`.py\` or \`.ipynb\` files
  - Django, Flask, FastAPI, pytest, pandas, numpy, or Poetry work
  - Python services, scripts, tests, or notebooks
- **Prefer \`goland\`**:
  - \`.go\` files and \`go.mod\`
  - Go services, packages, handlers, or module refactors
- **Prefer \`rider\`**:
  - \`.cs\`, \`.csproj\`, or \`.sln\` files
  - .NET, ASP.NET, xUnit, NUnit, or NuGet-heavy work
- **Prefer \`phpstorm\`**:
  - \`.php\` files and \`composer.json\`
  - Laravel, Symfony, or Composer workflows
- **Prefer \`rubymine\`**:
  - \`.rb\` files and \`Gemfile\`
  - Ruby, Rails, RSpec, or Bundler work
- **Prefer \`rustrover\`**:
  - \`.rs\` files and \`Cargo.toml\`
  - Rust crates, modules, and Cargo-based builds
- **Prefer \`clion\`**:
  - \`.c\`, \`.cc\`, \`.cpp\`, \`.h\`, or \`.hpp\` files
  - \`CMakeLists.txt\` and native code projects
- **Prefer \`datagrip\`**:
  - \`.sql\` files, schema migrations, and data-source inspection
  - database-focused search, schema review, and query work
- **Prefer \`dataspell\`**:
  - notebook-heavy data-science work where a dedicated data IDE is available
- **Stay flexible**:
  - if the repo is full-stack, choose by the files or module named in the prompt instead of the dominant stack of the repo
  - if the prompt is generic, inspect local files first and then pick the server
  - once MCP has identified the right symbol or module, prefer another IDE-native step such as usages, implementations, or related framework navigation before broad cross-repo text search
  - if neither server is clearly a fit, use shell exploration instead of forcing the wrong IDE

## Good Fits

- "Find where this symbol is used"
- "Rename this API across the repo"
- "Refactor this class safely"
- "Navigate from this call site to its definition"
- "Inspect the project structure before editing"
- "Find this Kotlin service class in the Gradle module"
- "Rename this React component across the frontend app"
- "Trace this FastAPI route in the Python service"
- "Find the Go interface implementation in this module"
- "Rename this C# class across the solution"

## Fallback

When IDE MCP is unavailable or does not expose the needed operation:

- explore with \`rg --files\`, \`rg\`, and focused file reads
- make changes with the repo's normal edit workflow
- run focused build, test, or lint commands to verify the result

This skill is a preference layer, not a provisioning step. It assumes the user's MCP client or JetBrains IDE integration is already configured outside this repo.
`;
