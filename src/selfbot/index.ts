import { Client, SpotifyRPC } from "discord.js-selfbot-v13";
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

SelfbotClient.on("ready", async () => {
	assert(SelfbotClient.user);
	console.log(
		`[DISCORD] Selfbot - Logged in as ${SelfbotClient.user.displayName} (${SelfbotClient.user.username})`
	);

	const _spotify = new SpotifyRPC(SelfbotClient)
		.setAssetsLargeImage("spotify:ab67616d00001e021ea0c62b2339cbf493a999ad")
		.setAssetsSmallImage("spotify:ab6761610000f17839ba6dcd4355c03de0b50918")
		.setArtistIds(
			"2YZyLoL8N0Wb9xBt1NhZWg",
		)
		.setAssetsLargeText("Not Like Us - Single")
		.setAssetsSmallText("Kendrick Lamar")
		.setDetails("Not Like Us")
		.setState("Kendrick Lamar")
		.setSongId("6AI3ezQ4o3HUoP6Dhudph3")
		.setAlbumId("5JjnoGJyOxfSZUZtk2rRwZ")
		.setStartTimestamp(Date.now())
		.setEndTimestamp(8640000000000);

	// SelfbotClient.user.setPresence({
	// 	activities: [_spotify]
	// });

	// SelfbotClient.user.setSamsungActivity("com.YostarJP.BlueArchive", "STOP")
});

export async function startSelfbot() {
	await SelfbotClient.login(process.env.USER_TOKEN!);
}
