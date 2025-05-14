const YTMusic = require("ytmusic-api")
const ytdl = require("@distube/ytdl-core");


async function main() {

const ytmusic = new YTMusic()
await ytmusic.initialize(/* Optional: Custom cookies */)

ytmusic.searchSongs("cari pacar lagi").then(songs => {
	console.log(songs)
	// Get video info

})

ytdl.getBasicInfo(`http://music.youtube.com/watch?v=vatYi8T1K7s`).then(info => {
	console.log(info.videoDetails.title);
});
}

main()