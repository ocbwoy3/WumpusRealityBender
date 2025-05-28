import { Subcommand } from "@sapphire/plugin-subcommands";
import { $, Transpiler } from "bun";
import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	TextDisplayBuilder
} from "discord.js";
import { RelationshipManager } from "discord.js-selfbot-v13";
import { getAuthenticatedUser } from "noblox.js";
import { SelfbotClient } from "selfbot";
import { execSync } from "child_process";
import { getNowPlaying } from "@/cider";

export class UserCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,

			name: "cider",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "nowplaying",
					chatInputRun: "chatInputNowPlaying"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("cider")
				.setDescription("Apple Music commands")
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
						.setName("nowplaying")
						.setDescription(
							"Tells you what you're listening to"
						)
						.addBooleanOption((a) =>
							a
								.setName("ephemeral")
								.setDescription(
									"Determines if the message should be ephemeral. (Default = true)"
								)
						)
				)
		);
	}

	public async chatInputNowPlaying(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});
		try {
			const music = await getNowPlaying();
			return interaction
				.followUp({
					content: !music ? "Can't fetch :(" : [
						`> **${music.name}** by ${music.artistName}`,
						`> ${music.inFavorites ? "[inFavourites] " : ""}${music.inLibrary ? "[inLibrary] " : ""}[${music.albumName}](${music.artwork.url})`,
						`> ${music.url}`
					].join("\n")
				})
				.catch((a) => {});
		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}

	public async chatInputEvaluateBash(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});
		try {
			const result = execSync(
				interaction.options.getString("code", true),
				{ encoding: "utf-8" }
			);
			const exitCode = 0; // execSync throws an error if the command fails, so assume success
			const stdout = result;
			const stderr = ""; // No stderr is captured with execSync unless an error is thrown

			const container = new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent("```\n" + stdout + "\n```")
			);

			return interaction
				.followUp({
					components: [container],
					flags: [MessageFlags.IsComponentsV2],
					allowedMentions: {
						users: [],
						roles: [],
						parse: [],
						repliedUser: false
					}
				})
				.catch((a) => {});
		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}

	public async chatInputEvaluateJavascript(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});

		let code = interaction.options.getString("code", true);

		const lang = (interaction.options.getString("language", false) ||
			"ts") as "js" | "ts";

		if (lang === "ts") {
			code = new Transpiler({ target: "node" }).transformSync(code);
		}

		try {
			const retval = await eval(code);

			const container = new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					"```\n" + `${retval}` + "\n```"
				)
			);

			return interaction
				.followUp({
					components: [container],
					flags: [MessageFlags.IsComponentsV2],
					allowedMentions: {
						users: [],
						roles: [],
						parse: [],
						repliedUser: false
					}
				})
				.catch((a) => {});
		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}

	public async chatInputExportDiscordFriends(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});
		try {
			const friends = (
				(await SelfbotClient.relationships.fetch(undefined, {
					cache: true,
					force: false
				})) as RelationshipManager
			)
				.toJSON()
				.filter((a) => (a.type as any) === "FRIEND")
				.map((a) => ({ id: a.id, friendsSince: a.since }));
			return interaction
				.followUp({
					files: [
						new AttachmentBuilder(
							Buffer.from(JSON.stringify(friends)),
							{ name: "friends.json" }
						)
					]
				})
				.catch((a) => {});
		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}
}
