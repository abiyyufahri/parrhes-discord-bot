const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "stop",
  description: "Plays the previous music again.",
  permissions: "0x0000000000000800",
  options: [],
  voiceChannel: true,
  run: async (client, interaction) => {
    let lang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../../../languages/${lang}.js`);

    try {      const queue = client.player.getQueue(interaction.guild.id);
      if (!queue || !queue.playing) return await interaction.reply({ content: lang.msg5, ephemeral: true }).catch(e => { })
      queue.stop(interaction.guild.id);
      return await interaction.reply({ content: lang.msg85 }).catch(e => { })

    } catch (e) {
      const errorNotifer = require("../../utils/functions.js")
     errorNotifer(client, interaction, e, lang)
      }
  },
};
