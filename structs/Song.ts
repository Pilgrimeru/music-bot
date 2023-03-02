import { AudioResource, createAudioResource } from "@discordjs/voice";
import youtube from "youtube-sr";
import { stream, yt_validate } from "play-dl";

export interface SongData {
  url: string;
  title: string | undefined;
  duration: number;
  id: string | undefined;
}

export class Song {
  public readonly url: string;
  public readonly title: string | undefined;
  public readonly duration: number;
  public readonly id: string | undefined;

  public constructor({ url, title, duration, id }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.id = id;
  }

  public static async from(url: string = "", search: string = "") {
    let songInfo;

    if (url.startsWith("https") && yt_validate(url) === "video") {
      songInfo = await youtube.getVideo(url);

      return new this({
        url: songInfo.url,
        title: songInfo.title,
        duration: songInfo.duration,
        id: songInfo.id,
      });
    } else {
      songInfo = await youtube.searchOne(search);

      return new this({
        url: songInfo.url,
        title: songInfo.title,
        duration: songInfo.duration,
        id: songInfo.id,
      });
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    let s;
    if (this.url.startsWith("https") && yt_validate(this.url) === "video") {
      try {
        s = await stream(this.url, {
          discordPlayerCompatibility: true,
          htmldata: false,
          precache: 30,
          quality: 0, //Quality number. [ 0 = Lowest, 1 = Medium, 2 = Highest ]
        })

        return createAudioResource(s.stream, {
          metadata: this,
          inputType: s.type,
          inlineVolume: true,
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
}
