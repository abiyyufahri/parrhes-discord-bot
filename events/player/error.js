const db = require("../../mongoDB");

module.exports = async (client, textChannel, e) => {
   console.error('Music player error details:', {
      message: e.message,
      stack: e.stack,
      name: e.name,
      code: e.code
   });
   
   if (textChannel) {
      try {
         // Dapatkan bahasa saat ini
         let lang = await db?.musicbot?.findOne({
            guildID: textChannel?.guild?.id,
         });
         lang = lang?.language || client.language;
         lang = require(`../../languages/${lang}.js`);
         
         // Format error message for better readability dengan lokalisasi
         let errorMessage = `**${lang.music_player_error}** ${e.toString().slice(0, 1974)}`;
         
         // Add more detailed information if available
         if (e.code) {
            errorMessage += `\n${lang.error_code} ${e.code}`;
         }
         
         // Provide helpful troubleshooting tips based on common errors
         if (e.message?.includes('Status code:')) {
            errorMessage += `\n\n${lang.error_tip_invalid_url}`;
         } else if (e.message?.includes('Premature close')) {
            errorMessage += `\n\n${lang.error_tip_connection}`;
         } else if (e.message?.includes('Permission')) {
            errorMessage += `\n\n${lang.error_tip_permission}`;
         }
         
         return textChannel.send(errorMessage);
      } catch (sendError) {
         console.error("Failed to send error message to channel:", sendError);
      }
   }
}
