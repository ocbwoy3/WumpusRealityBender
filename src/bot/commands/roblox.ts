import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";
import { prisma } from "@/prisma";
import {
	getAuthenticatedUser,
	getIdFromUsername,
	getPresences,
	getUniverseInfo,
	getUserInfo,
	sendFriendRequest
} from "noblox.js";
import { getOmniRecommendationsHome } from "@/roblox/omniRecommendations";

export class UserCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			name: "roblox",
			preconditions: ["OwnerOnly" as any],
			subcommands: [
				{
					name: "status",
					chatInputRun: "chatInputStatus"
				},
				{
					name: "link",
					chatInputRun: "chatInputLink"
				},
				{
					name: "history",
					chatInputRun: "chatInputLastPlayed"
				},
				{
					name: "add_friend",
					chatInputRun: "chatInputSendFriendRequest"
				},
				{
					name: "recommendations",
					chatInputRun:
						"chatInputMakeFunOfRobloxsShittyRecommendations"
				}
			]
		});
	}

	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("rx")
				.setDescription("Roblox commands")
				.setIntegrationTypes(
					ApplicationIntegrationType.UserInstall,
					ApplicationIntegrationType.GuildInstall
				)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.addSubcommand((command) =>
					command
						.setName("status")
						.setDescription("Gets the Roblox status of a user")
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription("User to read the status of")
								.setRequired(true)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("link")
						.setDescription("Links a Discordian to a Robloxian")
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription("The Discordian to link")
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The Roblox to link to (None = unlink)"
								)
								.setRequired(false)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("add_friend")
						.setDescription("Sends a friend request to a Robloxian on behalf of you")
						.addStringOption((option) =>
							option
								.setName("user")
								.setDescription(
									"The Roblox user to add as a friend"
								)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("history")
						.setDescription(
							"Gets the currently logged in user's last 9 played games."
						)
				)
				.addSubcommand((command) =>
					command
						.setName("recommendations")
						.setDescription(
							"Gets top 20 recommended games by Roblox."
						)
				)
		);
	}

	public async chatInputStatus(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: []
		});
		try {
			const user = await prisma.discordUserReg.findFirst({
				where: {
					id: interaction.options.getUser("user", true).id
				}
			});
			if (!user) throw "User not in DB.";
			if (!user.roblox_id)
				throw "User not linked to a Roblox account in the DB.";
			const ui = await getUserInfo(Number(user.roblox_id));
			const pr = (await getPresences([Number(user.roblox_id)]))
				.userPresences[0];
			if (!pr) throw "User not in presences.";
			switch (pr.userPresenceType?.toString()) {
				case "0": {
					return interaction
						.followUp({
							content: `> [${ui.displayName}](https://fxroblox.com/users/${ui.id}) is **offline**.`
						})
						.catch((a) => {});
				}
				case "1": {
					return interaction
						.followUp({
							content: `> [${ui.displayName}](https://fxroblox.com/users/${ui.id}) is **online**.`
						})
						.catch((a) => {});
				}
				case "2": {
					if (!pr.universeId) {
						return interaction
							.followUp({
								content: `> [${ui.displayName}](https://fxroblox.com/users/${ui.id}) is **in-game**.`
							})
							.catch((a) => {});
					}
					const uni = (await getUniverseInfo([pr.universeId!]))[0];
					return interaction
						.followUp({
							content: `> [${
								ui.displayName
							}](https://fxroblox.com/users/${
								ui.id
							}) is playing **[${
								uni?.name || "???"
							}](<https://roblox.com/games/${uni?.rootPlaceId}>)**.`
						})
						.catch((a) => {});
				}
				case "3": {
					if (!pr.universeId) {
						return interaction
							.followUp({
								content: `> [${ui.displayName}](https://fxroblox.com/users/${ui.id}) is in **studio**.`
							})
							.catch((a) => {});
					}
					const uni = (await getUniverseInfo([pr.universeId!]))[0];
					return interaction
						.followUp({
							content: `> [${
								ui.displayName
							}](https://fxroblox.com/users/${
								ui.id
							}) is editing **[${
								uni?.name || "???"
							}](<https://roblox.com/games/${uni?.rootPlaceId}>)**.`
						})
						.catch((a) => {});
				}
				default: {
					return interaction
						.followUp({
							content: `> [${ui.displayName}](https://fxroblox.com/users/${ui.id}) is... Well, we don't know.`
						})
						.catch((a) => {});
				}
			}
		} catch (x) {
			return interaction
				.followUp({
					content: `> ${x}`
				})
				.catch((a) => {});
		}
	}

	public async chatInputLink(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: [MessageFlags.Ephemeral]
		});
		const user = interaction.options.getUser("user", true);
		const robloxian = interaction.options.getString("username", false);
		try {
			const robloxian_n = robloxian
				? (await getIdFromUsername(robloxian)).toString()
				: null;
			await prisma.discordUserReg.upsert({
				where: {
					id: user.id
				},
				create: {
					id: user.id,
					roblox_id: robloxian_n
				},
				update: {
					roblox_id: robloxian_n
				}
			});
			const ui = await getUserInfo(Number(robloxian_n));
			return interaction
				.followUp({
					content: `> Successfully linked <@${user.id}> to [${ui.displayName}](https://fxroblox.com/users/${ui.id})!`
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

	public async chatInputSendFriendRequest(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: []
		});
		const user = interaction.options.getString("user", true);
		try {
			const robloxian_n = await getIdFromUsername(user)
			await sendFriendRequest(robloxian_n)

			const authed = await getAuthenticatedUser()

			const ui = await getUserInfo(robloxian_n);
			return interaction
				.followUp({
					content: `> Successfully sent a friend request to [${ui.displayName}](https://fxroblox.com/users/${ui.id}) on the behalf of [${authed.displayName}](https://fxroblox.com/users/${authed.id})!`
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

	public async chatInputLastPlayed(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: []
		});
		try {
			const omni = await getOmniRecommendationsHome();
			// 100000000: roblox's shit recommendations
			const home = omni.sorts.find((a) => a.topicId === 100000003)!;
			const g: string[] = home.recommendationList
				.splice(0, 9)
				.map(
					(a) =>
						`> ${omni.contentMetadata.Game[a.contentId.toString()]!.name}`
				);
			return interaction
				.followUp({
					content: g.join("\n")
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

	public async chatInputMakeFunOfRobloxsShittyRecommendations(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: []
		});
		try {
			const omni = await getOmniRecommendationsHome();
			// 100000000: roblox's shit recommendations
			const home = omni.sorts.find((a) => a.topicId === 100000000)!;
			const g: string[] = home.recommendationList
				.splice(0, 20)
				.map(
					(a) =>
						`> ${omni.contentMetadata.Game[a.contentId.toString()]!.name}`
				);
			return interaction
				.followUp({
					content: g.join("\n")
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
