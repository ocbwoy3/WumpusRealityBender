import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import type { Guild, GuildMember } from "discord.js-selfbot-v13";
import { SelfbotClient } from "selfbot";
import { search } from "fast-fuzzy";

// Cache for guilds and owners
let owners: Map<string, GuildMember> = new Map();
let allGuilds: Guild[] = [];
let isDataFetched = false;
let fetchPromise: Promise<void> | null = null;

// Fuzzy search options
const FUZZY_OPTIONS = {
	threshold: 0.5,
	ignoreCase: true,
	ignoreSymbols: true,
	returnMatchData: true
};

// Fetch guilds and owners only once and cache them
async function fetchGuildsAndOwners() {
	if (fetchPromise) return fetchPromise;

	fetchPromise = (async () => {
		try {
			await SelfbotClient.guilds.fetch({
				limit: 200
			});

			allGuilds = Array.from(SelfbotClient.guilds.cache.values());

			// Fetch all owners in parallel
			const ownerPromises = allGuilds.map(async (guild) => {
				try {
					const owner = await guild.fetchOwner();
					return [guild.id, owner] as [string, GuildMember];
				} catch (error) {
					console.error(
						`Failed to fetch owner for guild ${guild.id}:`,
						error
					);
					return null;
				}
			});

			const ownerEntries = (await Promise.all(ownerPromises)).filter(
				(entry) => entry !== null
			) as [string, GuildMember][];
			owners = new Map(ownerEntries);

			isDataFetched = true;
		} catch (error) {
			console.error("Error fetching guilds and owners:", error);
			fetchPromise = null;
		}
	})();

	return fetchPromise;
}

export class AutocompleteHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete
		});
	}

	public override async run(
		interaction: AutocompleteInteraction,
		result: InteractionHandler.ParseResult<this>
	) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// Ensure data is fetched before processing
		if (!isDataFetched) {
			await fetchGuildsAndOwners();
		}

		const focusedOption = interaction.options.getFocused(true);

		switch (focusedOption.name) {
			case "guild": {
				const query = focusedOption.value as string;
				if (!query) {
					// Return first 25 guilds if no query
					return this.some(
						allGuilds.slice(0, 25).map((guild) => ({
							name: guild.name,
							value: guild.id
						}))
					);
				}

				// Split the query by spaces to get individual parts
				const queryParts = query.split(" ");

				// Track if we need to show owner names in results
				let matchingOwners = false;

				// Prepare guild data for fuzzy search
				const guildMatches = new Map<Guild, number>();

				// Process each query part
				for (const part of queryParts) {
					if (part.startsWith(".")) {
						// This is an owner query
						matchingOwners = true;
						const ownerQuery = part.slice(1);

						if (!ownerQuery) continue;

						// Create a map of guild IDs to owner usernames for fuzzy search
						const ownerSearchData = Array.from(
							owners.entries()
						).map(([guildId, member]) => ({
							guildId,
							username: member.user.username,
							displayname: member.user.displayName
						}));

						// Perform fuzzy search on owner usernames
						const ownerMatches = search(
							ownerQuery,
							ownerSearchData,
							{
								...FUZZY_OPTIONS,
								keySelector: (item) => `${item.username} ${item.displayname}`,
								returnMatchData: true
							}
						);

						// Add matching guilds to our results with their scores
						for (const match of ownerMatches) {
							const guild = allGuilds.find(
								(g) => g.id === match.item.guildId
							);
							if (guild) {
								const currentScore =
									guildMatches.get(guild) || 0;
								guildMatches.set(
									guild,
									currentScore + match.score
								);
							}
						}
					} else {
						// This is a guild name query
						// Perform fuzzy search on guild names
						const nameMatches = search(part, allGuilds, {
							...FUZZY_OPTIONS,
							keySelector: (guild) => guild.name,
							returnMatchData: true
						});

						// Add matching guilds to our results with their scores
						for (const match of nameMatches) {
							const currentScore =
								guildMatches.get(match.item) || 0;
							guildMatches.set(
								match.item,
								currentScore + match.score
							);
						}
					}
				}

				// Sort matches by score (descending)
				const sortedMatches = Array.from(guildMatches.entries())
					.sort((a, b) => b[1] - a[1])
					.map(([guild]) => guild)
					.slice(0, 25);

				if (matchingOwners) {
					return this.some(
						sortedMatches.map((match) => ({
							name: `${match.name} (Owned by ${
								owners.get(match.id)?.user.displayName || "Unknown"
							})`,
							value: match.id
						}))
					);
				}

				return this.some(
					sortedMatches.map((match) => ({
						name: match.name,
						value: match.id
					}))
				);
			}
			default:
				return this.none();
		}
	}
}
