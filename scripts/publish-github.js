const { execSync } = require("child_process");
const path = require("path");

const REPO_NAME = "sistema-ai-os";
const REPO_DESC = "AI Operating System for the game Sistema";

function getCredentials() {
  const output = execSync("git credential fill", {
    input: "protocol=https\nhost=github.com\n\n",
  }).toString();

  const creds = {};
  for (const line of output.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) creds[line.slice(0, idx)] = line.slice(idx + 1);
  }
  if (!creds.username || !creds.password) {
    throw new Error("GitHub credentials not found. Run git auth login first.");
  }
  return creds;
}

async function main() {
  const creds = getCredentials();
  const authHeader =
    creds.password.startsWith("gho_") || creds.password.startsWith("github_pat_")
      ? `Bearer ${creds.password}`
      : `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}`;

  const check = await fetch(`https://api.github.com/repos/${creds.username}/${REPO_NAME}`, {
    headers: { Authorization: authHeader, Accept: "application/vnd.github+json" },
  });

  if (check.status === 404) {
    const create = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "sistema-ai-os-deploy",
      },
      body: JSON.stringify({
        name: REPO_NAME,
        description: REPO_DESC,
        private: false,
        auto_init: false,
      }),
    });

    if (!create.ok) {
      const err = await create.text();
      throw new Error(`Create repo failed: ${create.status} ${err}`);
    }
    console.log(`Created repository: ${REPO_NAME}`);
  } else if (check.ok) {
    console.log(`Repository already exists: ${REPO_NAME}`);
  } else {
    throw new Error(`Repo check failed: ${check.status}`);
  }

  const repoRoot = path.resolve(__dirname, "..");
  process.chdir(repoRoot);

  const remoteUrl = `https://github.com/${creds.username}/${REPO_NAME}.git`;
  try {
    execSync("git remote remove origin", { stdio: "ignore" });
  } catch {}
  execSync(`git remote add origin ${remoteUrl}`);

  execSync("git push -u origin main", {
    stdio: "inherit",
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_ASKPASS: path.resolve(__dirname, "git-askpass.js"),
      GIT_ASKPASS_USERNAME: creds.username,
      GIT_ASKPASS_PASSWORD: creds.password,
    },
  });

  console.log(`Pushed to https://github.com/${creds.username}/${REPO_NAME}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
