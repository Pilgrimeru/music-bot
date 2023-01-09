import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import {sp_validate, yt_validate } from "play-dl";
const { parse } = require('spotify-uri');

export default {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: i18n.__("play.description"),
  permissions: ["CONNECT", "SPEAK"],
  async execute(message: Message, args: string[]) {
    const { channel } = message.member!.voice;

    if (!channel) return message.reply(i18n.__("play.errorNotChannel")).catch(console.error);

    const queue = bot.queues.get(message.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }))
        .catch(console.error);

    if (!args.length) return message.reply(i18n.__mf("play.usageReply", { prefix: bot.prefix })).catch(console.error);

    const url = args[0];
    var search = args.join(" ");

    const loadingReply = await message.reply(i18n.__mf("common.loading"));

    // Start the playlist if playlist url was provided
    if (yt_validate(url) === "playlist" || sp_validate(url) === "playlist" || sp_validate(url) === "album") {
      await loadingReply.delete();
      return bot.commands.get("playlist")!.execute(message, args);
    }

    let song;
    if (sp_validate(url) === "track") {

      await bot.spotifyApiConnect();

      const trackId = parse(url).id;
      
      await bot.spotify.getTrack(trackId)
      .then(function(data : any) {
        search = data.body.name+" "+data.body.artists[0].name;
      }, function(err : any) {
        console.error(err);
      });
    }

    try {
      song = await Song.from(url, search);
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("common.errorCommand")).catch(console.error);
    } finally {
      await loadingReply.delete();
    }

    if (queue) {
      queue.songs.push(song);
      
      return message
        .reply(i18n.__mf("play.queueAdded", { title: song.title}))
        .then(msg => setTimeout(() => msg.delete(), 10000))
        .catch(console.error);
    }

    const newQueue = new MusicQueue({
      message,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    });
    
    bot.queues.set(message.guild!.id, newQueue);

    newQueue.enqueue(song);
  }
};
