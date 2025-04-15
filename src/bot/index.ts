import {
	ApplicationCommandRegistries,
	RegisterBehavior,
	SapphireClient,
	Events
} from "@sapphire/framework";
import "@sapphire/plugin-subcommands/register";
import { ActivityType, GatewayIntentBits } from "discord.js";
import { GuyBehindScreenError } from "../lib/Errors";
import assert from "node:assert";

import "@sapphire/plugin-hmr/register";

const {
	DefaultWebSocketManagerOptions: { identifyProperties }
} = require("@discordjs/ws");

identifyProperties.browser = "Discord iOS"; // "Discord Embedded";
identifyProperties.device = "linux"; // "Xbox Series X|S";
identifyProperties.os = "linux"; // "Linux";

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
	RegisterBehavior.BulkOverwrite
);

export const BotClient = new SapphireClient({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages
	],
	hmr: {
		enabled: process.env.NODE_ENV === "development"
	},
	loadMessageCommandListeners: true,
	presence: {
		status: "idle",
		activities: [
			{
				name: "Discord",
				type: ActivityType.Listening,
				state: "Wumpus Reality Bender"
			}
		]
	}
});

BotClient.on(Events.ClientReady,()=>{
	assert(BotClient.user);
	console.log(`[DISCORD] Bot - Logged in as ${BotClient.user.username}#${BotClient.user.discriminator} (${BotClient.user.id})`)
});

export async function startBot() {
	try {
		await BotClient.login(process.env.BOT_TOKEN!);
	} catch (x) {
		if (`${x}`.includes("Used disallowed intents")) {
			console.error("Disallowed intents my ass..");
			throw new GuyBehindScreenError("FIX THE FUCKING INTENTS DUDE");
		}
		throw x;
	}
}
