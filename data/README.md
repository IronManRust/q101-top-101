# Data

* `countdown.json` - This file describes the years of the countdown as well as the artist and song at each position. It is structured based on the `countdown.d.ts` interface which is in turn based on the `countdown.json` JSON Schema file. Any corrections to this file can be made directly.
* `artists.json` - This file contains metadata regarding artists and their songs. It is generated based on queries of [TheAudioDB](https://www.theaudiodb.com "TheAudioDB")'s REST API. Updates to this file should not be made manually and should instead be made upstream with [TheAudioDB](https://www.theaudiodb.com "TheAudioDB"), followed by executing the `scrape` Node package script and replacing this file with the output of that script.
