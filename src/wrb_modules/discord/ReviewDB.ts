// TODO: Anti for Dandy's World.

import { WRBEevntManager } from "@/wrb_core";
import axios from "axios";
import { sleep } from "bun";
import { SelfbotClient } from "selfbot";

import { SHA256 } from "bun";
import { prisma } from "@/prisma";
import { BotClient } from "bot";
import { AttachmentBuilder, FileBuilder } from "discord.js";

// https://reviewdb.mantikafasi.dev/dashboard?query=USERID

type ReviewDBResponse = {
	success: boolean,
	message: string,
	hasNextPage: boolean,
	reviewCount: number,
	reviews: {
		id: number,
		sender: {
			id: number,
			discordID: string,
			username: string,
			profilePhoto: string,
			badges: {
				name: string,
				icon: string,
				redirectURL: string,
				type: number,
				description: string,
			}[]
		},
		comment: string,
		type: number,
		timestamp: number,
		replies: any
	}[]
}

let currentRDBState = (await prisma.reviewDBState.findFirst({
	where: {
		id: "default"
	}
}))?.state || "";

WRBEevntManager.on("SelfbotLogin", async () => {
	try {
		setInterval(async () => {
			await sleep(Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000);
			try {
				const x = await (await fetch(`https://manti.vendicated.dev/api/reviewdb/users/${SelfbotClient.user!.id}/reviews`)).json() as ReviewDBResponse
				const HC = x.reviews.map(({id, sender, comment})=>(SHA256.hash(`${id}/${sender.discordID}/${comment}`).join(" "))).join("\n")
				const finalHash = SHA256.hash(`${x.reviewCount}\n${HC}`).join(" ");
				if (currentRDBState !== finalHash) {
					try {
						(await BotClient.users.createDM(SelfbotClient.user!.id)).send({
							content: `<@!${SelfbotClient.user!.id}>! You have new ReviewDB reviews! View them here: <https://reviewdb.mantikafasi.dev/dashboard?query=${SelfbotClient.user!.id}>`,
							files: [
								new AttachmentBuilder(Buffer.from(x.reviews.map(a=>`${a.sender.username}: ${a.comment}`).join("\n\n")), { name: "reviews.txt" })
							],
						})
					} catch {}
				}
				currentRDBState = finalHash;
				await prisma.reviewDBState.upsert({
					create: {
						id: "default",
						state: finalHash
					},
					update: {
						state: finalHash
					},
					where: {
						id: "default"
					}
				})
			} catch (x) {
				console.error(x);
			}
		}, 60000);
	} catch {
		console.error(
			"[WRB] Failed to stupid error"
		);
	}
});

console.log("[INFO] WRB Module Loaded: ReviewDB");
