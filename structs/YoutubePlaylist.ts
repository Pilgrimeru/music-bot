import youtube, { Playlist } from "youtube-sr";
import { config } from "../utils/config";
import { Song } from "./Song";

export class YoutubePlaylist {
  public videos: Song[];

  public constructor(playlist: Playlist) {

    this.videos = playlist.videos
      .filter((video) => video.title != "Private video" && video.title != "Deleted video")
      .slice(0, config.MAX_PLAYLIST_SIZE - 1)
      .map((video) => {
        return new Song({
          title: video.title!,
          url: `https://youtube.com/watch?v=${video.id}`,
          duration: video.duration,
          id: `${video.id}`
        });
      });
  }

  public static async from(url: string = "", search: string = "") {
    const urlValid = youtube.isPlaylist(url);

    let playlist;

    if (urlValid) {
      playlist = await youtube.getPlaylist(url, { fetchAll: true, limit: config.MAX_PLAYLIST_SIZE });
    } else {
      const result = await youtube.searchOne(search, "playlist");
      playlist = await youtube.getPlaylist(result.url!, { fetchAll: true, limit: config.MAX_PLAYLIST_SIZE });
    }
    
    return new this(playlist);
  }
}
