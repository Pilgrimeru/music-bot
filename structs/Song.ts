import { AudioResource, createAudioResource } from "@discordjs/voice";
import { i18n } from "../utils/i18n";
import youtube from "youtube-sr";
import { extractID, sp_validate, yt_validate } from "play-dl";
const play = require('play-dl');

export interface SongData {
  url: string;
  title: string;
  duration: number;
  id: string;
}


export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: number;
  public readonly id: string;

  public constructor({ url, title, duration, id }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.id = id;
  }

  public static async from(url: string = "", search: string = "") {

    let songInfo;
    if(url.startsWith('https') && sp_validate(url) === 'track') {
      let sp_data = await play.spotify(url)
      let result = await play.search(`${sp_data.name}`, {limit: 1})
      songInfo = await play.video_info(result[0].url);
      return new this({
        url: result[0].url,
        title: songInfo.video_details.title,
        duration: songInfo.video_details.durationInSec,
        id: extractID(result[0].url)
      });

    } else if (url.startsWith('https') && yt_validate(url) === 'video') {

      songInfo = await play.video_info(url);

      return new this({
        url: url,
        title: songInfo.video_details.title,
        duration: songInfo.video_details.durationInSec,
        id: extractID(url)
      });
    } else {
      const result = await youtube.searchOne(search);


      url = `https://youtube.com/watch?v=${result.id}`;

      songInfo = await play.video_info(url);

      return new this({
        url: url,
        title: songInfo.video_details.title,
        duration: songInfo.video_details.durationInSec,
        id: extractID(url)
      });
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    
    let source
    if (this.url.startsWith('https') && yt_validate(this.url) === 'video') {
      let info = await play.video_info(this.url)
      const source = await play.stream_from_info(info)
      return createAudioResource(source.stream, { metadata: this, inputType : source.type, inlineVolume: true });
    }
    if (this.url.startsWith('https') && yt_validate(this.url) === 'video') {
      let info = await play.video_info(this.url)
      const source = await play.stream_from_info(info)
      return createAudioResource(source.stream, { metadata: this, inputType : source.type, inlineVolume: true });
    }
    
    if (!source) return;
    
  }

  /*public startMessage() {
    return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }*/
}
