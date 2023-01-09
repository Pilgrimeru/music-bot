import { config } from "../utils/config";
import { Song } from "./Song";
import youtube, { Video } from "youtube-sr";

export class SpotifyPlaylist {
  public videos: Song[];

  public constructor(infos: Video[]) {
    let videos : Song[] = [];

    infos.map((track :Video) => {
      if (track.url != undefined) {
        let song = new Song({
          url: track.url,
          title: track.title,
          duration: track.duration,
          id: track.id,
        });
        videos.push(song);
      } else {
        console.log("A music was not found");
      }

      this.videos = videos.slice(0, config.MAX_PLAYLIST_SIZE - 1);
    });
  }

  public static async from(tracks : []) {
    let infos : any[];
    infos = tracks.map(async (item: any) => {
      if (!item.track){ 
        let songInfo = await youtube.searchOne(item.name+" "+item.artists[0].name);
        return songInfo;
      } else {
        let songInfo = await youtube.searchOne(item.track.name+" "+item.track.artists[0].name);
        return songInfo;
      }
    });
    return new this(await Promise.all(infos));
  }
}

