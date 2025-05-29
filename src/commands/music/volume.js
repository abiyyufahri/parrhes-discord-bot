const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const maxVol = require("../../config/bot").opt.maxVol;
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
const path = require("path");
module.exports = {
  name: "volume",
  description: "Allows you to adjust the music volume.",
  permissions: "0x0000000000000800",
  options: [{
    name: 'volume',
    description: 'Type the number to adjust the volume.',
    type: ApplicationCommandOptionType.Integer,
    required: true
  }],
  voiceChannel: true,
  run: async (client, interaction) => {
    let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })
    const langCode = dbLang?.language || client.language;
    const lang = loadLanguage(langCode);

    try {      const queue = client.player.getQueue(interaction.guild.id);
      if (!queue || !queue.playing) return await interaction.reply({ content: lang.msg5, ephemeral: true }).catch(e => { })

      const vol = parseInt(interaction.options.getInteger('volume'));

      if (!vol) return await interaction.reply({ content: lang.msg87.replace("{queue.volume}", queue.volume).replace("{maxVol}", maxVol), ephemeral: true }).catch(e => { })

      if (queue.volume === vol) return await interaction.reply({ content: lang.msg88, ephemeral: true }).catch(e => { })

      if (vol < 0 || vol > maxVol) return await interaction.reply({ content: lang.msg89.replace("{maxVol}", maxVol), ephemeral: true }).catch(e => { })

      const success = queue.setVolume(vol);

      return await interaction.reply({ content: success ? `${lang.msg90} **${vol}**/**${maxVol}** 🔊` : lang.msg41 }).catch(e => { })

    } catch (e) {
      const errorNotifer = require("../../utils/functions.js")
     errorNotifer(client, interaction, e, lang)
      }
  },
};
