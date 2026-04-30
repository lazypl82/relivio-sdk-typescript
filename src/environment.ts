import { existsSync, readFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import process from "node:process";

export interface DeploymentMetadataOptions {
  cwd?: string;
  includeHostname?: boolean;
}

export function collectDeploymentMetadata(
  options: DeploymentMetadataOptions = {},
): Record<string, string> {
  const metadata: Record<string, string> = {
    runtime: "node",
    runtime_version: process.version,
    os_platform: process.platform,
    os_arch: process.arch,
  };

  const packageJson = readNearestPackageJson(options.cwd ?? process.cwd());
  if (packageJson?.name) {
    metadata.package_name = packageJson.name;
  }
  if (packageJson?.version) {
    metadata.package_version = packageJson.version;
  }

  const commitSha = firstEnvValue([
    "RELIVIO_COMMIT_SHA",
    "GITHUB_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "RAILWAY_GIT_COMMIT_SHA",
    "COMMIT_SHA",
    "GIT_SHA",
  ]);
  if (commitSha) {
    metadata.commit_sha = commitSha;
  }

  const imageDigest = firstEnvValue([
    "RELIVIO_IMAGE_DIGEST",
    "IMAGE_DIGEST",
    "CONTAINER_IMAGE_DIGEST",
  ]);
  if (imageDigest) {
    metadata.image_digest = imageDigest;
  }

  const environment = firstEnvValue([
    "RELIVIO_ENV",
    "DEPLOY_ENV",
    "NODE_ENV",
    "ENVIRONMENT",
  ]);
  if (environment) {
    metadata.environment = environment;
  }

  if (options.includeHostname) {
    metadata.hostname = hostname();
  }

  return metadata;
}

function readNearestPackageJson(
  cwd: string,
): { name?: string; version?: string } | null {
  const path = join(cwd, "package.json");
  if (!existsSync(path)) {
    return null;
  }

  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!isJsonObject(raw)) {
      return null;
    }
    return {
      name: typeof raw.name === "string" ? raw.name : undefined,
      version: typeof raw.version === "string" ? raw.version : undefined,
    };
  } catch {
    return null;
  }
}

function firstEnvValue(keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return null;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
