const user = process.env.GIT_ASKPASS_USERNAME || "";
const pass = process.env.GIT_ASKPASS_PASSWORD || "";
const prompt = process.argv.slice(2).join(" ").toLowerCase();

if (prompt.includes("username")) {
  process.stdout.write(user);
} else if (prompt.includes("password")) {
  process.stdout.write(pass);
}
