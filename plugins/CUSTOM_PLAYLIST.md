=== Dokumentasi Distube ===

- Method dari Class Distube:
async createCustomPlaylist(
    songs: (string | Song)[],
    { member, parallel, metadata, name, source, url, thumbnail }: CustomPlaylistOptions = {},
  ): Promise<Playlist> {
    if (!Array.isArray(songs)) throw new DisTubeError("INVALID_TYPE", "Array", songs, "songs");
    if (!songs.length) throw new DisTubeError("EMPTY_ARRAY", "songs");
    const filteredSongs = songs.filter(song => song instanceof Song || isURL(song));
    if (!filteredSongs.length) throw new DisTubeError("NO_VALID_SONG");
    if (member && !isMemberInstance(member)) {
      throw new DisTubeError("INVALID_TYPE", "Discord.Member", member, "options.member");
    }
    let resolvedSongs: Song[];
    if (parallel !== false) {
      const promises = filteredSongs.map((song: string | Song) =>
        this.handler.resolve(song, { member, metadata }).catch(() => undefined),
      );
      resolvedSongs = (await Promise.all(promises)).filter((s): s is Song => s instanceof Song);
    } else {
      resolvedSongs = [];
      for (const song of filteredSongs) {
        const resolved = await this.handler.resolve(song, { member, metadata }).catch(() => undefined);
        if (resolved instanceof Song) resolvedSongs.push(resolved);
      }
    }
    return new Playlist(
      {
        source: source || "custom",
        name,
        url,
        thumbnail: thumbnail || resolvedSongs.find(s => s.thumbnail)?.thumbnail,
        songs: resolvedSongs,
      },
      { member, metadata },
    );
  }

Contoh penggunaan:
client.player.createCustomPlaylist(...);

Catatan: Untuk CustomPlaylistOptions bagian url, thumbnail dll bisa diabaikan dulu.

- Struct Playlist:
import { DisTubeError, formatDuration, isMemberInstance } from "..";
import type { GuildMember } from "discord.js";
import type { PlaylistInfo, ResolveOptions, Song } from "..";

/**
 * Class representing a playlist.
 */
export class Playlist<T = unknown> implements PlaylistInfo {
  /**
   * Playlist source.
   */
  source: string;
  /**
   * Songs in the playlist.
   */
  songs: Song[];
  /**
   * Playlist ID.
   */
  id?: string;
  /**
   * Playlist name.
   */
  name?: string;
  /**
   * Playlist URL.
   */
  url?: string;
  /**
   * Playlist thumbnail.
   */
  thumbnail?: string;
  #metadata!: T;
  #member?: GuildMember;
  /**
   * Create a Playlist
   * @param playlist  - Raw playlist info
   * @param options   - Optional data
   */
  constructor(playlist: PlaylistInfo, { member, metadata }: ResolveOptions<T> = {}) {
    if (!Array.isArray(playlist.songs) || !playlist.songs.length) throw new DisTubeError("EMPTY_PLAYLIST");

    this.source = playlist.source.toLowerCase();
    this.songs = playlist.songs;
    this.name = playlist.name;
    this.id = playlist.id;
    this.url = playlist.url;
    this.thumbnail = playlist.thumbnail;
    this.member = member;
    this.songs.forEach(s => (s.playlist = this));
    this.metadata = metadata as T;
  }

  /**
   * Playlist duration in second.
   */
  get duration() {
    return this.songs.reduce((prev, next) => prev + next.duration, 0);
  }

  /**
   * Formatted duration string `hh:mm:ss`.
   */
  get formattedDuration() {
    return formatDuration(this.duration);
  }

  /**
   * User requested.
   */
  get member() {
    return this.#member;
  }

  set member(member: GuildMember | undefined) {
    if (!isMemberInstance(member)) return;
    this.#member = member;
    this.songs.forEach(s => (s.member = this.member));
  }

  /**
   * User requested.
   */
  get user() {
    return this.member?.user;
  }

  /**
   * Optional metadata that can be used to identify the playlist.
   */
  get metadata() {
    return this.#metadata;
  }

  set metadata(metadata: T) {
    this.#metadata = metadata;
    this.songs.forEach(s => (s.metadata = metadata));
  }

  toString() {
    return `${this.name} (${this.songs.length} songs)`;
  }
}

- Struct Song (Berupa contoh kode yg sudah saya terapkan):
Song({
        source: "youtube-music",
        id: firstResult.videoId,
        name: firstResult.name || "Unknown Title",
        url: `https://music.youtube.com/watch?v=${firstResult.videoId}`,
        thumbnail: firstResult.thumbnails && firstResult.thumbnails.length > 0 
          ? firstResult.thumbnails[firstResult.thumbnails.length - 1].url 
          : null,
        duration: firstResult.duration ? this.convertDurationToSeconds(firstResult.duration) : 0,
        uploader: {
          name: firstResult.artists && firstResult.artists.length > 0 
            ? firstResult.artists.map(artist => artist.name).join(", ") 
            : "Unknown Artist"
        },
        playFromSource: true,
        plugin: this,
        member: options.member || null,
        metadata: options.metadata || null
      }, options)

=== Perintah untuk anda ===
Buatkan agar format playlist yang ditambahkan ke database berupa format sesuai dengan dokumentasi yang saya berikan dan jangan lupa sesuaikan semua proses yang berkaitan/bergantung pada playlist untuk discord bot ini.