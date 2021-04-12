import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'
import { NormalizedPackageJson } from 'read-pkg'
import { ArtistInformationList } from './artistInformationList'
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
            item.musicVideo = song.musicVideo
          }
        }
      }
    }
  }
}

const packageJSON: NormalizedPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
const metadata = {
  name: packageJSON.name,
  description: packageJSON.description,
  keywords: packageJSON.keywords,
  author: packageJSON.author?.name,
  homepage: packageJSON.homepage
}

const html = template({
  ...countdown,
  ...metadata
})

fs.writeFileSync(path.resolve(__dirname, 'index.html'), html)
