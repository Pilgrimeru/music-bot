import { DeezerAlbum, DeezerPlaylist, SoundCloudPlaylist, SoundCloudTrack, deezer, soundcloud, sp_validate } from "play-dl";
import { Playlist as ParsedPlaylist, parse } from 'spotify-uri';
import youtube, { Video, Playlist as YoutubePlaylist } from "youtube-sr";
import { bot } from "../index";
import { config } from "../utils/config";
import { Song } from "./Song";

interface PlaylistData {
  title: string;
  url: string;
  songs: Song[];
}

export class Playlist {
  public readonly title: string;
  public readonly url: string;
  public readonly songs: Song[];

  public constructor(options: PlaylistData) {
    Object.assign(this, options);
  }

  private static getSongsFromYoutube(playlist: Video[]): Song[] {

    let songs = playlist
      .filter((video) => video.title != undefined && video.title != "Private video" && video.title != "Deleted video")
      .slice(0, config.MAX_PLAYLIST_SIZE - 1)
      .map((video) => {
        return new Song({
          title: video.title!,
          url: `https://youtube.com/watch?v=${video.id}`,
          duration: video.duration,
          thumbnail: video.thumbnail?.url!
        });
      });

    return songs;
  }

  private static getSongsFromSoundCloud(playlist: SoundCloudTrack[]): Song[] {

    let songs = playlist
      .slice(0, config.MAX_PLAYLIST_SIZE - 1)
      .map((track) => {
        return new Song({
          url: track.permalink,
          title: track.name,
          duration: track.durationInMs,
          thumbnail: track.thumbnail,
        });
      });

    return songs;
  }

  public static async fromYoutube(url: string = "", search: string = ""): Promise<Playlist> {
    const urlValid = youtube.isPlaylist(url);

    let playlist: YoutubePlaylist;

    if (urlValid) {
      playlist = await youtube.getPlaylist(url, { fetchAll: true, limit: config.MAX_PLAYLIST_SIZE });
    } else {
      const result = await youtube.searchOne(search, "playlist");
      playlist = await youtube.getPlaylist(result.url!, { fetchAll: true, limit: config.MAX_PLAYLIST_SIZE });
    }
    const songs = Playlist.getSongsFromYoutube(playlist.videos);
    if (!songs.length) throw new Error("Invalid Youtube playlist: " + url);

    return new this({ title: playlist.title!, url: playlist.url!, songs: songs });
  }

  public static async fromSoundcloud(url: string = ""): Promise<Playlist> {
    let playlist = await soundcloud(url);
    if (!playlist) throw new Error("Soundcloud playlist not found: " + url);
    let tracks: SoundCloudTrack[] = [];
    if (playlist.type === "playlist") {
      tracks = await (playlist as SoundCloudPlaylist).all_tracks();
    }
    const songs = Playlist.getSongsFromSoundCloud(tracks);
    if (!songs.length) throw new Error("Invalid Soundcloud playlist: " + url);

    return new this({ title: playlist.name, url: url, songs: songs });
  }

  public static async fromSpotify(url: string): Promise<Playlist> {
    await bot.spotifyApiConnect();
    const spotifyId = (parse(url) as ParsedPlaylist).id;

    let infos: Promise<Video>[] = [];
    const type = sp_validate(url);

    let playlist: any;
    if (type === "playlist") {
      playlist = await bot.spotify.getPlaylist(spotifyId);
      const tracks = playlist.body.tracks.items;
      infos = tracks.map(async (item: any) => {
        return await youtube.searchOne(item.track.artists[0].name + " " + item.track.name);
      });
    } else if (type == "album") {
      playlist = await bot.spotify.getAlbum(spotifyId);
      const tracks = playlist.body.tracks.items;
      infos = tracks.map(async (item: any) => {
        return await youtube.searchOne(item.artists[0].name + " " + item.name);
      });
    }

    const songs = Playlist.getSongsFromYoutube(await Promise.all(infos));
    if (!songs.length) throw new Error("Invalid Spotify playlist: " + url);

    return new this({ title: playlist.body.name, url: url, songs: songs });
  }

  public static async fromDeezer(url: string): Promise<Playlist> {

    let playlist = (await deezer(url).catch(console.error));
    if (!playlist || playlist.type === "track") throw new Error("Deezer playlist not found: " + url);
    playlist = (playlist as DeezerPlaylist | DeezerAlbum);

    let infos: Promise<Video>[] = playlist.tracks.map(async (track) => {
      return await youtube.searchOne(track.artist.name + " " + track.title);
    });
    const songs = Playlist.getSongsFromYoutube(await Promise.all(infos));
    if (!songs.length) throw new Error("Invalid Deezer playlist: " + url);

    return new this({ title: playlist.title, url: playlist.url, songs: songs });
  }
}