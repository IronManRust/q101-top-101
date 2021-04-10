import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'
import { Countdown } from '../types/countdown'

const data = fs.readFileSync(path.resolve(__dirname, 'countdown.json'), 'utf-8')
const source = fs.readFileSync(path.resolve(__dirname, 'index.hbs'), 'utf-8')

const countdown: Countdown = JSON.parse(data)
const template = handlebars.compile(source)
const html = template(countdown)

fs.writeFileSync(path.resolve(__dirname, 'index.html'), html)
