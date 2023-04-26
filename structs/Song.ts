import { AudioResource, StreamType, createAudioResource } from "@discordjs/voice";
import axios from 'axios';
import fetch from 'isomorphic-unfetch';
import { parseStream } from 'music-metadata';
import { DeezerTrack, SoundCloudTrack, deezer, stream as getStream, so_validate, soundcloud, yt_validate } from "play-dl";
import youtube from "youtube-sr";
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