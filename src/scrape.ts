import axios from 'axios'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { ArtistInformationList } from './artistInformationList'
import { Config } from './config'
import { DBArtistList } from './dbArtistList'
import { DBSongsList } from './dbSongsList'
import { Source } from './source'
import { Countdown } from '../types/countdown'

const countdown: Countdown = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8'))

const artistInformationList: ArtistInformationList = {
}
for (const year of countdown.years) {
  for (const item of year.items) {
    if (item.artist && item.song) {
      if (item.artist in artistInformationList) {
        if (artistInformationList[item.artist].songs.map((song) => { return song.name }).indexOf(item.song) === -1) {
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

const filterURL = (url: string | undefined): string | undefined => {
  return url && url !== '1' ? url : undefined
}

const normalizeURL = (url: string | undefined): { value: string | undefined, source: Source } => {
  if (url) {
    const domainsStandardized: { value: string, source: Source }[] = [
      {
        value: 'facebook.com',
        source: 'general'
      },
      {
        value: 'twitter.com',
        source: 'general'
      },
      {
        value: 'youtube.com',
        source: 'youtube'
      },
      {
        value: 'vimeo.com',
        source: 'vimeo'
      },
      {
        value: 'dailymotion.com',
        source: 'dailymotion'
      }
    ]
    for (const domain of domainsStandardized) {
      if (url.indexOf(domain.value) !== -1) {
        return {
          value: `https://www.${url.substr(url.indexOf(domain.value))}`.replace('/#!', ''),
          source: domain.source
        }
      }
    }
    const domainsShortened: { valueShort: string, valueLong: string, source: Source }[] = [
      {
        valueShort: 'youtu.be/',
        valueLong: 'youtube.com/watch?v=',
        source: 'youtube'
      }
    ]
    for (const domain of domainsShortened) {
      if (url.indexOf(domain.valueShort) !== -1) {
        return {
          value: `https://www.${domain.valueLong}${url.substr(url.indexOf(domain.valueShort) + domain.valueShort.length)}`,
          source: domain.source
        }
      }
    }
    console.log(chalk.yellow(`${chalk.bold('URL, Not Normalized:')} ${url}`))
    return {
      value: url,
      source: 'general'
    }
  } else {
    return {
      value: url,
      source: 'none'
    }
  }
}

const process = async (apiKey: string, timeout: number, artistInformationList: ArtistInformationList) => {
  const artistNames = Object.keys(artistInformationList).sort()
  let delay = 0
  const steps: Promise<string>[] = []
  for (const artistName of artistNames) {
    steps.push(new Promise((resolve) => {
      setTimeout(resolve, delay)
    }).then(() => { return artistName }))
    delay += timeout
  }
  await Promise.all(steps.map(async (step) => {
    const artistName = await step
    try {
      const responseArtist = await axios.get(`https://www.theaudiodb.com/api/v1/json/${apiKey}/search.php?s=${encodeURIComponent(artistName)}`)
      if (responseArtist.status === 200) {
        console.log(chalk.green(`${chalk.bold('Artist, Query Success:')} ${artistName}`))
        const dbArtistList: DBArtistList = responseArtist.data
        if (dbArtistList.artists) {
          console.log(chalk.green(`${chalk.bold('Artist, Results:')} ${artistName}`))
          for (const dbArtist of dbArtistList.artists) {
            const artistInformation = artistInformationList[artistName]
            if (artistName.toUpperCase().trim() === dbArtist.strArtist.toUpperCase().trim()) {
              console.log(chalk.green(`${chalk.bold('Artist, Exact Match:')} ${artistName}`))
              artistInformation.id = dbArtist.idArtist
              artistInformation.facebook = normalizeURL(filterURL(dbArtist.strFacebook || undefined)).value
              artistInformation.twitter = normalizeURL(filterURL(dbArtist.strTwitter || undefined)).value
              if (artistInformation.id) {
                console.log(chalk.green(`${chalk.bold('Artist, ID Exists:')} ${artistName}`))
                const responseSongs = await axios.get(`https://www.theaudiodb.com/api/v1/json/${apiKey}/mvid.php?i=${artistInformation.id}`)
                if (responseSongs.status === 200) {
                  console.log(chalk.green(`${chalk.bold('Song, Query Success:')} ${artistName}`))
                  const dbSongsList: DBSongsList = responseSongs.data
                  if (dbSongsList.mvids) {
                    for (const song of artistInformation.songs) {
                      let songFound = false
                      for (const dbSong of dbSongsList.mvids) {
                        if (song.name.toUpperCase().trim() === dbSong.strTrack.toUpperCase().trim()) {
                          songFound = true
                          const normalizedURL = normalizeURL(filterURL(dbSong.strMusicVid || undefined))
                          song.musicVideoURL = normalizedURL.value
                          song.musicVideoSource = normalizedURL.source
                        }
                      }
                      if (songFound) {
                        console.log(chalk.green(`${chalk.bold('Song, Exact Match:')} ${artistName} - ${song.name}`))
                      } else {
                        console.log(chalk.yellow(`${chalk.bold('Song, No Exact Match:')} ${artistName} - ${song.name} ⟷ ${chalk.dim(dbSongsList.mvids.map((mvid) => { return mvid.strTrack })
                          .sort()
                          .join(' | '))}`))
                      }
                    }
                  }
                } else {
                  console.log(chalk.red(`${chalk.bold('Song, Query Error:')} ${artistName}`))
                }
              } else {
                console.log(chalk.yellow(`${chalk.bold('Artist, No ID Exists:')} ${artistName}`))
              }
            } else {
              console.log(chalk.yellow(`${chalk.bold('Artist, No Exact Match:')} ${artistName} ⟷ ${chalk.dim(dbArtist.strArtist)}`))
            }
          }
        } else {
          console.log(chalk.yellow(`${chalk.bold('Artist, No Results:')} ${artistName}`))
        }
      } else {
        console.log(chalk.red(`${chalk.bold('Artist, Query Error:')} ${artistName}`))
      }
    } catch (e) {
      console.log(chalk.red(`${chalk.bold('Network Error:')} ${artistName} - ${JSON.stringify(e)}`))
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

const config: Config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')).config

process(config.apiKey, config.timeout, artistInformationList)
