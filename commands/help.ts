import { EmbedBuilder, Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/tools";

export default {
  name: "help",
  aliases: ["h"],
  description: i18n.__("help.description"),
  execute(message: Message) {
    let commands = bot.commands;

    let helpEmbed = new EmbedBuilder()
      .setTitle(i18n.__mf("help.embedTitle", { botname: message.client.user!.username }))
      .setDescription(i18n.__("help.embedDescription"))
      .setColor("#69adc7");

    commands.forEach((cmd) => {
      helpEmbed.addFields(
        {
          name: `**${bot.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
          value: `${cmd.description}`,
          inline: true
        }
      );
    });

    helpEmbed.setTimestamp();

    return message.reply({ embeds: [helpEmbed] }).then(msg => purning(msg, true));
  }
};