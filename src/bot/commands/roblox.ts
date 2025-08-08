import { RobloxError } from "@/Errors";
import { prisma } from "@/prisma";
import { getServerUDMUXDetails } from "@/roblox";
import { getOmniRecommendationsHome } from "@/roblox/omniRecommendations";
import {
	SubdivisionIsoFriendlyNames,
	udmuxGameInfo,
	udmuxSessionId
} from "@/roblox/udmuxTypes";
import { WRBPluginData } from "@/wrb_core/moduleDataReg";
import { TimedDataCache } from "@ocbwoy3/libocbwoy3";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	TextDisplayBuilder
} from "discord.js";
import { search } from "fast-fuzzy";
import {
	getAuthenticatedUser,
	getIdFromUsername,
	getPlaceInfo,
	getPresences,
	getUniverseInfo,
	getUserInfo,
	sendFriendRequest
} from "noblox.js";

const gameNameCache = new TimedDataCache(60_000);
const skidCache = new TimedDataCache(60_000);

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
				},
				{
					name: "udmux",
					async chatInputRun(
						interaction: Subcommand.ChatInputCommandInteraction
					) {
						const friend = interaction.options.getString(
							"roblox_friend",
							true
						);
						await interaction.deferReply({
							// flags: [MessageFlags.Ephemeral],
							withResponse: true
						});
						const skids =
							WRBPluginData.getPluginData("GMF")?.stuff || [];
						const mr = skids.find((a) => a.id === friend);
						if (!mr) {
							return await interaction.followUp({
								content: "can't find plr :(",
								flags: [MessageFlags.Ephemeral]
							});
						}
						try {
							const { jobId, joinScript, message } =
								(await getServerUDMUXDetails(
									mr.place,
									mr.game
								)) as udmuxGameInfo;

							if (!jobId || !joinScript) {
								throw new RobloxError(message);
							}

							const containers = [
								new ContainerBuilder()
									.setAccentColor(0x89b4fa)
									/*
**Server Address:** \`${joinScript.MachineAddress}:${joinScript.ServerPort}\`
												**UDMUX Server Address:** \`${
													!joinScript
														.UdmuxEndpoints[0]
														? "none"
														: `${joinScript.UdmuxEndpoints[0].Address}:${joinScript.UdmuxEndpoints[0].Port}`
												}\`
									*/
									.addTextDisplayComponents(
										new TextDisplayBuilder().setContent(
											`### ${jobId} (${mr.place})
												**Join command (xdg-utils)**
												\`\`\`bash
												xdg-open "roblox://placeId=${mr.place}&jobId=${jobId}"
												\`\`\`
												**Join command (flatpak)**
												\`\`\`bash
												flatpak run org.vinegarhq.Sober "roblox://placeId=${mr.place}&jobId=${jobId}"
												\`\`\`
												**Roblox Data Center ID:** ${joinScript.DataCenterId}
												**Server RCCService Version:** ${joinScript.RccVersion}
												`.replaceAll("\t", "")
										)
									)
							];

							try {
								const lol = JSON.parse(
									joinScript.SessionId
								) as udmuxSessionId;
								const x =
									lol.SubdivisionIso in
									SubdivisionIsoFriendlyNames
										? `${
												SubdivisionIsoFriendlyNames[
													lol.SubdivisionIso as keyof typeof SubdivisionIsoFriendlyNames
												]
										  } - ${lol.SubdivisionIso}`
										: lol.SubdivisionIso;
								containers.push(
									new ContainerBuilder()
										.setAccentColor(0x89b4fa)
										.addTextDisplayComponents(
											new TextDisplayBuilder().setContent(
												`**Client User Real Human Age:** ${
													lol.Age
												}
										**Policy Country ID:** ${lol.PolicyCountryId}
										**Client VC Enabled:** ${lol.IsUserVoiceChatEnabled === true ? "yes" : "no"}
										**Client Face Anim Enabled:** ${
											lol.IsUserAvatarVideoEnabled ===
											true
												? "yes"
												: "no"
										}
										**Game Server Region:** ${lol.GameJoinRegion}`.replaceAll("\t", "")
											)
										)
								);
							} catch {}

							return await interaction.followUp({
								components: containers,
								flags: [
									// MessageFlags.Ephemeral,
									MessageFlags.IsComponentsV2
								]
							});
						} catch (e_) {
							console.error(e_);
							return await interaction.followUp({
								content: `${e_}`,
								// flags: [MessageFlags.Ephemeral]
							});
						}
					}
				},
				{
					name: "whoplayin",
					async chatInputRun(
						interaction: Subcommand.ChatInputCommandInteraction
					) {
						const game = interaction.options.getString(
							"game",
							true
						);
						await interaction.deferReply({
							flags: [MessageFlags.Ephemeral],
							withResponse: true
						});
						const skids =
							WRBPluginData.getPluginData("GMF")?.stuff || [];
						let gameNames: { [name: string]: string } = {};

						for (let skid of skids) {
							try {
								let x = gameNameCache.get(skid.place);
								if (!x) {
									const gi = await getPlaceInfo([
										Number(skid.place)
									]);
									x = gi[0]!.name;
								}
								gameNameCache.set(skid.place, x, 900_000); // 15 min
								gameNames[`${x}`] = skid.place;
							} catch {}
						}

						const FUZZY_OPTIONS = {
							threshold: 0.5,
							ignoreCase: true,
							ignoreSymbols: true,
							returnMatchData: true
						};

						const nameMatches = search(
							game,
							Object.entries(gameNames),
							{
								...FUZZY_OPTIONS,
								keySelector: (gm) => gm[0],
								returnMatchData: true
							}
						);

						if (nameMatches.length === 0) {
							return await interaction.followUp({
								content: "can't find game :(",
								flags: [MessageFlags.Ephemeral]
							});
						}

						let skidsToAdd = [];

						for (let skid of skids.filter(
							(a) => a.place === nameMatches[0]!.item[1]
						)) {
							try {
								let x = skidCache.get(skid.id);
								if (!x) {
									const gi = await getUserInfo(
										Number(skid.id)
									);
									x = `[${gi.displayName} (@${gi.name})](<https://roblox.com/users/${gi.id}>)`;
								}
								skidCache.set(skid.id, x, 900_000); // 15 min
								skidsToAdd.push(x);
							} catch {}
						}

						if (skidsToAdd.length === 0) {
							return await interaction.followUp({
								content: "can't find plrs :(",
								flags: [MessageFlags.Ephemeral]
							});
						}

						await interaction.followUp({
							content:
								`People playing **${
									nameMatches[0]!.item[0]
								}** rn:\n` + skidsToAdd.join("\n"),
							flags: [MessageFlags.Ephemeral]
						});
					}
				},
				{
					name: "jobmonitor",
					chatInputRun: "chatInputJobMonitor"
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
						.setDescription(
							"Sends a friend request to a Robloxian on behalf of you"
						)
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
				.addSubcommand((command) =>
					command
						.setName("whoplayin")
						.setDescription(
							"Fuzzy finds a game your friends are playing, then lists it out"
						)
						.addStringOption((option) =>
							option
								.setName("game")
								.setDescription(
									"The game your friends are playing"
								)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("udmux")
						.setDescription(
							"Gets the UDMUX server details of a current roblox friend"
						)
						.addStringOption((option) =>
							option
								.setName("roblox_friend")
								.setDescription("Your friend to get details of")
								.setAutocomplete(true)
						)
				)
				.addSubcommand((command) =>
					command
						.setName("jobmonitor")
						.setDescription(
							"Check job monitoring status"
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
							}](<https://roblox.com/games/${
								uni?.rootPlaceId
							}>)**.`
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
							}](<https://roblox.com/games/${
								uni?.rootPlaceId
							}>)**.`
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
			const robloxian_n = await getIdFromUsername(user);
			await sendFriendRequest(robloxian_n);

			const authed = await getAuthenticatedUser();

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
						`> ${
							omni.contentMetadata.Game[a.contentId.toString()]!
								.name
						}`
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
						`> ${
							omni.contentMetadata.Game[a.contentId.toString()]!
								.name
						}`
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

		public async chatInputJobMonitor(
		interaction: Subcommand.ChatInputCommandInteraction
	) {
		await interaction.deferReply({
			withResponse: true,
			flags: [MessageFlags.Ephemeral]
		});

		try {
			const pluginData = WRBPluginData.getPluginData("JobMonitor");

			if (!pluginData) {
				return await interaction.followUp({
					content: "❌ Failed to get job monitor plugin data",
					flags: [MessageFlags.Ephemeral]
				});
			}

			return await interaction.followUp({
				content: `🔔 **Job Monitor Status**\n\n` +
					`**Monitoring user:** ${pluginData.targetUserId}\n` +
					`**Is monitoring:** ${pluginData.isMonitoring ? '✅ Yes' : '❌ No'}\n` +
					`**Last known job:** ${pluginData.lastKnownJobId || 'None'}\n\n` +
					`Notifications will be sent to your DM when job changes are detected.`,
				flags: [MessageFlags.Ephemeral]
			});

		} catch (error) {
			return await interaction.followUp({
				content: `❌ Error getting job monitor status: ${error}`,
				flags: [MessageFlags.Ephemeral]
			});
		}
	}
}
