import { Source } from './source'

export interface PlaylistSource {
  source: Source
  songCount: number
  url: string | undefined
}

export interface PlaylistItem {
  year: number
  sources: PlaylistSource[]
}

export interface PlaylistList {
  playlistItems: PlaylistItem[]
}
