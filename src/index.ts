import { configDotenv } from "dotenv";
import { startBot } from "./bot";
import figlet from "figlet";
import { SelfbotClient, startSelfbot } from "./selfbot";
import { loginRoblox } from "./lib/roblox";
import { Glob } from "bun";
import { WRBEevntManager } from "@/wrb_core";

import { setConsoleTitle, libocbwoy3Greet } from "@ocbwoy3/libocbwoy3";
import { _libocbwoy3Version } from "@ocbwoy3/libocbwoy3/dist/constants";
import { getAuthenticatedUser } from "noblox.js";

console.log(await figlet("ocbwoy3 . dev", "Big", (a) => "@ocbwoy3.dev"));
console.log(" ");

libocbwoy3Greet();
setConsoleTitle(`ocbwoy3.dev - Wumpus Reality Bender (libocbwoy3 v${_libocbwoy3Version})`);

(process as any).libocbwoy3 = { version: _libocbwoy3Version }

configDotenv();

// Load all WRB modules

const glob = new Glob(`${__dirname}/wrb_modules/**/*.ts`);

for (const file of glob.scanSync()) {
	const module = await import(file);
	if (module && typeof module.default === "function") {
		module.default();
	}
}

await loginRoblox();
WRBEevntManager.emit("RobloxLogin");

await startSelfbot();
WRBEevntManager.emit("SelfbotLogin");

try {
	const me = await getAuthenticatedUser()
	setConsoleTitle(`ocbwoy3.dev - ${me.displayName} (@${me.name})`);
} catch {}

await startBot();
WRBEevntManager.emit("BotLogin");
