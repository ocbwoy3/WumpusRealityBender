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
	ApplicationIntegrationType, InteractionContextType
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
			subcommands: []
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
						.setDescription(
							"Autocomplete test"
						)
						.addStringOption((a) =>
							a
								.setName("guild")
								.setDescription(
									"Example query: .ocbwoy3 rem - Servers named 'rem' owned by OCbwoy3."
								)
								.setRequired(false)
								.setAutocomplete(true)
						)
				)
		);
	}


}
