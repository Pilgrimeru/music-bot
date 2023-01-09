import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
import { SpotifyPlaylist } from "../structs/SpotifyPlaylist";
import { i18n } from "../utils/i18n";
import { sp_validate } from "play-dl";
const { parse } = require('spotify-uri');

export default {
  name: "playlist",
  cooldown: 5,
  aliases: ["pl"],
  description: i18n.__("playlist.description"),
  permissions: ["CONNECT", "SPEAK"],
  async execute(message: Message, args: any[]) {
    const { channel } = message.member!.voice;

    const queue = bot.queues.get(message.guild!.id);

    if (!args.length)
      return message.reply(i18n.__mf("playlist.usagesReply", { prefix: bot.prefix })).catch(console.error);

    if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).catch(console.error);

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user!.username }))
        .catch(console.error);

    let playlist;
    const url = args[0];

    if (sp_validate(url) === "playlist" || sp_validate(url) === "album") {
      try {
        await bot.spotifyApiConnect();
        const spotifyId = parse(url).id;

        if (sp_validate(url) === "playlist") {
          const result = await bot.spotify.getPlaylist(spotifyId);
          playlist = await SpotifyPlaylist.from(result.body.tracks.items);
        } else {
          const result = await bot.spotify.getAlbum(spotifyId);
          playlist = await SpotifyPlaylist.from(result.body.tracks.items);
        }        

      } catch (error) {
        console.error(error);
        return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
      }

    } else {
      try {
        var search = args.join(" ");
        playlist = await Playlist.from(url, search);
      } catch (error) {
        console.error(error);
        return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
      }
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
      .then(msg => setTimeout(() => msg.delete(), 10000))
      .catch(console.error);
  }
};
