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
import { Canvas } from "@napi-rs/canvas";
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
		let eph = interaction.options.getBoolean("ephemral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});

		const x = Array.from(SelfbotClient.guilds.cache.values()).map((a) => ({
			n: a.name,
			m: a.memberCount
		})); // Ensures cache is iterable and mapped correctly

		try {
			const canvas = new Canvas(1920, 1080);
			new Chart(
				canvas as any, // TypeScript needs "as any" here
				{
					type: "doughnut",
					data: {
						datasets: [
							{
								data: x.map(a => a.m),
								backgroundColor: x.map(() =>
									`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`
								)
							}
						],
						labels: x.map(a => a.n)
					},
					options: {
						plugins: {
							legend: {
								display: true
							}
						}
					},
				}
			);
			const pngBuffer = await canvas.toBuffer("image/png");
			return interaction
				.followUp({
					content: x.sort((a,b)=>{return a.m - b.m}).reverse().splice(0,5).map(a=>`${a.n} - ${a.m.toLocaleString()}`).join("\n"),
					files: [
						new AttachmentBuilder(pngBuffer, { name: "graph.png" })
					]
				})
				.catch((a) => {});
		} catch (x) {
			console.error(x)
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}
}
