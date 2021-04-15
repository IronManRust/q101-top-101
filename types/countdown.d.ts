/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Countdown {
  title: string
  years: {
    year: number
    items: {
      position: number
      artist: string
      facebook?: string
      twitter?: string
      song: string
      musicVideoURL?: string
      musicVideoSource?: 'none' | 'general' | 'youtube' | 'vimeo' | 'dailymotion'
    }[]
  }[]
}
