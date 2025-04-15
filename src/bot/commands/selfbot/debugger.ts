import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";
import { getAuthenticatedUser } from "noblox.js";
import { SelfbotClient } from "selfbot";

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
								.setName("ephemral")
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
			flags: eph ? [ MessageFlags.Ephemeral ] : []
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
}
