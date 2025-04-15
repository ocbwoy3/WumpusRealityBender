import { configDotenv } from "dotenv";
import { startBot } from "./bot";
import figlet from "figlet";
import { startSelfbot } from "./selfbot";
import { loginRoblox } from "./lib/roblox";

console.log(await figlet("ocbwoy3 . dev","Big",a=>"@ocbwoy3.dev"));
console.log(" ");

configDotenv();

await loginRoblox();
await startSelfbot();
await startBot();

