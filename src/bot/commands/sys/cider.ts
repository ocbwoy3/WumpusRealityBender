import { Subcommand } from "@sapphire/plugin-subcommands";
import { $, Transpiler } from "bun";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder
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
			if (!music) throw "No music playing :("
			// console.log(music);
			return await interaction
				.followUp({
					components: [
						new ContainerBuilder()
							.setAccentColor(0x89b4fa)
							.addSectionComponents(
								new SectionBuilder()
									.setThumbnailAccessory(new ThumbnailBuilder().setURL(music.artwork.url
										.replaceAll("{w}", "420")
										.replaceAll("{h}", "420")
									))
									.addTextDisplayComponents(
										new TextDisplayBuilder()
											.setContent(`# ${music.name}${music.contentRating === "explicit" ? " 🅴" : ""}\nby **${music.artistName}**\n[${music.albumName}](${music.url.replaceAll(/[a-zA-Z0-9\-\_]+\/([0-9]+)\/?\?i=.*$/gi,"-/$1")})\n${music.inFavorites ? "[inFavourites] " : ""}${music.inLibrary ? "[inLibrary] " : ""}`)
									)
								)
								.addActionRowComponents(
									new ActionRowBuilder<ButtonBuilder>()
										.addComponents(
											new ButtonBuilder()
												.setLabel("View on Apple Music")
												.setStyle(ButtonStyle.Link)
												.setURL(music.url)
										)
								)
					],
					flags: [MessageFlags.IsComponentsV2],
				})
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
