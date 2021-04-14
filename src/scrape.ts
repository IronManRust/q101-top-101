import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { ArtistInformationList } from './artistInformationList'
import { DBArtistList } from './dbArtistList'
import { DBSongsList } from './dbSongsList'
import { Countdown } from '../types/countdown'

const countdown: Countdown = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8'))

const artistInformationList: ArtistInformationList = {
}
for (const year of countdown.years) {
  for (const item of year.items) {
    if (item.artist && item.song) {
      if (item.artist in artistInformationList) {
        if (artistInformationList[item.artist].songs.map((x) => { return x.name }).indexOf(item.song) === -1) {
          artistInformationList[item.artist].songs.push({
            name: item.song
          })
        }
      } else {
        artistInformationList[item.artist] = {
          songs: [{
            name: item.song
          }]
        }
      }
    }
  }
}

const normalizeURL = (url: string | undefined): string | undefined => {
  const domains = [
    'facebook.com',
    'twitter.com',
    'youtube.com',
    'vimeo.com'
  ]
  if (url) {
    for (const domain of domains) {
      if (url.indexOf(domain) !== -1) {
        return `https://www.${url.substr(url.indexOf(domain))}`
      }
    }
  }
  return url
}

const process = async (artistInformationList: ArtistInformationList) => {
  const apiKey = 1 // Public, Low-Volume Key
  const artistNames = Object.keys(artistInformationList).sort()
  await Promise.all(artistNames.map(async (x) => {
    const responseArtist = await axios.get(`https://www.theaudiodb.com/api/v1/json/${apiKey}/search.php?s=${encodeURIComponent(x)}`)
    if (responseArtist.status === 200) {
      console.log(`Artist Response - Success - ${x}`)
      const dbArtistList: DBArtistList = responseArtist.data
      if (dbArtistList.artists && dbArtistList.artists.length === 1) {
        const dbArtist = dbArtistList.artists[0]
        const artistInformation = artistInformationList[x]
        if (x.toUpperCase().trim() === dbArtist.strArtist.toUpperCase().trim()) {
          artistInformation.id = dbArtist.idArtist
          artistInformation.facebook = normalizeURL(dbArtist.strFacebook || undefined)
          artistInformation.twitter = normalizeURL(dbArtist.strTwitter || undefined)
          if (artistInformation.id) {
            const responseSongs = await axios.get(`https://www.theaudiodb.com/api/v1/json/${apiKey}/mvid.php?i=${artistInformation.id}`)
            if (responseSongs.status === 200) {
              console.log(`Songs Response - Success - ${x}`)
              const dbSongsList: DBSongsList = responseSongs.data
              if (dbSongsList.mvids) {
                for (const dbSong of dbSongsList.mvids) {
                  for (const song of artistInformation.songs) {
                    if (song.name.toUpperCase().trim() === dbSong.strTrack.toUpperCase().trim()) {
                      song.musicVideo = normalizeURL(dbSong.strMusicVid || undefined)
                    }
                  }
                }
              }
            } else {
              console.log(`Songs Response - Error - ${x}`)
            }
          }
        }
      }
    } else {
      console.log(`Artist Response - Error - ${x}`)
    }
  }))
  const artistInformationListSorted: ArtistInformationList = {
  }
  for (const artistName of Object.keys(artistInformationList).sort()) {
    artistInformationListSorted[artistName] = {
      id: artistInformationList[artistName].id,
      facebook: artistInformationList[artistName].facebook,
      twitter: artistInformationList[artistName].twitter,
      songs: artistInformationList[artistName].songs.sort((song1, song2) => {
        if (song1.name > song2.name) {
          return 1
        }
        if (song1.name < song2.name) {
          return -1
        }
        return 0
      })
    }
  }
  fs.writeFileSync(path.resolve(__dirname, 'artists.json'), JSON.stringify(artistInformationListSorted, null, 2), 'utf-8')
}

process(artistInformationList)
