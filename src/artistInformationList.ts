export interface ArtistInformationList {
  [artist: string]: {
    id?: number
    facebook?: string
    twitter?: string
    songs: {
      name: string
      musicVideo?: string
    }[]
  }
}
