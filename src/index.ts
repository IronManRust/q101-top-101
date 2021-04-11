import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'
import { NormalizedPackageJson } from 'read-pkg'
import { Countdown } from '../types/countdown'

const template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, 'index.hbs'), 'utf-8'))

const countdown: Countdown = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8'))

const packageJSON: NormalizedPackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
const metadata = {
  name: packageJSON.name,
  description: packageJSON.description,
  keywords: packageJSON.keywords,
  author: packageJSON.author?.name,
  homepage: packageJSON.homepage
}

// TODO: YouTube / Wikipedia Links
// TODO: Web Hosting

const html = template({
  ...countdown,
  ...metadata
})

fs.writeFileSync(path.resolve(__dirname, 'index.html'), html)
