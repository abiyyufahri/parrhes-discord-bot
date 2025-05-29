const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "clear",
  description: "Clears the music queue.",
  permissions: "0x0000000000000800",
  options: [],
  voiceChannel: true,
  run: async (client, interaction) => {
    const queue = client.player.getQueue(interaction.guild.id);
    let lang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../../../languages/${lang}.js`);
    try {      if (!queue || !queue.playing) return await interaction.reply({ content: `${lang.msg5}`, ephemeral: true }).catch(e => { })
      if (!queue.songs[0]) return await interaction.reply({ content: `${lang.msg23}`, ephemeral: true }).catch(e => { })
      await queue.stop(interaction.guild.id);
      await interaction.reply({ content: `${lang.msg24}` }).catch(e => { })

    } catch (e) {
      const errorNotifer = require("../../utils/functions.js")
     errorNotifer(client, interaction, e, lang)
      }
  },
}
