import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type {
	ApplicationCommandOptionChoiceData,
	AutocompleteInteraction
} from "discord.js";
import { search } from "fast-fuzzy";
import { getAuthenticatedUser, getFriends } from "noblox.js";

// Cache for friends
let friends: Map<string, number> = new Map();
let isDataFetched = false;
let fetchPromise: Promise<void> | null = null;

// Fuzzy search options
const FUZZY_OPTIONS = {
	threshold: 0.5,
	ignoreCase: true,
	ignoreSymbols: true
};

async function fetchRobloxFriends() {
	if (fetchPromise) return fetchPromise;

	fetchPromise = (async () => {
		try {
			const au = await getAuthenticatedUser();
			const friendsG = await getFriends(au.id);

			friends = new Map([
				[`${au.displayName} (@${au.name})`, au.id],
				...friendsG.data.map((a): [string, number] => [
					`${a.displayName} (@${a.name})`,
					a.id
				])
			]);

			isDataFetched = true;
		} catch (error) {
			console.error("Error fetching Roblox friends:", error);
			isDataFetched = false; // Ensure this is reset on failure
		} finally {
			fetchPromise = null; // Reset the promise
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
		return interaction.respond(
			result as readonly ApplicationCommandOptionChoiceData<
				string | number
			>[]
		);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// Ensure data is fetched before processing
		if (!isDataFetched) {
			await fetchRobloxFriends();
		}

		const focusedOption = interaction.options.getFocused(true);

		switch (focusedOption.name) {
			case "roblox_friend": {
				const query = focusedOption.value as string;

				// Perform fuzzy search
				const matches = search(query, Array.from(friends.entries()), {
					...FUZZY_OPTIONS,
					keySelector: ([displayName]) => displayName
				});

				// Map matches to the required format
				const results = matches
					.slice(0, 25) // Limit to top 25 results
					.map(([name, id]) => ({
						name,
						value: id.toString()
					}));

				return this.some(results);
			}
			default:
				return this.none();
		}
	}
}
