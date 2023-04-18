import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { YoutubePlaylist } from "../structs/YoutubePlaylist";
import { SpotifyPlaylist } from "../structs/SpotifyPlaylist";
import { i18n } from "../utils/i18n";
import { so_validate, sp_validate } from "play-dl";
import { purning } from "../utils/pruning";
import { SoundcloudPlaylist } from "../structs/SoundcloudPlaylist";

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
      return message.reply(i18n.__mf("playlist.usagesReply", { prefix: bot.prefix })).then(msg => purning(msg));

    if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).then(msg => purning(msg));

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user!.username }))
        .then(msg => purning(msg));

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
      return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).then(msg => purning(msg));
    }

    if (queue) {
      queue.songs.push(...playlist.videos);
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
      .then(msg => purning(msg));
  }
};
