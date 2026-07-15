import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathExists } from "./files.js";
import { readUtf8 } from "./encoding.js";

const KNOWN_PROFILES = new Set(["frontend", "backend", "fullstack", "library", "mixed", "unknown", "okf-v0.1"]);

// Detects npm/yarn workspace packages from the root package.json `workspaces`
// field (an array, or { packages: [] }). Expands a trailing `/*` glob to the
// immediate subdirectories and accepts literal paths; deeper globs and pnpm/YAML
// workspaces are not parsed (that would need a YAML/glob dependency), so they are
// reported via `unsupported` rather than guessed. Returns a deterministic, deduped
// list of workspace package paths (repo-relative, POSIX) plus an optional
// `unsupported` note. Read-only.
export async function detectWorkspaces(cwd) {
  const packagePath = path.join(cwd, "package.json");
  let patterns = null;
  if (await pathExists(packagePath)) {
    try {
      const pkg = JSON.parse(await readUtf8(packagePath));
      if (Array.isArray(pkg.workspaces)) patterns = pkg.workspaces;
      else if (pkg.workspaces && Array.isArray(pkg.workspaces.packages)) patterns = pkg.workspaces.packages;
    } catch {
      patterns = null;
    }
  }
  if (!patterns) {
    if (await pathExists(path.join(cwd, "pnpm-workspace.yaml"))) {
      return { packages: [], unsupported: "pnpm-workspace.yaml — YAML workspaces are not parsed (zero-dependency). List packages via npm/yarn workspaces to use monorepo mode." };
    }
    return { packages: [], unsupported: null };
  }
  const dirs = new Set();
  for (const pattern of patterns) {
    if (typeof pattern !== "string") continue;
    for (const dir of await expandWorkspacePattern(cwd, pattern)) dirs.add(dir);
  }
  return { packages: [...dirs].sort(), unsupported: null };
}

async function expandWorkspacePattern(cwd, pattern) {
  const normalized = pattern.replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalized.endsWith("/*")) {
    const base = normalized.slice(0, -2);
    const baseDir = path.join(cwd, base);
    if (!(await pathExists(baseDir))) return [];
    let entries;
    try {
      entries = await readdir(baseDir, { withFileTypes: true });
    } catch {
      return [];
    }
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => (base ? `${base}/${entry.name}` : entry.name));
  }
  // Deeper globs are not expanded; a literal directory path is used as-is.
  if (normalized.includes("*")) return [];
  if (await pathExists(path.join(cwd, normalized))) return [normalized];
  return [];
}

export async function detectProject(cwd, explicitType, explicitProfiles = []) {
  const signals = [];
  const packagePath = path.join(cwd, "package.json");
  let packageJson = null;

  if (await pathExists(packagePath)) {
    try {
      packageJson = JSON.parse(await readUtf8(packagePath));
      signals.push({ path: "package.json", reason: "package manifest detected" });
    } catch {
      signals.push({ path: "package.json", reason: "package manifest exists but could not be parsed" });
    }
  }

  const deps = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies
  };

  const frontendSignals = ["vue", "react", "svelte", "angular", "next", "nuxt", "vite"].filter((name) => deps[name]);
  const backendSignals = ["express", "fastify", "nestjs", "@nestjs/core", "django", "fastapi"].filter((name) => deps[name]);

  if (frontendSignals.length) {
    signals.push({ path: "package.json", reason: `frontend dependencies detected: ${frontendSignals.join(", ")}` });
  }
  if (backendSignals.length) {
    signals.push({ path: "package.json", reason: `backend dependencies detected: ${backendSignals.join(", ")}` });
  }
  if (await pathExists(path.join(cwd, "src", "components"))) {
    signals.push({ path: "src/components", reason: "UI component tree detected" });
  }
  if (await pathExists(path.join(cwd, "docs", "llm-wiki", "index.md"))) {
    signals.push({ path: "docs/llm-wiki/index.md", reason: "existing LLM-WIKI entry point detected" });
  }

  const librarySignals = [];
  if (packageJson?.bin) librarySignals.push("bin");
  if (packageJson?.exports) librarySignals.push("exports");
  if (librarySignals.length) {
    signals.push({ path: "package.json", reason: `library/CLI signals detected: ${librarySignals.join(", ")}` });
  }

  const ecosystems = [];
  let primaryManifest = packageJson ? "package.json" : null;
  if (packageJson) ecosystems.push("node");
  for (const eco of await detectNonNodeEcosystems(cwd)) {
    ecosystems.push(eco.ecosystem);
    signals.push({ path: eco.path, reason: eco.reason });
    if (!primaryManifest) primaryManifest = eco.path;
    if (eco.role === "backend") backendSignals.push(`${eco.ecosystem}:web`);
    else if (eco.role === "library") librarySignals.push(`${eco.ecosystem}:package`);
  }

  const detectedType = decideType(frontendSignals, backendSignals, librarySignals, signals);
  const projectType = explicitType ?? detectedType.projectType;
  const baseProfiles = projectType === "fullstack"
    ? ["core", "frontend", "backend", "fullstack"]
    : projectType === "mixed" || projectType === "unknown"
      ? ["core"]
      : ["core", projectType];
  const activeProfiles = [...new Set([...baseProfiles, ...explicitProfiles.filter((profile) => profile !== "core")])];
  const profileReviewItems = explicitProfiles
    .filter((profile) => !KNOWN_PROFILES.has(profile))
    .map((profile) => `Explicit profile '${profile}' is not a known profile.`);
  const typeReviewItems = explicitType && explicitType !== detectedType.projectType
    ? [`Explicit type '${explicitType}' differs from detected '${detectedType.projectType}'.`]
    : [];

  return {
    projectType,
    projectName: normalizeProjectName(packageJson?.name, cwd),
    ecosystems,
    primaryManifest: primaryManifest ?? "package.json",
    confidence: explicitType ? "explicit" : detectedType.confidence,
    activeProfiles,
    signals,
    reviewItems: [...typeReviewItems, ...profileReviewItems]
  };
}

async function detectNonNodeEcosystems(cwd) {
  const found = [];

  const python = await readFirstManifest(cwd, ["pyproject.toml", "requirements.txt", "setup.py", "setup.cfg", "Pipfile"]);
  if (python) {
    const role = /\b(django|fastapi|flask|starlette|aiohttp|sanic|tornado|quart)\b/i.test(python.content) ? "backend" : "library";
    found.push({ ecosystem: "python", path: python.name, reason: `Python manifest detected (${python.name})`, role });
  }

  const go = await readFirstManifest(cwd, ["go.mod"]);
  if (go) {
    const role = /(gin-gonic\/gin|labstack\/echo|gofiber\/fiber|go-chi\/chi|gorilla\/mux|beego|revel)/i.test(go.content) ? "backend" : "library";
    found.push({ ecosystem: "go", path: "go.mod", reason: "Go module detected (go.mod)", role });
  }

  const rust = await readFirstManifest(cwd, ["Cargo.toml"]);
  if (rust) {
    const role = /\b(actix-web|axum|rocket|warp|tide|poem|salvo)\b/i.test(rust.content) ? "backend" : "library";
    found.push({ ecosystem: "rust", path: "Cargo.toml", reason: "Rust crate detected (Cargo.toml)", role });
  }

  const jvm = await readFirstManifest(cwd, ["pom.xml", "build.gradle", "build.gradle.kts"]);
  if (jvm) {
    const role = /(spring-boot|spring-web|javax\.servlet|jakarta\.servlet|micronaut|quarkus|dropwizard)/i.test(jvm.content) ? "backend" : "library";
    found.push({ ecosystem: "jvm", path: jvm.name, reason: `JVM build file detected (${jvm.name})`, role });
  }

  const php = await readFirstManifest(cwd, ["composer.json"]);
  if (php) {
    const role = /(laravel\/framework|laravel\/lumen|symfony\/(?:framework-bundle|http-foundation|http-kernel)|slim\/slim|laminas\/|cakephp\/|yiisoft\/|codeigniter4\/)/i.test(php.content) ? "backend" : "library";
    found.push({ ecosystem: "php", path: "composer.json", reason: "PHP manifest detected (composer.json)", role });
  }

  const ruby = await readFirstManifest(cwd, ["Gemfile", "gems.rb"]);
  if (ruby) {
    const role = /\bgem\s+["'](rails|sinatra|rack|hanami|roda|grape|padrino)["']/i.test(ruby.content) ? "backend" : "library";
    found.push({ ecosystem: "ruby", path: ruby.name, reason: `Ruby manifest detected (${ruby.name})`, role });
  }

  const dotnet = await findProjectByExtension(cwd, [".csproj", ".fsproj"]);
  if (dotnet) {
    const role = /(Sdk\s*=\s*"Microsoft\.NET\.Sdk\.Web"|Microsoft\.AspNetCore)/i.test(dotnet.content) ? "backend" : "library";
    found.push({ ecosystem: "dotnet", path: dotnet.name, reason: `.NET project detected (${dotnet.name})`, role });
  }

  return found;
}

// Find the first *.csproj / *.fsproj since .NET project files carry arbitrary
// names and commonly sit under src/<Name>/. Bounded, deterministic (files
// before subdirs, each sorted), depth-limited DFS skipping heavy dirs.
// Best-effort: unreadable directories are skipped.
const DOTNET_SKIP_DIRS = new Set(["node_modules", ".git", "dist", "bin", "obj", "packages", ".vs"]);

async function findProjectByExtension(cwd, extensions, maxDepth = 3) {
  const search = async (dir, depth) => {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    const sorted = [...entries].sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of sorted) {
      if (entry.isFile() && extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
        return path.join(dir, entry.name);
      }
    }
    if (depth >= maxDepth) return null;
    for (const entry of sorted) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && !DOTNET_SKIP_DIRS.has(entry.name)) {
        const hit = await search(path.join(dir, entry.name), depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  };

  const absHit = await search(cwd, 0);
  if (!absHit) return null;
  const relName = path.relative(cwd, absHit).split(path.sep).join("/");
  try {
    return { name: relName, content: await readUtf8(absHit) };
  } catch {
    return { name: relName, content: "" };
  }
}

async function readFirstManifest(cwd, names) {
  for (const name of names) {
    const filePath = path.join(cwd, name);
    if (await pathExists(filePath)) {
      try {
        return { name, content: await readUtf8(filePath) };
      } catch {
        return { name, content: "" };
      }
    }
  }
  return null;
}

function normalizeProjectName(name, cwd) {
  if (typeof name === "string" && name.trim()) {
    return name.trim().replace(/^@[^/]+\//, "");
  }
  return path.basename(cwd) || "project";
}

function decideType(frontendSignals, backendSignals, librarySignals, signals) {
  const hasFrontend = frontendSignals.length > 0 || signals.some((signal) => signal.path === "src/components");
  const hasBackend = backendSignals.length > 0;
  const hasLibrary = librarySignals.length > 0;

  if (hasFrontend && hasBackend) return { projectType: "fullstack", confidence: "medium" };
  if (hasFrontend) return { projectType: "frontend", confidence: "high" };
  if (hasBackend) return { projectType: "backend", confidence: "medium" };
  if (hasLibrary) return { projectType: "library", confidence: "medium" };
  return { projectType: "unknown", confidence: "low" };
}
