import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";

export class UserCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "selfbot",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "guilds-chart",
					chatInputRun: "chatInputGuildChart"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("selfbot")
				.setDescription("Selfbot commands")
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
						.setName("guilds-chart")
						.setDescription(
							"Creates a chart of the guilds the current user is in"
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

	public async chatInputGuildChart(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [ MessageFlags.Ephemeral ] : []
		});
		try {

		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}
}
