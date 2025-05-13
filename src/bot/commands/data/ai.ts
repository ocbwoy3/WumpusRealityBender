import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
} from "discord.js";
import { SelfbotClient } from "selfbot";
import { gemini } from "./ai.lib";
import { HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/genai";
import { randomUUIDv7 } from "bun";

export class UserCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "ai-util",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "tr",
					chatInputRun: "chatInputTranscribeSpeech"
				},
				{
					name: "summary",
					chatInputRun: "chatInputSummarizeConversation"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("self-ai")
				.setDescription("AI utility commands")
				.setIntegrationTypes(
					ApplicationIntegrationType.UserInstall,
					ApplicationIntegrationType.GuildInstall
				)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.addSubcommand((c) =>
					c
						.setName("tr")
						.setDescription(
							"Transcribes your speech into a Discord message (SMART)"
						)
						.addAttachmentOption((a) =>
							a
								.setName("speech")
								.setDescription(
									"A voice/video recording of yourself"
								)
								.setRequired(true)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("summary")
						.setDescription(
							"Summarizes the last 100 messages in the channel"
						)
				)
		);
	}

	public async chatInputTranscribeSpeech(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: [MessageFlags.Ephemeral]
		});

		try {
			const lol: SafetySetting[] = [
				{ category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
				{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
				{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
				{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
				{ category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
			];
			const attachment = interaction.options.getAttachment("speech", true);

			const attachmentresponse = await fetch(attachment.url);
			const raw = await attachmentresponse.arrayBuffer();
			const mimeType = attachmentresponse.headers.get("content-type") || "text/plain";

			const blob = new Blob([raw], { type: mimeType });
			const up = await gemini.files.upload({
				config: {
					displayName: attachment.name,
					name: `${randomUUIDv7()}`,
					mimeType
				},
				file: blob
			});

			let isActive = true;
			let lolz = 0;

			while (isActive) {
				const fileStatus = await gemini.files.get({ name: up.name! });

				if (fileStatus.state === "ACTIVE") {
					isActive = false;
					break;
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));
				lolz += 1
			}

			const userStore: {username: string, nicknames: string[]}[] = [];

			const response = await gemini.models.generateContent({
				model: "gemini-2.0-flash-lite",
				config: {
					safetySettings: lol,
					systemInstruction: `You are to exactly transcribe the given audio or video as it sounds, using Discord markdown formatting. Represent sound effects, vocal outbursts, or expressive noises (like *RAHH*, *HUH*, *crash*, *slam*, *sobbing*, *sniff*) in asterisks. Use double underscores to indicate strong vocal inflection, such as when someone is mimicking a deep voice, performing dramatically, or imitating an accent (e.g., __BEGONE__, __POPE FRANCIS__). If someone is YELLING, write it in ALL CAPS. If someone is \`whisperin\`, lower the case as needed or use formatting to imply softness.

Use dashes (—) to show:
- When someone is interrupted
- When a new speaker suddenly takes over
- When a thought or phrase breaks mid-line

Include all background activity, such as *door creaking*, *glass shattering*, or *footsteps*. You must transcribe everything in a single line, under 2000 characters, without summarizing or attributing speakers. Do not remove chaotic overlaps—embrace them. Do not use emojis. Utilize UserStore and mention users when and if mentioned in speech.

Finish full sentences with punctuation when possible. Be dramatic, raw, and true to the tone—as if transcribing a theatrical performance, horror skit, or intense musical with overlapping voices.
`
				},
				contents: [
					{
						role: "user",
						parts: [
							{
								fileData: {
									mimeType,
									fileUri: up.uri
								}
							}
						]
					}
				],
			});
			await interaction.followUp({
				content: `> uploaded and parsed \`${attachment.name}\` in ${lolz} seconds.`,
				flags: [ MessageFlags.Ephemeral ]
			})
			const ch = await SelfbotClient.channels.fetch(interaction.channelId!)
			if (!ch || !ch.isText()) return;
			await ch.send({
				content: response.text
			})
			await gemini.files.delete({
				name: up.name!
			})
		} catch (e_) {
			console.error(e_)
			await interaction.followUp({
				content: "failed to generate :(",
				flags: [ MessageFlags.Ephemeral ]
			})
		}
	}
}
