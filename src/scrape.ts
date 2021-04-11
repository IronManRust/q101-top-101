import fs from 'fs'
import path from 'path'
import { Countdown } from '../types/countdown'

// TODO: Scrape https://www.theaudiodb.com/api_guide.php
//       - https://www.theaudiodb.com/api/v1/json/{key}/search.php?s={name}
//       - https://www.theaudiodb.com/api/v1/json/{key}/mvid.php?i={id}

const artistInformation: {
  [artist: string]: {
    id?: number
    website?: string
    facebook?: string
    twitter?: string
    songs: {
      name: string
      musicVideo?: string
    }[]
  }
} = {
}

const countdown: Countdown = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8'))

for (const year of countdown.years) {
  for (const item of year.items) {
    if (item.artist && item.song) {
      if (item.artist in artistInformation) {
        if (artistInformation[item.artist].songs.map((x) => { return x.name }).indexOf(item.song) === -1) {
          artistInformation[item.artist].songs.push({
            name: item.song
          })
        }
      } else {
        artistInformation[item.artist] = {
          songs: [{
            name: item.song
          }]
        }
      }
    }
  }
}

console.log(JSON.stringify(artistInformation)) // TODO: Look Up Optional Data
