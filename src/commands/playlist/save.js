const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "save",
  description: "It sends and saves the played music to you via dm box.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    let lang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../../../languages/${lang}.js`);

    try {      const queue = client.player.getQueue(interaction.guild.id);
      if (!queue || !queue.playing) return await interaction.reply({ content: lang.msg5, ephemeral: true }).catch(e => { })

      const Modal = new ModalBuilder()
        .setCustomId("playlistModal")
        .setTitle(lang.msg6)

      const PlayList = new TextInputBuilder()
        .setCustomId("playlist")
        .setLabel(lang.msg7)
        .setRequired(true)
        .setStyle(TextInputStyle.Short)

      const PlaylistRow = new ActionRowBuilder().addComponents(PlayList);
      Modal.addComponents(PlaylistRow)
      await interaction.showModal(Modal).catch(e => { })

    } catch (e) {
      const errorNotifer = require("../../utils/functions.js")
      errorNotifer(client, interaction, e, lang)
    }
  },
};
