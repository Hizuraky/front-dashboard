import {
  existsSync,
  renameSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiPath = join(__dirname, "../src/app/api");
const tempApiPath = join(__dirname, "../src/app/_api");
const outDir = join(__dirname, "../out");

async function buildExtension() {
  console.log("🚀 Starting extension build...");

  let isApiRenamed = false;

  // 1. Rename api to _api
  if (existsSync(apiPath)) {
    console.log("📦 Renaming api folder to _api...");
    renameSync(apiPath, tempApiPath);
    isApiRenamed = true;
  } else if (!existsSync(tempApiPath)) {
    console.error("❌ API folder not found!");
    process.exit(1);
  } else {
    console.log("⚠️ API folder already renamed (or missing), proceeding...");
  }

  try {
    // 2. Build
    console.log("🛠 Building Next.js project...");
    execSync("IS_EXPORT=true npx next build", {
      stdio: "inherit",
      env: { ...process.env, IS_EXPORT: "true" },
    });

    // 3. Rename _next to next (Chrome extension forbids _ prefix)
    console.log("🔄 Renaming _next to next...");
    const nextDir = join(outDir, "_next");
    const newNextDir = join(outDir, "next");

    if (existsSync(nextDir)) {
      renameSync(nextDir, newNextDir);
    }

    // 4. Update references in HTML files
    console.log("📝 Updating HTML references...");

    function updateHtmlReferences(dir) {
      const files = readdirSync(dir);

      for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          updateHtmlReferences(filePath);
        } else if (
          file.endsWith(".html") ||
          file.endsWith(".js") ||
          file.endsWith(".css")
        ) {
          let content = readFileSync(filePath, "utf-8");
          // Replace /_next/ with /next/
          const newContent = content.replace(/\/_next\//g, "/next/");

          if (content !== newContent) {
            writeFileSync(filePath, newContent);
          }
        }
      }
    }

    updateHtmlReferences(outDir);

    // 4.5 Update manifest.json references
    console.log("📝 Updating manifest.json...");
    const manifestPath = join(outDir, "manifest.json");
    if (existsSync(manifestPath)) {
      let manifest = readFileSync(manifestPath, "utf-8");
      manifest = manifest.replace(/_next/g, "next");

      // 5. Extract inline scripts to external files
      console.log("� Extracting inline scripts...");

      function extractInlineScripts(dir) {
        const files = readdirSync(dir);
        for (const file of files) {
          const filePath = join(dir, file);
          const stat = statSync(filePath);

          if (stat.isDirectory()) {
            extractInlineScripts(filePath);
          } else if (file.endsWith(".html")) {
            let content = readFileSync(filePath, "utf-8");
            let hasChanges = false;

            // Regex to find script tags
            // Capture groups: 1=attributes, 2=content
            const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

            content = content.replace(
              scriptRegex,
              (match, attrs, scriptContent) => {
                // Check if it's a JSON script or has src
                if (
                  attrs.includes('type="application/json"') ||
                  attrs.includes("src=")
                ) {
                  return match;
                }

                if (!scriptContent.trim()) {
                  return match;
                }

                // Generate unique filename based on hash
                const hash = createHash("sha256")
                  .update(scriptContent)
                  .digest("hex")
                  .substring(0, 16);

                const scriptFilename = `script-${hash}.js`;
                const scriptPath = join(outDir, scriptFilename);

                // Write external file
                writeFileSync(scriptPath, scriptContent);

                hasChanges = true;
                console.log(`   Extracted inline script to ${scriptFilename}`);

                return `<script src="/${scriptFilename}"></script>`;
              }
            );

            if (hasChanges) {
              writeFileSync(filePath, content);
            }
          }
        }
      }

      extractInlineScripts(outDir);

      // 6 Clean up manifest (remove any previous CSP mess if exists) or ensure it's clean
      writeFileSync(manifestPath, manifest);
    }

    // 7. Clean up other _* files
    console.log("🧹 Cleaning up other reserved filenames...");
    if (existsSync(outDir)) {
      const files = readdirSync(outDir);
      for (const file of files) {
        if (file.startsWith("_")) {
          rmSync(join(outDir, file), { recursive: true, force: true });
          console.log(`   Deleted: ${file}`);
        }
      }
    }

    console.log("✅ Extension build successful!");

    // 8. Restore api folder for Server Build
    if (isApiRenamed && existsSync(tempApiPath)) {
      console.log("🔙 Restoring api folder...");
      renameSync(tempApiPath, apiPath);
      isApiRenamed = false; // Mark as restored
    }

    // 9. Server Build
    console.log("🛠 Building Server (Next.js standard build)...");
    execSync("npx next build", {
      stdio: "inherit",
      env: { ...process.env, IS_EXPORT: "false" },
    });
    console.log("✅ Server build successful!");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
  } finally {
    // 10. Restore api folder if it wasn't restored yet (e.g. error occurred before step 8)
    if (isApiRenamed && existsSync(tempApiPath)) {
      console.log("🔙 Restoring api folder (cleanup)...");
      renameSync(tempApiPath, apiPath);
    }
  }
}

buildExtension();
