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
	ContainerBuilder,
	InteractionContextType,
	MediaGalleryBuilder,
	MessageFlags,
	TextDisplayBuilder
} from "discord.js";
import { Canvas } from "@napi-rs/canvas";
import { SelfbotClient } from "selfbot";
import { AnyChannel } from "discord.js-selfbot-v13";

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
			name: "chart",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "channel-messages",
					chatInputRun: "chatInputChartLastMessages"
				},
				{
					name: "guilds",
					chatInputRun: "chatInputGuildChart"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("chart")
				.setDescription("Charting commands")
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
						.setName("channel-messages")
						.setDescription(
							"Creates a chart of the last 100 messages in the current channel."
						)
						.addBooleanOption((a) =>
							a
								.setName("ephemral")
								.setDescription(
									"Determines if the message should be ephemeral. (Default = true)"
								)
						)
				)
				.addSubcommand((c) =>
					c
						.setName("guilds")
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

	public async chatInputChartLastMessages(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		let eph = interaction.options.getBoolean("ephemral", false);
		if (eph === null) eph = true;
		await interaction.deferReply({
			withResponse: true,
			flags: eph ? [MessageFlags.Ephemeral] : []
		});

		const djsSelfChannel: AnyChannel | null =
			await SelfbotClient.channels.fetch(interaction.channelId);
		if (!djsSelfChannel || !djsSelfChannel.isText()) return;

		const last100Messages = await djsSelfChannel.messages.fetch({
			limit: 100
		});

		let users: { [id: string]: number } = {};

		for (let [_, msg] of last100Messages) {
			if (!users[msg.author.id]) {
				users[msg.author.id] = 0;
			}
			users[msg.author.id]! += 1;
		}

		const x = Object.entries(users).map(([id, msgs]) => ({ id, msgs }));

		// console.log(x.sort((a, b)=> a.m - b.m).reverse().map((a, idx)=>`${idx+1}. ${a.n} - ${a.m}`).join("\n"))

		try {
			const canvas = new Canvas(1920, 1080);
			new Chart(
				canvas as any, // TypeScript needs "as any" here
				{
					type: "doughnut",
					data: {
						datasets: [
							{
								data: x.map((a) => a.msgs),
								backgroundColor: x.map(
									() =>
										`#${Math.floor(Math.random() * 16777215)
											.toString(16)
											.padStart(6, "0")}`
								)
							}
						]
					},
					options: {
						plugins: {
							legend: {
								display: true
							}
						}
					}
				}
			);
			const pngBuffer = await canvas.toBuffer("image/png");

			const g = new MediaGalleryBuilder({
				items: [
					{
						description:
							"Chart of the last 100 members in the channel",
						media: {
							url: "attachment://graph.png"
						}
					}
				]
			});

			const b = new ContainerBuilder()
				.addMediaGalleryComponents(g)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						x
							.sort((a, b) => {
								return a.msgs - b.msgs;
							})
							.reverse()
							.splice(0, 5)
							.map(
								(a) => `<@${a.id}> - ${a.msgs.toLocaleString()}`
							)
							.join("\n")
					)
				);

			return interaction
				.followUp({
					flags: [MessageFlags.IsComponentsV2],
					allowedMentions: {
						parse: [],
						roles: [],
						users: [],
						repliedUser: false
					},
					components: [b],
					files: [
						new AttachmentBuilder(pngBuffer, { name: "graph.png" })
					]
				})
				.catch((a) => console.error(a));
		} catch (x) {
			console.error(x);
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
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

		// console.log(x.sort((a, b)=> a.m - b.m).reverse().map((a, idx)=>`${idx+1}. ${a.n} - ${a.m}`).join("\n"))

		try {
			const canvas = new Canvas(1920, 1080);
			new Chart(
				canvas as any, // TypeScript needs "as any" here
				{
					type: "doughnut",
					data: {
						datasets: [
							{
								data: x.map((a) => a.m),
								backgroundColor: x.map(
									() =>
										`#${Math.floor(Math.random() * 16777215)
											.toString(16)
											.padStart(6, "0")}`
								)
							}
						],
						labels: x.map((a) => a.n)
					},
					options: {
						plugins: {
							legend: {
								display: true
							}
						}
					}
				}
			);
			const pngBuffer = await canvas.toBuffer("image/png");

			const g = new MediaGalleryBuilder({
				items: [
					{
						description:
							"Chart of the member counts of the guilds the current user is in.",
						media: {
							url: "attachment://graph.png"
						}
					}
				]
			});

			const b = new ContainerBuilder()
				.addMediaGalleryComponents(g)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						x
							.sort((a, b) => {
								return a.m - b.m;
							})
							.reverse()
							.splice(0, 5)
							.map((a) => `${a.n} - ${a.m.toLocaleString()}`)
							.join("\n")
					)
				);

			return interaction
				.followUp({
					flags: [MessageFlags.IsComponentsV2],
					allowedMentions: {
						parse: [],
						roles: [],
						users: [],
						repliedUser: false
					},
					components: [b],
					files: [
						new AttachmentBuilder(pngBuffer, { name: "graph.png" })
					]
				})
				.catch((a) => console.error(a));
		} catch (x) {
			console.error(x);
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}
}
