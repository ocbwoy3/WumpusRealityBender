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

export class UserCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "selfbot-debug",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "accounts",
					chatInputRun: "chatInputListAccounts"
				},
				{
					name: "exec",
					chatInputRun: "chatInputEvaluateBash"
				},
				{
					name: "eval",
					chatInputRun: "chatInputEvaluateJavascript"
				},
				{
					name: "export-friends",
					chatInputRun: "chatInputExportDiscordFriends"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("selfbot-debug")
				.setDescription("Selfbot debug commands")
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
						.setName("accounts")
						.setDescription(
							"Lists all accounts connected to Wumpus Reality Bender"
						)
						.addBooleanOption((a) =>
							a
								.setName("ephemeral")
								.setDescription(
									"Determines if the message should be ephemeral. (Default = true)"
								)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("exec")
						.setDescription(
							"Evaluates arbitrary Bash code (DANGEROUS)"
						)
						.addStringOption((a) =>
							a
								.setName("code")
								.setDescription("Bash code to run")
								.setRequired(true)
						)
						.addBooleanOption((a) =>
							a
								.setName("ephemeral")
								.setDescription(
									"Determines if the message should be ephemeral. (Default = true)"
								)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("eval")
						.setDescription(
							"Evaluates arbitrary JavaScript code on the bot's process (DANGEROUS)"
						)
						.addStringOption((a) =>
							a
								.setName("code")
								.setDescription("Code to run")
								.setRequired(true)
						)
						.addBooleanOption((a) =>
							a
								.setName("ephemeral")
								.setDescription(
									"Determines if the message should be ephemeral. (Default = true)"
								)
						)
						.addStringOption((a) =>
							a
								.setName("language")
								.setDescription(
									"If TypeScript, uses Bun's JS transpiler to convert it to JavaScript (Default: TS)"
								)
								.setChoices([
									{ name: "JavaScript", value: "js" },
									{ name: "TypeScript", value: "ts" }
								])
						)
				)
				.addSubcommand((c) =>
					c
						.setName("export-friends")
						.setDescription(
							"Exports ALL of your discord friends to JSON."
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

	public async chatInputListAccounts(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});
		try {
			const robloxAcc = await getAuthenticatedUser();
			return interaction
				.followUp({
					content: [
						`> **Roblox:** [${robloxAcc.displayName} (@${robloxAcc.name})](<https://fxroblox.com/users/${robloxAcc.id}>)`,
						`> **Discord:** <@${SelfbotClient.user!.id}>`
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
