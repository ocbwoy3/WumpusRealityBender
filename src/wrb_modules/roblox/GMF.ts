// TODO: Anti for Dandy's World.

import { RobloxError } from "@/Errors";
import { WRBEevntManager } from "@/wrb_core";
import {
	GameRegPluginData,
	WRBPluginData
} from "@/wrb_core/moduleDataReg";
import {
	getAuthenticatedUser,
	getFriends,
	getPresences,
	UserPresence
} from "noblox.js";

// Module which automatically alerts you if any of your Roblox friends decide to play Dandy's World.

const DANDYS_WORLD = [
	16116270224, // Main
	16552821455,
	18984416148
];

WRBEevntManager.on("RobloxLogin", async () => {
	try {
		const user = await getAuthenticatedUser();
		const friends = await getFriends(user.id);

		const BATCH_SIZE = 50; // Configurable batch size for requests
		setInterval(async () => {
			try {
				let p: UserPresence[] = [];
				try {
					// Split friends into batches
					const friendIds = [...friends.data.map((a) => a.id), user.id];
					for (let i = 0; i < friendIds.length; i += BATCH_SIZE) {
						const batch = friendIds.slice(i, i + BATCH_SIZE);
						const batchPresences = (await getPresences(batch))
							.userPresences;
						p = p.concat(batchPresences);
					}
				} catch {
					// roblox's api being dumb
					/*
					throw new RobloxError(
						"Roblox ratelimited the anti Dandy's World requests"
					);
					*/
				}
				WRBPluginData.setPluginData("GMF", {
					stuff: p.filter(a => !!a.gameId && !!a.userId).map(a => {
						return {
							id: a.userId?.toString() || "",
							game: a.gameId?.toString() || "",
							place: a.placeId?.toString() || ""
						};
					})
				});
			} catch (x) {
				console.error(x);
			}
		}, 5000);
	} catch {
		console.error(
			"[WRB] Failed to stupid error"
		);
	}
});

console.log("[INFO] WRB Module Loaded: Game registry thing");
