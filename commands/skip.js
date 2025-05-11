const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const db = require("../mongoDB");
module.exports = {
  name: "skip",
  description: "Switches the music being played.",
  permissions: "0x0000000000000800",
  options: [{
    name: "number",
    description: "Type how many songs you want to skip.",
    type: ApplicationCommandOptionType.Number,
    required: false
  }],
  voiceChannel: true,
  run: async (client, interaction) => {
    let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../languages/${lang}.js`);
    try {

      const queue = client.player.getQueue(interaction.guild.id);
      if (!queue || !queue.playing) return interaction.reply({ content: lang.msg5, ephemeral: true }).catch(e => { })

      let number = interaction.options.getNumber('number');
      if (number) {
        if (!queue.songs.length > number) return interaction.reply({ content: lang.msg82, ephemeral: true }).catch(e => { })
        if (isNaN(number)) return interaction.reply({ content: lang.msg130, ephemeral: true }).catch(e => { })
        if (1 > number) return interaction.reply({ content: lang.msg130, ephemeral: true }).catch(e => { })

        try {
        let old = queue.songs[0];
        await client.player.jump(interaction, number).then(song => {
          const embed = new EmbedBuilder()
          .setColor("#F7A531")
          .setDescription(`**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>`)
          return interaction.reply({ embeds: [embed]  }).catch(e => { })
        })
      } catch(e){
        const embed = new EmbedBuilder()
          .setColor("#F7A531")
          .setDescription(`${lang.msg63}`)
        return interaction.reply({ embeds:[embed] , ephemeral: true }).catch(e => { })
      }
      } else {
        try {
          let old = queue.songs[0];
          const success = await queue.skip();
          const embed = new EmbedBuilder()
          .setColor("#F7A531")
          .setDescription(success ? `**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>` : lang.msg41)
          
          return interaction.reply({ embeds:  [embed]  }).edit(e => { })
        } catch (e) {
          return interaction.reply({ content: lang.msg63, ephemeral: true }).catch(e => { })
        }
      }

    } catch (e) {
      const errorNotifer = require("../functions.js")
     errorNotifer(client, interaction, e, lang)
      }
  },
};
