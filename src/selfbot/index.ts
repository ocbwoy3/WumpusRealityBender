import { Client, RichPresence } from "discord.js-selfbot-v13";
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

SelfbotClient.on("ready", async () => {
	pr(1);
	assert(SelfbotClient.user);
	console.log(
		`[DISCORD] Selfbot - Logged in as ${SelfbotClient.user.displayName} (${SelfbotClient.user.username})`
	);

	// SelfbotClient.user.setSamsungActivity("com.YostarJP.BlueArchive", "STOP")
});

export async function startSelfbot() {
	SelfbotClient.login(process.env.USER_TOKEN!);
	await p;
}
