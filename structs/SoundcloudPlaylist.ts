import { soundcloud, SoundCloudPlaylist, SoundCloudTrack } from "play-dl";
import { config } from "../utils/config";
import { Song } from "./Song";

export class SoundcloudPlaylist {
  public videos: Song[];

  public constructor(playlist: SoundCloudTrack[]) {

    this.videos = playlist
      .slice(0, config.MAX_PLAYLIST_SIZE - 1)
      .map((track) => {
        return new Song({
          url: track.permalink,
          title: track.name,
          duration: track.durationInMs,
          id: undefined,
        });
      });
  }

  public static async from(url: string = "") {
    let playlist = await soundcloud(url);
    let tracks: SoundCloudTrack[] = [];
    if (playlist.type == "playlist") {
      tracks = await (playlist as SoundCloudPlaylist).all_tracks();
    }
    return new this(tracks);
  }
}
