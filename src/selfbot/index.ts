import { Client, RichPresence, TextChannel } from "discord.js-selfbot-v13";
import assert from "node:assert";

// const kurwaSpotify = new SpotifyRPC(SelfbotClient)
// https://open.spotify.com/track/6tbEF9YpayX9uqAA5ezx1j?si=2141537c57a7473f

export const SelfbotClient = new Client({
	ws: {
		properties: {
			os: "Linux",
			browser: "Discord Embedded",
			device: "Xbox Series X|S"
		}
	},
	presence: {
		status: "invisible"
	}
});

let pr: any = (a: any) => {};
const p = new Promise((resolve) => {
	pr = resolve;
});

let userid = "";

SelfbotClient.on("ready", async () => {
	pr(1);
	assert(SelfbotClient.user);
	userid = SelfbotClient.user.id;
	console.log(
		`[DISCORD] Selfbot - Logged in as ${SelfbotClient.user.displayName} (${SelfbotClient.user.username})`
	);

	// SelfbotClient.user.setSamsungActivity("com.YostarJP.BlueArchive", "STOP")
});

const gray = "\x1b[90m";
const yellow = "\x1b[33m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

SelfbotClient.on("messageCreate", async (m) => {
	if (m.mentions.has(userid) || m.author.id === userid) {
		const isPing = m.mentions.has(userid);
		const color = isPing ? yellow : gray;

		const username = `${m.author?.username || "unknown"}#${
			m.author?.discriminator || "0"
		}`;
		const guild = m.guild ? m.guild.name : "";
		const channel = (m.channel as any).name || "unknown";

		console.warn(
			`${color}${bold}${username}${
				reset + color
			} in ${bold}${guild}${guild ? " -> " : ""}${channel}${
				reset + color
			}: ${m.content}${reset}`
		);
	}
});

SelfbotClient.on("messageDelete", async (m) => {
	if (m.mentions.has(userid)) {
		const isPing = m.mentions.has(userid);
		const color = isPing ? yellow : gray;

		const username = `${m.author?.username || "unknown"}#${
			m.author?.discriminator || "0"
		}`;
		const guild = m.guild ? m.guild.name : "";
		const channel = (m.channel as any).name || "unknown";

		console.warn(
			`${color}[Ghostping] ${bold}${username}${
				reset + color
			} in ${bold}${guild}${guild ? " -> " : ""}${channel}${
				reset + color
			}: ${m.content}${reset}`
		);
	}
});

export async function startSelfbot() {
	SelfbotClient.login(process.env.USER_TOKEN!);
	await p;
}
