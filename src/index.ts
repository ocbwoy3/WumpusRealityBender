import { configDotenv } from "dotenv";
import { startBot } from "./bot";
import figlet from "figlet";
import { startSelfbot } from "./selfbot";
import { loginRoblox } from "./lib/roblox";
import { Glob } from "bun";
import { WRBEevntManager } from "@/wrb_core";

console.log(await figlet("ocbwoy3 . dev","Big",a=>"@ocbwoy3.dev"));
console.log(" ");

configDotenv();

// Load all WRB modules

const glob = new Glob(`${__dirname}/wrb_modules/**/*.ts`)

for (const file of glob.scanSync()) {
	const module = await import(file);
	if (module && typeof module.default === "function") {
		module.default();
	}
}

await loginRoblox();
WRBEevntManager.emit("RobloxLogin")

await startSelfbot();
WRBEevntManager.emit("SelfbotLogin");

await startBot();
WRBEevntManager.emit("BotLogin");
