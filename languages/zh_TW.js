const language = {
    loadevent: "事件讀取中...",
    loadcmd: "指令讀取中...",
    ready: "連線成功！",
    loadslash: "成功載入機器人 [/] 指令",
    error1: "機器人 token 錯誤或是未開啟 INTENTS 權限",
    error2: "請在 token.js 設定機器人 token。",
    loadclientevent: "客戶端事件讀取中...",
    embed1: "您必須有 <@&{djRole}>(DJ) 身分組以使用這項指令，用戶沒有此身分組無法使用 {cmdMAP}",
    message1: "您沒有連線至語音頻道。 ❌",
    message2: "您必須和我在同一個語音頻道。 ❌",
    message3: "權限不足。",
    msg4: "發生了某些錯誤。",
    msg5: "播放清單現在是空的。 ❌",
    msg6: "儲存音樂",
    msg7: "儲存音樂清單名稱",
    msg8: "這是即時直播，暫無資訊可以顯示。 🎧",
    msg9: "** 成功:** 音樂資料已經更新。",
    msg10: "查無此音樂清單。 ❌",
    msg11: "這首歌已經在音樂清單了。 ❌",
    msg12: "已經增加到您的音樂清單。",
   error3: "重新載入機器人 [/] 指令時發生錯誤：",
   error4: "警告：看起來您沒有填人 Mongodb 網址？如果您在 config.js 裡沒有填人有效的 Mongodb 網址，您沒辦法使用機器人。",
   msg13: `🎵 現正播放：**{track?.title}** -> 音樂頻道：**{queue?.connection.channel.name}** 🎧`,
   msg14: "佇列目前是空的。您可以播放更多音樂，再見... ",
   msg15: "語音頻道目前沒人，離開語音頻道。 ❌",
   msg16: "連線至語音頻道發生問題。 ❌ 看來有人把我斷開連線了？太難過了吧。 😔",
   msg17: "沒有上一曲目。 ❌",
   msg18: "現正播放 **{queue.previousTracks[1].title}**. ",
   msg19: "機器人統計",
   msg20: "重新整理",
   msg21: "**您的時間到了！**",
   msg22: "** 資料更新。**",
   msg23: "佇列目前是空的。 ❌",
   msg24: "佇列已經被清空。 🗑️",
   msg26: "如果您沒有指定 DJ 身分組，那麼無法使用這個指令。",
   msg25: "DJ 身分組已經被設定為 <@&{role}>。",
   msg27: "DJ 身分組已經被刪除。",
   msg28: "DJ 身分組還沒有設定。",
   msg29: `請輸入一個有效的過濾器名稱。 ❌\n{filters}`,
   msg30: `查無過濾器。 ❌\n{filters}`,
   msg31: `使用：**{filter}**, 過濾器狀態：**{status}**\n **注意，如果音樂較長，過濾器的使用時間可也會延長！**`,
   msg32: "是時候嘗試這個完全免費的 Discord 音樂機器人了，快到 https://github.com/umutxyp/MusicBot 設定自己的機器人吧！",
   msg33: "指令",
   msg34: "您已經輸入過這個指令了。 ❌",
   msg35: "佇列",
   msg36: "目前播放",
   msg37: "關閉循環",
   msg38: "循環系統",
   msg39: `> **是時候做個選擇了，對吧？**
   > **佇列：** 循環播放。
   > **目前播放：** 循環目前歌曲.
   > **結束循環：** 結束目前循環`,
   msg40: "佇列循環模式",
   msg41: "某些東東發生錯誤。 ❌",
   msg42: "目前播放循環模式。",
   msg43: "循環模式目前未使用。 ❌",
   msg44: `循環模式 **關閉** 🔁`,
   msg45: "時間到",
   msg46: "循環系統 - 結束",
   msg47: '儲存播放清單',
   msg48: "音樂暫停！",
   msg49: `訊息 Ping`,
   msg50: `訊息延遲`,
   msg51: `API 延遲`,
   msg52: `現在沒有播放清單。❌`,
   msg53: `您沒有權限播放此播放清單。❌`,
   msg54: `您沒有這個名字的音樂。❌`,
   msg55: `我無法加入您所在的語音頻道。 ❌`,
   msg56: `播放清單讀取中... `,
   msg57: `<@{interaction.member.id}>, 新增了 **{music_filter.length}** 到佇列。 `,
   msg58: `找不到這個名字的播放清單。❌`,
   msg59: `輸入您要搜尋的歌曲名稱。❌`,
   msg60: `没有找到结果！❌`,
   msg61: "音樂讀取中... 🎧",
   msg62: "音樂列表已經被增加至播放清單。 ",
   msg63: `佇列目前是空的。 ❌`,
   msg64: "伺服器音樂列表",
   msg65: "目前播放",
   msg66: "點歌的是",
   msg67: "頁",
   msg68: `指令處理已經被取消。 `,
   msg69: `伺服器音樂列表 - 時間結束！`,
   msg70: `反應時間已經超過，您可以輸入 \`/queue\` 重新使用這些指令。`,
   msg71: `某些東東發生錯誤。 ❌ 看起來像是操作前沒有先停止播放。`,
   msg72: "列表暫停！ ",
   msg73: `輸入一個有效的歌曲名稱。 ❌`,
   msg74: `查無搜尋結果。 ❌`,
   msg75: "搜尋音樂",
   msg76: "選擇音樂自 **1** 至 **{maxTracks.length}** ⬇️",
   msg77: `取消音樂搜尋。 `,
   msg78: `讀取中... 🎧`,
   msg79: "新增至佇列。 ",
   msg80: `搜尋時間超時 ❌`,
   msg81: "刪除",
   msg82: `歌單中沒有那麼多歌，重新輸入吧哥。 ❌`,
   msg83: "跳過歌曲 ",
   msg84: `這是一場直播，無法顯示相關資訊。 🎧`,
   msg85: `音樂結束，期待下次見面！ `,
   msg86: "更新",
   msg87: `目前音量：**{queue.volume}** 🔊\n**設定音量請使用 \`1\` 到 \`{maxVol}\` 的數字。**`,
   msg88: `現在已經是這個音量了。 ❌`,
   msg89: `**輸入一個介於 \`1\` 到 \`{maxVol}\` 的數字以調整音量。** ❌`,
   msg90: "音量調整：",
   msg91: `幫這個播放清單取個名字吧。 ❌`,
   msg92: `已經存在這個名稱的播放清單。 ❌`, 
   msg93: `您無法擁有超過 30 個播放清單。 ❌`,
   msg94: "播放清單生成中... 🎧",
   msg95: "播放清單建立成功！ 🎧",
   msg96: `您沒有這個名字的播放清單。 ❌`,
   msg97: "播放清單刪除中... 🎧",
   msg98: "播放清單刪除成功！ 🎧",
   msg99: `輸入您想搜尋的歌曲名稱。 ❌`,
   msg100: `輸入您想增加至播放清單的音樂名稱。 ❌`,
   msg101: `您無法再歌單內儲存超過 {max_music} 首歌曲。 ❌`,
   msg102: "音樂讀取中... 🎧",
   msg103: "所有歌曲新增至播放清單！ 🎧",
   msg104: `這首歌已經在播放清單裡了。 ❌`,
   msg105: "新增至播放清單！ 🎧",
   msg106: `輸入歌單中想刪除的歌曲名稱。 ❌`,
   msg107: `看來您沒有這個名字的歌曲。 ❌`,
   msg108: "刪除音樂... 🎧",
   msg109: "音樂已經刪除！ 🎧",
   msg110: "輸入您想搜尋的歌單名稱。 ❌",
   msg111: `這個播放清單內沒有任何歌曲。 ❌`,
   msg112: "公開歌單排行榜",
   msg113: `反應時間已經超過，您可以輸入 \`/playlist top\` 重新使用這些指令。`,
   msg114: `目前沒有公開歌單。 ❌`,
   msg115: "您的播放清單",
   msg116: `音樂`,
   msg117: `您沒有任何播放清單。❌`,
   msg118: "反應時間已經超過，您可以輸入 \`/playlist list {name}\` 重新使用這些指令。",
   msg119: "使用 **/play playlist <list-name>** 指令來聽這些播放清單。\n輸入 **/playlist list <list-name>** 來看看清單中有什麼歌。",
   msg120: "請指定一個文字頻道。",
   msg121: "<#{channel}> 已經被設為指令頻道，現在在其他頻道是無效的。",
   msg122: "目前沒有註冊的資料。",
   msg123: "<#{channel}> 被移除自指令頻道。",
   msg124: "這個頻道已經是指令頻道了。",
   msg125: "這裡似乎不是一個文字頻道。",
   msg126: "❌ 這是這個伺服器可以使用指令的頻道列表： {channel_filter}",
   msg127: "指令未被定義。",
   error7: "請稍後再試一次。",
   msg128: "您在我唱歌時把我設為靜音模式，那就是為什麼我沒有聲音 😔",
   msg129: "播放",
   msg130: "請輸入一個變數。",
   msg131: "使用列表中的指令必須為機器人投票。",
   msg132: "目前沒有音樂可以暫停。",
   msg133: "我準備好隨機播放了。",
   msg134: "用法不正确確。示例：`5:50` | `1:12:43`",
   msg135: "播放時間已成功設定為 {queue.formattedCurrentTime}",
   msg136: "自動播放現已打開。從現在在開始我要開啟隨機音樂。",
   msg137: "自動播放現已關閉。",
   }
   module.exports = language;
   
