import { WRBPluginData } from "@/wrb_core/moduleDataReg";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { sleep } from "bun";
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
import { SelfbotClient } from "selfbot";

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
					name: "spam",
					chatInputRun: "chatInputSpam"
				},
				{
					name: "export_data",
					chatInputRun: "chatInputExportWRBData"
				},
				{
					name: "summon",
					chatInputRun: "chatInputJoinServer"
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
						.setName("spam")
						.setDescription("Spams a message X amount of times")
						.addStringOption((a) =>
							a
								.setName("message")
								.setDescription("Message to spam")
								.setRequired(true)
						)
						.addNumberOption((a) =>
							a
								.setName("x")
								.setMinValue(1)
								.setMaxValue(10)
								.setDescription(
									"Times to sapm the message (Default = 1)"
								)
								.setRequired(false)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("summon")
						.setDescription("Joins a server as the current user")
						.addStringOption((a) =>
							a
								.setName("code")
								.setDescription("Invite code")
								.setRequired(true)
						)
						.addStringOption((a) =>
							a
								.setName("confirm")
								.setDescription("Enter EXACTLY this string to join the server (risky): \"YES, PLEASE!\"")
								.setRequired(false)
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

	public async chatInputSpam(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
			withResponse: true
		});

		const ch = await SelfbotClient.channels.fetch(interaction.channelId);

		if (!ch || !ch.isText()) {
			return await interaction.followUp({
				content: `Cannot get this channel`,
				flags: MessageFlags.Ephemeral
			});
		}

		const message = interaction.options.getString("message", true);
		const times = interaction.options.getNumber("x") ?? 1;

		for (let i = 0; i < times; i++) {
			await ch.send(message);
			await sleep(Math.floor(Math.random() * (125 - 75 + 1)) + 75);
		}

		await interaction.followUp({
			content: `Message sent ${times} time(s).`,
			flags: [MessageFlags.Ephemeral]
		});
	}

	public async chatInputExportWRBData(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemeral", false);
		if (eph === null) eph = true;
		interaction
			.reply({
				flags: eph ? [MessageFlags.Ephemeral] : [],
				files: [
					new AttachmentBuilder(
						Buffer.from(
							JSON.stringify(WRBPluginData.getAllPluginData())
						),
						{ name: "WRBPluginData.json" }
					)
				]
			})
			.catch((a) => console.error(a));
	}

	public async chatInputJoinServer(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
			withResponse: true
		});

		const code = interaction.options.getString("code",true)
		const conf = interaction.options.getString("confirm",false) == "YES, PLEASE!"

		if (!conf) {
			return await interaction.followUp({
				content: `No confirmation!`,
				flags: [MessageFlags.Ephemeral]
			});
		}

		try {
			await SelfbotClient.acceptInvite(code)
		} catch(e_) {
			return await interaction.followUp({
				content: `${e_}`,
				flags: [MessageFlags.Ephemeral]
			});
		}

		return await interaction.followUp({
			content: `Joined the guild!`,
			flags: [MessageFlags.Ephemeral]
		});
	}
}
