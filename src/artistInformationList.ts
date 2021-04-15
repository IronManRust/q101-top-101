import { Source } from './source'

export interface ArtistInformationList {
  [artist: string]: {
    id?: number
    facebook?: string
    twitter?: string
    songs: {
      name: string
      musicVideoURL?: string
      musicVideoSource?: Source
    }[]
  }
}
