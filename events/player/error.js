module.exports = async (client, textChannel, e) => {
   console.error('Music player error details:', {
      message: e.message,
      stack: e.stack,
      name: e.name,
      code: e.code
   });
   
   if (textChannel) {
      try {
         // Format error message for better readability
         let errorMessage = `**Music Player Error:** ${e.toString().slice(0, 1974)}`;
         
         // Add more detailed information if available
         if (e.code) {
            errorMessage += `\nError Code: ${e.code}`;
         }
         
         // Provide helpful troubleshooting tips based on common errors
         if (e.message?.includes('Status code:')) {
            errorMessage += "\n\nSaran: Coba gunakan kata kunci pencarian yang berbeda atau URL yang valid.";
         } else if (e.message?.includes('Premature close')) {
            errorMessage += "\n\nSaran: Ada masalah koneksi. Periksa koneksi internet Anda dan coba lagi.";
         } else if (e.message?.includes('Permission')) {
            errorMessage += "\n\nSaran: Bot tidak memiliki izin yang diperlukan. Periksa izin bot di channel suara.";
         }
         
         return textChannel.send(errorMessage);
      } catch (sendError) {
         console.error("Failed to send error message to channel:", sendError);
      }
   }
}
