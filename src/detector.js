import path from "node:path";
import { pathExists } from "./files.js";
import { readUtf8 } from "./encoding.js";

const KNOWN_PROFILES = new Set(["frontend", "backend", "fullstack", "library", "mixed", "unknown", "okf-v0.1"]);

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

  return found;
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
