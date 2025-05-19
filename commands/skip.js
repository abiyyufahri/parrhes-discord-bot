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

      // Cek apakah ini lagu terakhir di antrian
      const isLastSong = queue.songs.length <= 1;

      let number = interaction.options.getNumber('number');
      if (number) {
        if (!queue.songs.length > number) return interaction.reply({ content: lang.msg82, ephemeral: true }).catch(e => { })
        if (isNaN(number)) return interaction.reply({ content: lang.msg130, ephemeral: true }).catch(e => { })
        if (1 > number) return interaction.reply({ content: lang.msg130, ephemeral: true }).catch(e => { })

        try {
        let old = queue.songs[0];
        
        // Jika ini lagu terakhir dan kita mencoba melompat ke lagu selanjutnya
        if (isLastSong && number === 1) {
          // Kirim pesan khusus bahwa ini lagu terakhir
          const embed = new EmbedBuilder()
            .setColor("#F7A531")
            .setDescription(`**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>`)
            .setFooter({ text: lang.msg14 })
          
          // Tandai bahwa antrian dihentikan oleh perintah skip
          queue.isStopped = true;
          
          // Hentikan pemutaran karena ini lagu terakhir
          await queue.stop();
          
          return interaction.reply({ embeds: [embed] }).catch(e => { 
            console.error("Error replying to skip interaction:", e);
          })
        }
        
        await client.player.jump(interaction, number).then(song => {
          const embed = new EmbedBuilder()
          .setColor("#F7A531")
          .setDescription(`**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>`)
          return interaction.reply({ embeds: [embed]  }).catch(e => { 
            console.error("Error replying to skip interaction:", e);
          })
        })
      } catch(e){
        console.error("Error in skip command:", e);
        const embed = new EmbedBuilder()
          .setColor("#F7A531")
          .setDescription(`${lang.msg63}`)
        return interaction.reply({ embeds:[embed] , ephemeral: true }).catch(e => { })
      }
      } else {
        try {
          let old = queue.songs[0];
          
          // Jika ini lagu terakhir dalam antrian
          if (isLastSong) {
            const embed = new EmbedBuilder()
              .setColor("#F7A531")
              .setDescription(`**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>`)
              .setFooter({ text: lang.msg14 })
            
            // Tandai bahwa antrian dihentikan oleh perintah skip
            queue.isStopped = true;
            
            // Hentikan pemutaran karena ini lagu terakhir
            await queue.stop();
            
            return interaction.reply({ embeds: [embed] }).catch(e => { 
              console.error("Error replying to skip interaction:", e);
            })
          }
          
          // Skip lagu biasa jika bukan lagu terakhir
          const success = await queue.skip();
          const embed = new EmbedBuilder()
            .setColor("#F7A531")
            .setDescription(success ? `**${old.name}**, ${lang.msg83} <:skipped:1166679375090024498>` : lang.msg41)

          return interaction.reply({ embeds: [embed] }).catch(e => { 
            console.error("Error replying after skipping:", e);
          })
        } catch (e) {
          console.error("Error in skip command:", e);
          return interaction.reply({ content: lang.msg63, ephemeral: true }).catch(e => { })
        }
      }

    } catch (e) {
      const errorNotifer = require("../functions.js")
      errorNotifer(client, interaction, e, lang)
    }
  },
};
