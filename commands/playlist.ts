import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { so_validate, sp_validate } from "play-dl";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { SoundcloudPlaylist } from "../structs/SoundcloudPlaylist";
import { SpotifyPlaylist } from "../structs/SpotifyPlaylist";
import { YoutubePlaylist } from "../structs/YoutubePlaylist";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

export default {
  name: "playlist",
  cooldown: 5,
  aliases: ["pl"],
  description: i18n.__("playlist.description"),
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak
  ],
  async execute(message: Message, args: any[]) {
    const { channel } = message.member!.voice;

    const queue = bot.queues.get(message.guild!.id);

    if (!args.length)
      return message.reply(i18n.__mf("playlist.usagesReply", { prefix: bot.prefix })).then(purning);

    if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).then(purning);

    if (!channel.joinable) return message.reply(i18n.__("playlist.missingPermissionConnect")).then(purning);

    if (!channel.permissionsFor(bot.client.user!.id, true)?.has(PermissionsBitField.Flags.Speak)) {
      return message.reply(i18n.__("playlist.missingPermissionSpeak")).then(purning);
    }

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user!.username }))
        .then(purning);

    let playlist;
    const url: string = args[0];

    try {
      if (sp_validate(url) === "playlist" || sp_validate(url) === "album") {
        playlist = await SpotifyPlaylist.from(url);
      } else if (await so_validate(url) === "playlist") {
        playlist = await SoundcloudPlaylist.from(url);
      } else {
        var search = args.join(" ");
        playlist = await YoutubePlaylist.from(url, search);
      }
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).then(purning);
    }

    if (queue) {
      queue.enqueue(...playlist.videos);
    } else {
      const newQueue = new MusicQueue({
        message,
        connection: joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        })
      });

      bot.queues.set(message.guild!.id, newQueue);
      newQueue.enqueue(...playlist.videos);
    }

    message
      .reply({
        content: i18n.__mf("playlist.startedPlaylist"),
      })
      .then(purning);
  }
};
