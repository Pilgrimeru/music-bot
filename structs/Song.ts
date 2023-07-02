import { AudioResource, StreamType, createAudioResource } from "@discordjs/voice";
import axios from 'axios';
import { APIEmbed, EmbedBuilder } from "discord.js";
import fetch from 'isomorphic-unfetch';
import { parseStream } from 'music-metadata';
import { DeezerTrack, SoundCloudTrack, deezer, stream as getStream, so_validate, soundcloud, yt_validate } from "play-dl";
import youtube from "youtube-sr";
import { formatTime } from "../utils/tools";
import { i18n } from "../utils/i18n";
const { getPreview } = require('spotify-url-info')(fetch);


export interface SongData {
  url: string;
  title: string | undefined;
  duration: number;
  thumbnail: string | null;
}

export class Song {
  public readonly url: string;
  public readonly title: string | undefined;
  public readonly duration: number;
  public readonly thumbnail: string;

  public constructor(options: SongData) {
    Object.assign(this, options);
  }

  public static async from(url: string, search: string, type: string): Promise<Song> {
    switch (type) {
      case "sp_track":
        return await Song.fromSpotify(url);
      case "so_track":
        return await Song.fromSoundCloud(url);
      case "dz_track":
        return await Song.fromDeezer(url);
      case "audio":
        return await Song.fromExternalLink(url);
      default:
        return await Song.fromYoutube(url, search);
    }
  }

  public static async fromYoutube(url: string = "", search: string = ""): Promise<Song> {
    let songInfo;
    if (url.startsWith("https") && yt_validate(url) === "video") {
      songInfo = await youtube.getVideo(url);
      if (!songInfo)
        throw new Error("Video not found : " + url);

      return new this({
        url: songInfo.url,
        title: songInfo.title,
        duration: songInfo.duration,
        thumbnail: songInfo.thumbnail?.url!,
      });
    } else {
      songInfo = await youtube.searchOne(search);
      if (!songInfo)
        throw new Error("Video not found : " + search);

      return new this({
        url: songInfo.url,
        title: songInfo.title,
        duration: songInfo.duration,
        thumbnail: songInfo.thumbnail?.url!,
      });
    }
  }

  public static async fromSoundCloud(url: string = ""): Promise<Song> {
    let songInfo = (await soundcloud(url) as SoundCloudTrack);
    if (!songInfo || songInfo.type != "track")
      throw new Error("Track not found : " + url);

    return new this({
      url: songInfo.url,
      title: songInfo.name,
      duration: songInfo.durationInMs,
      thumbnail: songInfo.thumbnail,
    });
  }

  public static async fromSpotify(url: string = ""): Promise<Song> {
    let data = await getPreview(url);
    if (data.type !== "track") throw new Error("Track not found : " + url);
    let search = data ? data.artist + " " + data.track : "";
    return await Song.fromYoutube("", search);
  }

  public static async fromDeezer(url: string = ""): Promise<Song> {
    let data = await deezer(url).catch(console.error);
    let track: DeezerTrack | undefined;
    if (data && data.type === "track") {
      track = data as DeezerTrack;
    }
    let search = track ? track.artist.name + " " + track.title : "";
    return await Song.fromYoutube("", search);
  }

  public static async fromExternalLink(url: string = ""): Promise<Song> {
    if (url.startsWith("https") && /\.(mp3|wav|flac|ogg)$/i.test(url)) {

      const name = url.substring(url.lastIndexOf("/") + 1);

      const response = await axios.get(url, {
        responseType: 'stream',
      }).catch(() => null);
      if (!response) throw new Error("Bad link: " + url);

      let duration = (await parseStream(response.data, { mimeType: response.headers["content-type"], size: response.headers["content-length"] })).format.duration;
      duration = duration ? Math.floor(duration) * 1000 : 1;

      return new this({
        url: url,
        title: name,
        duration: duration,
        thumbnail: null,
      });
    }
    throw new Error("Bad link " + url);
  }
  
  public formatedTime() : string {
    if (this.duration == 0) {
      return i18n.__mf("nowplaying.live");
    }
    return formatTime(this.duration);
  }

  public playingEmbed() : EmbedBuilder {
    return new EmbedBuilder({
      title: i18n.__mf("play.startedPlaying"),
      description: `[${this.title}](${this.url})
      ${i18n.__mf("play.duration", " ")}\`${this.formatedTime()}\``,
      thumbnail: {
        url: this.thumbnail
      },
      color: 0x69adc7
    });
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {

    try {
      let stream;
      let type;

      if (this.url.startsWith("https") && (yt_validate(this.url) === "video" || await so_validate(this.url) == "track")) {

        const response = await getStream(this.url, {
          discordPlayerCompatibility: true,
          htmldata: false,
          precache: 30,
          quality: 0, //Quality number. [ 0 = Lowest, 1 = Medium, 2 = Highest ]
        });
        stream = response.stream;
        type = response.type;
      } else {

        const response = await axios.get(this.url, {
          responseType: 'stream',
        });
        stream = response.data;
        type = StreamType.Arbitrary;
      }

      if (!stream) return;

      return createAudioResource(stream, {
        metadata: this,
        inputType: type,
        inlineVolume: true,
      });
    } catch (error) {
      console.error(error);
    }
  }
};