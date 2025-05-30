import { Client, RichPresence, TextChannel } from "discord.js-selfbot-v13";
import { message } from "noblox.js";
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

const white = "\x1b[97m";
const yellow = "\x1b[93m";
const red = "\x1b[91m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

SelfbotClient.on("messageCreate", async (m) => {
	if (m.mentions.has(userid) || m.author.id === userid) {
		const isPing = m.mentions.has(userid);
		const color = (isPing || m.author.id === SelfbotClient.user!.id) ? yellow : white;

		const username = `${m.author?.username || "unknown"}#${
			m.author?.discriminator || "0"
		}`;
		const guild = m.guild ? m.guild.name : "";
		const channel = (m.channel as any).name || "unknown";

		console.warn(
			`${color}${bold}${username}${
				reset + color
			} in ${bold}${guild}${guild ? " -> " : ""}#${channel}${
				reset + color
			}: ${m.content}${reset}`
		);
	}
});

SelfbotClient.on("messageDelete", async (m) => {
	if (m.mentions.has(userid)) {
		const isPing = m.mentions.has(userid);
		const color = isPing ? yellow : red;

		const username = `${m.author?.username || "unknown"}#${
			m.author?.discriminator || "0"
		}`;
		const guild = m.guild ? m.guild.name : "";
		const channel = (m.channel as any).name || "unknown";

		console.warn(
			`${color}${isPing ? "[Ghostping] " : ""}${bold}${username}${
				reset + color
			} in ${bold}${guild}${guild ? " -> " : ""}#${channel}${
				reset + color
			}: ${m.content}${reset}`
		);
	}
});

SelfbotClient.on("messageReactionAdd", async (m) => {
	const isMe = (m.message.author && m.message.author.id === SelfbotClient.user!.id) ? true : false;
	if (isMe || m.users.cache.has(SelfbotClient.user!.id)) {
		const r = await m.fetch();
		const md = await m.message.fetch();
		const color = isMe ? yellow : red;

		const emojiR = {
			burstColors: r.burstColors,
			count: r.count,
			countDetails: r.countDetails,
			emoji: {
				animated: r.emoji.animated,
				id: r.emoji.id,
				name: r.emoji.name,
				identifier: r.emoji.identifier
			},
			users: r.users.cache.map(a=>a.id === SelfbotClient.user!.id ? "You" : `${a.displayName}#${a.discriminator}`)
		};

		const username = `${m.message.author?.username || "unknown"}#${
			m.message.author?.discriminator || "0"
		}`;
		const guild = m.message.guild ? m.message.guild.name : "";
		const channel = (m.message.channel as any).name || "unknown";

		const skiddyskidskid = emojiR.users.reverse()[0];

		console.warn(
			`${color + bold}${skiddyskidskid}${reset + color}${
				(emojiR.users.length >= 2 ? ` and ${emojiR.users.length-1} other(s)` : "")
			} reacted ${bold}${emojiR.emoji.name}${reset + color} to ${bold}${md.author.id === SelfbotClient.user!.id ? `${skiddyskidskid === "You" ? "yourself" : "you"}` : username}${
				reset + color
			}, ${bold}${guild}${guild ? " -> " : ""}#${channel}${
				reset + color
			}: ${m.message.content}${reset}`
		);

	}
});

export async function startSelfbot() {
	SelfbotClient.login(process.env.USER_TOKEN!);
	await p;
}
