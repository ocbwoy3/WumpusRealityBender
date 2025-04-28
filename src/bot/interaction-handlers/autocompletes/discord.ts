import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import type { Guild } from "discord.js-selfbot-v13";
import { SelfbotClient } from "selfbot";
import { search } from "fast-fuzzy";

// Cache for guilds
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

// Fetch guilds only once and cache them
async function fetchGuilds() {
	if (fetchPromise) return fetchPromise;

	fetchPromise = (async () => {
		try {
			await SelfbotClient.guilds.fetch({
				limit: 200
			});

			allGuilds = Array.from(SelfbotClient.guilds.cache.values());
			isDataFetched = true;
		} catch (error) {
			console.error("Error fetching guilds:", error);
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
			await fetchGuilds();
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

				// Perform fuzzy search on guild names
				const nameMatches = search(query, allGuilds, {
					...FUZZY_OPTIONS,
					keySelector: (guild) => guild.name,
					returnMatchData: true
				});

				// Sort matches by score (descending) and return top 25
				const sortedMatches = nameMatches
					.sort((a, b) => b.score - a.score)
					.map((match) => match.item)
					.slice(0, 25);

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
