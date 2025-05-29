const config = require("../../config/bot.js");
const { EmbedBuilder, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { dbService } = require("../../services/core"); // Fixed destructuring
const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");
const { loadLanguage } = require("../../utils/languageLoader");
const { PermissionsBitField } = require("discord.js");

const LOG_CATEGORY = 'Interaction';

module.exports = async (client, interaction) => {
    try {
        // Hanya proses command interactions
        if (!interaction.isCommand()) return;
        
        // Debug logging
        logger.info(LOG_CATEGORY, `Command used: ${interaction.commandName} by ${interaction.user.tag}`);
        
        // Cari command
        const command = client.commands.find(cmd => cmd.name === interaction.commandName);
        
        // Command tidak ditemukan
        if (!command) {
            logger.error(LOG_CATEGORY, `Command not found: ${interaction.commandName}`);
            return interaction.reply({ 
                content: "Command tidak ditemukan atau belum teregistrasi dengan benar. Bot mungkin baru saja diperbarui, silakan coba lagi dalam beberapa menit.", 
                ephemeral: true 
            });
        }
        
        // Cek permission khusus untuk voice channel
        if (command.voiceChannel) {
            if (!interaction.member.voice.channel) {
                const lang = loadLanguage(client.language);
                return interaction.reply({ content: lang.msg73, ephemeral: true });
            }
            
            if (interaction.guild.members.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
                const lang = loadLanguage(client.language);
                return interaction.reply({ content: lang.msg74, ephemeral: true });
            }
        }
        
        // Cek permission jika diperlukan
        if (command.permissions) {
            const requiredPermission = new PermissionsBitField(command.permissions);
            if (!interaction.member.permissions.has(requiredPermission)) {
                const lang = loadLanguage(client.language);
                return interaction.reply({ content: lang.msg67, ephemeral: true });
            }
        }
        
        // Jalankan command
        try {
            logger.debug(LOG_CATEGORY, `Executing command: ${command.name}`);
            await command.run(client, interaction);
        } catch (error) {
            logger.error(LOG_CATEGORY, `Error executing command ${command.name}: ${error.message}`);
            logger.error(LOG_CATEGORY, error.stack);
            
            // Respond with error
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: `Terjadi error saat menjalankan command: ${error.message}`,
                    ephemeral: true 
                }).catch(() => {});
            } else {
                await interaction.reply({ 
                    content: `Terjadi error saat menjalankan command: ${error.message}`,
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    } catch (error) {
        logger.error(LOG_CATEGORY, `Unhandled error in interactionCreate: ${error.message}`);
        logger.error(LOG_CATEGORY, error.stack);
    }
};