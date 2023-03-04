import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
import { SpotifyPlaylist } from "../structs/SpotifyPlaylist";
import { i18n } from "../utils/i18n";
import { sp_validate } from "play-dl";
import { purning } from "../utils/pruning";
import { parse, Playlist as ParsedPlaylist } from 'spotify-uri';

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
    const url = args[0];

    try {
      if (sp_validate(url) === "playlist" || sp_validate(url) === "album") {
        await bot.spotifyApiConnect();
        const spotifyId = (parse(url) as ParsedPlaylist).id;

        if (sp_validate(url) === "playlist") {
          const result = await bot.spotify.getPlaylistTracks(spotifyId);
          playlist = await SpotifyPlaylist.from(result.body.items);
        } else {
          const result = await bot.spotify.getAlbumTracks(spotifyId);
          playlist = await SpotifyPlaylist.from(result.body.items);
        }
      } else {
        var search = args.join(" ");
        playlist = await Playlist.from(url, search);
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
