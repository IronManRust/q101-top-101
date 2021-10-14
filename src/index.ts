import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'
import { NormalizedPackageJson } from 'read-pkg'
import { ArtistInformationList } from './artistInformationList'
import { PlaylistItem, PlaylistList } from './playlist'
import { Countdown } from '../types/countdown'

const template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, 'index.hbs'), 'utf-8'))

const countdown: Countdown = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8'))
const artistInformationList: ArtistInformationList = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'artists.json'), 'utf-8'))
for (const artistName of Object.keys(artistInformationList)) {
  const artistInformation = artistInformationList[artistName]
  for (const year of countdown.years) {
    for (const item of year.items) {
      if (item.artist.toUpperCase().trim() === artistName.toUpperCase().trim()) {
        item.facebook = artistInformation.facebook
        item.twitter = artistInformation.twitter
        for (const song of artistInformation.songs) {
          if (item.song.toUpperCase().trim() === song.name.toUpperCase().trim()) {
            item.musicVideoURL = song.musicVideoURL
            item.musicVideoSource = song.musicVideoSource || 'none'
          }
        }
      }
    }
  }
}

const playlistList: PlaylistList = {
  playlistItems: []
}
for (const countdownYear of countdown.years) {
  // Declare PlaylistItem
  const playlistItem: PlaylistItem = {
    year: countdownYear.year,
    sources: []
  }
  // Build Sources - YouTube
  const youtubeIDs: string[] = countdownYear
    .items
    .map((x) => {
      if (x.musicVideoSource === 'youtube' && x.musicVideoURL) {
        return x.musicVideoURL.substring(x.musicVideoURL.indexOf('v=') + 2).substring(0, 11)
      } else {
        return ''
      }
    })
    .filter((x) => {
      return x.length > 0
    })
  while (youtubeIDs.length) {
    const chunk = youtubeIDs.splice(0, 50) // Maximum Chunk Size
    playlistItem.sources.push({
      source: 'youtube',
      songCount: chunk.length,
      url: `https://www.youtube.com/watch_videos?video_ids=${chunk.join(',')}`
    })
  }
  // Build Sources - Vimeo
  playlistItem.sources.push({
    source: 'vimeo',
    songCount: 0,
    url: undefined
  })
  // Build Sources - DailyMotion
  playlistItem.sources.push({
    source: 'dailymotion',
    songCount: 0,
    url: undefined
  })
  // Add PlaylistItem
  playlistList.playlistItems.push(playlistItem)
}

const packageJSON: NormalizedPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
const metadata = {
  name: packageJSON.name,
  website: countdown.website,
  version: packageJSON.version,
  description: packageJSON.description,
  keywords: packageJSON.keywords,
  authorName: packageJSON.author?.name,
  authorEmail: packageJSON.author?.email,
  authorURL: packageJSON.author?.url,
  homepage: packageJSON.homepage,
  copyright: new Date().getFullYear()
}

let positions = 0
for (const year of countdown.years) {
  for (const item of year.items) {
    if (item.artist && item.song) {
      positions += 1
    }
  }
}

let uniqueArtists = 0
let uniqueSongs = 0
let facebook = 0
let twitter = 0
let musicVideo = 0
for (const artistName of Object.keys(artistInformationList)) {
  const artistInformation = artistInformationList[artistName]
  uniqueArtists += 1
  facebook += artistInformation.facebook ? 1 : 0
  twitter += artistInformation.twitter ? 1 : 0
  for (const song of artistInformation.songs) {
    uniqueSongs += 1
    musicVideo += song.musicVideoURL ? 1 : 0
  }
}
const statistics = {
  positions,
  artists: {
    unique: uniqueArtists,
    facebookCount: facebook,
    facebookPercent: Math.round(facebook / uniqueArtists * 100),
    twitterCount: twitter,
    twitterPercent: Math.round(twitter / uniqueArtists * 100)
  },
  songs: {
    unique: uniqueSongs,
    musicVideoCount: musicVideo,
    musicVideoPercent: Math.round(musicVideo / uniqueSongs * 100)
  }
}

const html = template({
  ...countdown,
  ...playlistList,
  ...metadata,
  ...statistics
})

fs.writeFileSync(path.resolve(__dirname, 'index.html'), html)
