const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "queue",
  description: "It shows you the playlist.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    let lang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../../../languages/${lang}.js`);
    try {

     const queue = client.player.getQueue(interaction.guild.id);
      if (!queue || !queue.playing) return interaction.reply({ content: lang.msg5, ephemeral: true }).catch(e => { })
      if (!queue.songs || !Array.isArray(queue.songs) || !queue.songs.length) return interaction.reply({ content: lang.msg63, ephemeral: true }).catch(e => { })

      const trackl = []
      queue.songs.map(async (track, i) => {
        trackl.push({
          title: track.name || "Unknown Title",
          author: track.uploader?.name || "Unknown Author",
          user: track.user || { id: "unknown" },
          url: track.url || "#",
          duration: track.duration || 0
        })
      })

      const backId = "emojiBack"
      const forwardId = "emojiForward"
      const backButton = new ButtonBuilder({
        style: ButtonStyle.Secondary,
        emoji: "⬅️",
        customId: backId
      });

      const deleteButton = new ButtonBuilder({
        style: ButtonStyle.Secondary,
        emoji: "❌",
        customId: "close"
      });

      const forwardButton = new ButtonBuilder({
        style: ButtonStyle.Secondary,
        emoji: "➡️",
        customId: forwardId
      });


      let kaçtane = 8
      let page = 1
      let a = trackl.length / kaçtane

      const generateEmbed = async (start) => {
        let sayı = page === 1 ? 1 : page * kaçtane - kaçtane + 1
        const current = trackl.slice(start, start + kaçtane)
        if (!current || !current?.length) return interaction.reply({ content: lang.msg63, ephemeral: true }).catch(e => { })
        return new EmbedBuilder()
          .setTitle(`${lang.msg64} - ${interaction.guild.name}`)
          .setThumbnail(interaction.guild.iconURL({ size: 2048, dynamic: true }))
          .setColor(client.config.embedColor)
          .setDescription(`${lang.msg65}: \`${queue.songs[0]?.name || "Unknown"}\`
    ${current.map(data => {
            // Safely handle user mention
            const userMention = data.user && data.user.id !== "unknown" ? `<@${data.user.id}>` : "Unknown User";
            return `\n\`${sayı++}\` | [${data.title}](${data.url}) | **${data.author}** (${lang.msg66} ${userMention})`;
          }).join("")}`)
          .setFooter({ text: `${lang.msg67} ${page}/${Math.floor(a + 1)}` })
      }

      const canFitOnOnePage = trackl.length <= kaçtane

      await interaction.reply({
        embeds: [await generateEmbed(0)],
        components: canFitOnOnePage
          ? []
          : [new ActionRowBuilder({ components: [deleteButton, forwardButton] })],
        fetchReply: true
      }).then(async Message => {
        const filter = i => i.user.id === interaction.user.id
        const collector = Message.createMessageComponentCollector({ filter, time: 120000 });


        let currentIndex = 0
        collector.on("collect", async (button) => {
          if (button?.customId === "close") {
            collector?.stop()
           return button?.reply({ content: lang.msg68, ephemeral: true }).catch(e => { })
          } else {

            if (button.customId === backId) {
              page--
            }
            if (button.customId === forwardId) {
              page++
            }

            button.customId === backId
              ? (currentIndex -= kaçtane)
              : (currentIndex += kaçtane)

            await interaction.editReply({
              embeds: [await generateEmbed(currentIndex)],
              components: [
                new ActionRowBuilder({
                  components: [
                    ...(currentIndex ? [backButton] : []),
                    deleteButton,
                    ...(currentIndex + kaçtane < trackl.length ? [forwardButton] : []),
                  ],
                }),
              ],
            }).catch(e => { })
            await button?.deferUpdate().catch(e => { })
          }
        })

        collector.on("end", async (button) => {
          button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("⬅️")
              .setCustomId(backId)
              .setDisabled(true),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("❌")
              .setCustomId("close")
              .setDisabled(true),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("➡️")
              .setCustomId(forwardId)
              .setDisabled(true))

          const embed = new EmbedBuilder()
            .setTitle(lang.msg69)
            .setThumbnail(interaction?.guild?.iconURL({ size: 2048, dynamic: true }))
            .setColor(client.config.embedColor)
            .setDescription(lang.msg70)
            .setFooter({ text: `Parrhesia 🌀` })
          return interaction?.editReply({ embeds: [embed], components: [button] }).catch(e => { })

        })
      }).catch(e => { })

    } catch (e) {
      const errorNotifer = require("../../utils/functions.js")
     errorNotifer(client, interaction, e, lang)
      }
  }
}
