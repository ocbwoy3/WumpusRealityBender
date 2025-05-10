const ESTONIA = [
	"<:estonia:1370711259695026197>",
	"<:estonia:1370711261792178246>",
	"<:estonia:1370711263419568138>",
	"<:estonia:1370711264741032007>",
	"<:estonia:1370711267060351026>",
	"<:estonia:1370711268633219192>",
	"<:estonia:1370711270390501456>",
	"<:estonia:1370711272018022482>",
	"<:estonia:1370711273263599626>",
	"<:estonia:1370711274530275440>",
	"<:estonia:1370711281325314089>",
	"<:estonia:1370711282877202532>",
	"<:estonia:1370711284311658587>",
	"<:estonia:1370711291018215475>",
	"<:estonia:1370711292385558600>",
	"<:estonia:1370711298899181588>",
	"<:estonia:1370711300589617182>",
	"<:estonia:1370711303047479317>",
	"<:estonia:1370711305186705408>",
	"<:estonia:1370711311377371246>"
];

import { Command } from "@sapphire/framework";
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";
import { SelfbotClient } from "selfbot";

export class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "ESTONIA"
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand((builder) =>
			builder //
				.setName("Estonia")
				.setType(ApplicationCommandType.Message)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		);
	}

	public override async contextMenuRun(
		interaction: Command.ContextMenuCommandInteraction
	) {
		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
			withResponse: true
		});

		try {
			const ch = await SelfbotClient.channels.fetch(interaction.channelId!);
			if (!ch || !ch.isText()) return;
			const msg = await ch.messages.fetch(interaction.targetId)

			for (const emoji of ESTONIA) {
				await msg.react(emoji, true);
				await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 50));
			}
			await interaction.followUp({
				content: "done",
				flags: [ MessageFlags.Ephemeral ]
			})
		} catch {
			await interaction.followUp({
				content: ":(",
				flags: [ MessageFlags.Ephemeral ]
			})
		}
	}
}
