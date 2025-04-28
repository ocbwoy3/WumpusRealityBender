import { WRBPluginData } from "@/wrb_core/moduleDataReg";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	LinearScale,
	LineController,
	LineElement,
	PieController,
	PointElement
} from "chart.js";
import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags
} from "discord.js";

Chart.register([
	CategoryScale,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	BarElement,
	BarController,
	PieController,
	ArcElement
]);

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
					name: "autocomplete",
					chatInputRun: "chatInputDebugAutocompletes"
				},
				{
					name: "export_data",
					chatInputRun: "chatInputExportWRBData"
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
						.setName("autocomplete")
						.setDescription("Autocomplete test")
						.addStringOption((a) =>
							a
								.setName("guild")
								.setDescription(
									"Example query: 'ro' fuzzily matches all guilds with 'ro' in their name."
								)
								.setRequired(false)
								.setAutocomplete(true)
						)
						.addStringOption((a) =>
							a
								.setName("roblox_friend")
								.setDescription("Example query: libnixflake")
								.setRequired(false)
								.setAutocomplete(true)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("export_data")
						.setDescription("Export WRBPluginData to JSON.")
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

	public async chatInputDebugAutocompletes(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.reply({
			content: "ok",
			flags: MessageFlags.Ephemeral
		});
	}

	public async chatInputExportWRBData(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		interaction.reply({
			flags: eph ? [MessageFlags.Ephemeral] : [],
			files: [
				new AttachmentBuilder(
					Buffer.from(JSON.stringify(WRBPluginData.getAllPluginData())),
					{ name: "WRBPluginData.json" }
				)
			]
		}).catch(a=>console.error(a))
	}
}
