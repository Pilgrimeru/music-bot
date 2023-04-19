import { config } from "../utils/config";
import { Song } from "./Song";
import youtube, { Video } from "youtube-sr";
import { bot } from "../index";
import { sp_validate } from "play-dl";
import { parse, Playlist as ParsedPlaylist } from 'spotify-uri';

export class SpotifyPlaylist {
  public videos: Song[];

  public constructor(infos: Video[]) {
    this.videos = infos
      .filter((track) => track.title != undefined)
      .slice(0, config.MAX_PLAYLIST_SIZE - 1)
      .map((track: Video) => {
        return new Song({
          url: track.url,
          title: track.title,
          duration: track.duration,
          id: track.id,
        });
      });
  }

  public static async from(url: string) {
    await bot.spotifyApiConnect();
    const spotifyId = (parse(url) as ParsedPlaylist).id;

    let infos: any[] = [];
    const type = sp_validate(url);

    if (type === "playlist") {
      const result = await bot.spotify.getPlaylistTracks(spotifyId);
      const tracks = result.body.items;
      infos = tracks.map(async (item: any) => {
        let songInfo = await youtube.searchOne(item.track.artists[0].name + " " + item.track.name);
        return songInfo;
      });
    } else if (type == "album") {
      const result = await bot.spotify.getAlbumTracks(spotifyId);
      const tracks = result.body.items;
      infos = tracks.map(async (item: any) => {
        let songInfo = await youtube.searchOne(item.artists[0].name + " " + item.name);
        return songInfo;
      });
    }
    return new this(await Promise.all(infos));
  }
}

