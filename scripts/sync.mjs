import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DRY_RUN = !!process.env.DRY_RUN;
const maybeDryRunArgs = DRY_RUN ? ["--dry-run"] : [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const README_PATH = path.join(ROOT, "README.md");

function exec(command, args, options = {}) {
  console.log(
    `💻 ${command} ${args
      .map((arg) => (arg.includes(" ") ? JSON.stringify(arg) : arg))
      .join(" ")}`
  );
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

function replaceBetween(content, marker, replacement) {
  const startMarker = `<!-- ${marker}:start -->`;
  const endMarker = `<!-- ${marker}:end -->`;

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  const before = content.slice(0, startIndex + startMarker.length);
  const after = content.slice(endIndex);

  return `${before}${replacement}${after}`;
}

async function downloadToFile(url, path) {
  console.log(`⏳ Downloading ${url}`);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(path, Buffer.from(arrayBuffer));
}

async function fetchLatestVersion() {
  console.log("⏳ Fetching latest SQLite version");
  const response = await fetch("https://sqlite.org/download.html");
  const html = await response.text();
  return html
    .split(/\r?\n/)
    .find(
      (line) =>
        line.startsWith("PRODUCT,") && line.includes("sqlite-amalgamation-")
    )
    .split(",")[1];
}

async function readManifest() {
  console.log(`⏳ Reading manifest.json`);
  return JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
}

async function updateManifest(manifest) {
  console.log(`⏳ Updating manifest.json`);
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

async function updateReadme(manifest) {
  console.log("⏳ Updating README.md");
  let readme = await fs.readFile(README_PATH, "utf8");

  const manifestEntries = Object.entries(manifest);
  if (manifestEntries.length === 0) {
    throw new Error("Manifest is empty; cannot update README.");
  }
  const [latestVersion] = manifestEntries[0];

  const installationMarkdown = `\`\`\`bash
npm install sqlite-source@sqlite-amalgamation-${latestVersion}
\`\`\``;

  readme = replaceBetween(
    readme,
    "installation",
    `\n${installationMarkdown}\n`
  );

  const releasesMarkdown = [
    "| SQLite | npm |",
    "| ------ | --- |",
    ...manifestEntries.map(([version]) => {
      const releaseSlug = version.replaceAll(".", "_");
      const releaseUrl = `https://sqlite.org/releaselog/${releaseSlug}.html`;
      const npmDistTag = `sqlite-amalgamation-${version}`;
      const npmUrl = `https://www.npmjs.com/package/sqlite-source/v/${npmDistTag}`;
      return `| [${version}](${releaseUrl}) | [${npmDistTag}](${npmUrl}) |`;
    }),
  ].join("\n");

  readme = replaceBetween(readme, "releases", `\n${releasesMarkdown}\n`);

  await fs.writeFile(README_PATH, readme);
}

function computeVersionCode(version) {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  const [major, minor, patch] = parts;
  const code = major * 1000000 + minor * 10000 + patch * 100;
  return String(code);
}

async function fetchReleaseMetadata(version) {
  console.log(`⏳ Fetching release metadata for SQLite ${version}`);
  const slug = version.replaceAll(".", "_");
  const url = `https://sqlite.org/releaselog/${slug}.html`;
  const response = await fetch(url);
  const html = await response.text();
  const year = html.match(/On (\d{4})-\d{2}-\d{2}/i)[1];
  const versionCode = computeVersionCode(version);
  const downloadUrl = `https://www.sqlite.org/${year}/sqlite-amalgamation-${versionCode}.zip`;
  return { versionCode, downloadUrl };
}

async function prepareAndPublishPackage(version, isLatestVersion) {
  const { versionCode, downloadUrl } = await fetchReleaseMetadata(version);
  const npmVersion = `0.${versionCode}.0-sqlite-amalgamation`;
  const npmDistTag = `sqlite-amalgamation-${version}`;

  const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sqlite-sync-"));
  const archiveName = `sqlite-amalgamation-${versionCode}`;
  const archivePath = path.join(workRoot, `${archiveName}.zip`);
  const extractPath = path.join(workRoot, `${archiveName}`);
  const packageDir = path.join(workRoot, "package");

  try {
    await downloadToFile(downloadUrl, archivePath);
    console.log(`⏳ Unzipping archive`);
    await fs.mkdir(packageDir, { recursive: true });
    await exec("unzip", [archivePath, "-d", workRoot]);

    console.log(`⏳ Preparing npm package`);

    const files = await fs.readdir(extractPath);

    for (const file of files) {
      const srcPath = path.join(extractPath, file);
      const destPath = path.join(packageDir, file);
      await fs.rename(srcPath, destPath);
    }

    const packageJson = {
      name: "sqlite-source",
      version: npmVersion,
      description: "SQLite amalgamation sources published to npm",
      license: "blessing",
      keywords: ["sqlite"],
      files,
      repository: {
        type: "git",
        url: "git+https://github.com/tensionlabs/sqlite-source.git",
      },
    };

    await fs.writeFile(
      path.join(packageDir, "package.json"),
      `${JSON.stringify(packageJson, null, 2)}\n`
    );

    console.log(`⏳ Publishing npm package`);
    await exec(
      "npm",
      ["publish", ...maybeDryRunArgs, "--provenance", "--tag", npmDistTag],
      {
        cwd: packageDir,
      }
    );

    if (isLatestVersion && !DRY_RUN) {
      console.log(`⏳ Tagging npm package as latest`);
      await exec(
        "npm",
        ["dist-tag", "add", `sqlite-source@${npmVersion}`, "latest"],
        { cwd: packageDir }
      );
    }
    return npmVersion;
  } finally {
    await fs.rm(workRoot, { recursive: true, force: true });

    console.log(`➡️ Published sqlite-source@${npmDistTag}`);
  }
}

async function commitAndPush(publishedVersions) {
  console.log("⏳ Preparing commit");
  await exec("git", ["add", ...maybeDryRunArgs, "manifest.json", "README.md"], {
    cwd: ROOT,
  });
  const message = `Release SQLite ${publishedVersions.join(", ")}`;
  await exec("git", ["commit", ...maybeDryRunArgs, "-m", message], {
    cwd: ROOT,
  });

  console.log("⏳ Pushing commit");
  await exec("git", ["push", ...maybeDryRunArgs, "origin", "HEAD:main"], {
    cwd: ROOT,
  });
}

async function main() {
  console.log("➡️ Begin sync");
  let manifest = await readManifest();
  const latestVersion = await fetchLatestVersion();
  console.log(`➡️ Latest SQLite version: ${latestVersion}`);

  if (!manifest[latestVersion]) {
    manifest = { [latestVersion]: null, ...manifest };
  }

  const publishedVersions = [];

  for (const [version, npmVersion] of Object.entries(manifest).reverse()) {
    if (npmVersion === null) {
      const publishedNpmVersion = await prepareAndPublishPackage(
        version,
        version === latestVersion
      );
      manifest[version] = publishedNpmVersion;
      publishedVersions.push(version);
    }
  }

  if (publishedVersions.length > 0) {
    await updateManifest(manifest);
    await updateReadme(manifest);
    await commitAndPush(publishedVersions);
  } else {
    console.log("➡️ Nothing to publish");
  }

  console.log("✅ Sync complete");
}

await main();
