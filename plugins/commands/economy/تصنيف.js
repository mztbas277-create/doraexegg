import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

export const config = {
  name: "تصنيف",
  aliases: ["تفاعل", "تصنف"],
  description: "يعرض تصنيف المستخدم حسب التفاعل، الرصيد، والمستوى",
  usage: "[تاغ أو رد] [-g]",
  cooldown: 5,
  permissions: [0],
  credits: "Rako San"
};

async function getAvatarUrl(userID) {
  try {
    const res = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({ height: 400, scale: 1, userID, width: 400})
}
});
    return res.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

export default async function ({ message}) {
  const { senderID, threadID, mentions, messageReply, type, args, participantIDs} = message;

  try {
    const targetID =
      type === "message_reply"? messageReply.senderID:
      Object.keys(mentions).length> 0? Object.keys(mentions)[0]:
      senderID;

    const scope = args.includes("-g")? "global": "local";

    const userData = await global.controllers.Users.get(targetID);
    const userName = userData?.info?.name || "غير معروف";
    const userMoney = await global.controllers.Users.getMoney(targetID);
    const userExp = userData?.data?.exp || 0;
    const userLevel = global.expToLevel(userExp);

    const allData = scope === "global"
? Array.from(global.data.users.values()).map(e => ({
          userID: e.userID,
          exp: e.data?.exp || 1
}))
: global.data.threads.get(String(threadID))?.info?.members || [];

    const sorted = allData
.filter(e => participantIDs.includes(e.userID))
.map(e => ({ userID: e.userID, exp: e.exp || (scope === "global"? 1: 0)}))
.sort((a, b) => b.exp - a.exp || a.userID.localeCompare(b.userID));

    const rank = sorted.findIndex(e => e.userID === targetID) + 1;

    const avatarUrl = await getAvatarUrl(targetID);
    const cacheDir = path.join(global.mainPath, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const avatarPath = path.join(cacheDir, `avatar_${targetID}_${Date.now()}.jpg`);
    const writer = fs.createWriteStream(avatarPath);
    const response = await axios.get(avatarUrl, { responseType: "stream"});
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
});

    await message.reply({
      body:
        `📄 الــتــصـنــيــف \n` +
        `👤 الاسم: ${userName}\n` +
        `🆔 الآيدي: ${targetID}\n` +
        `💰 الرصيد: ${userMoney}$\n` +
        `📶 المستوى: ${userLevel}\n` +
        `⚡ الخبرة: ${userExp} تفاعل \n` +
        `🏅 الترتيب ${scope === "global"? "العالمي": "المحلي"}: ${rank}`,
      attachment: fs.createReadStream(avatarPath)
});

    fs.unlinkSync(avatarPath);
} catch (err) {
    console.error("❌ خطأ في أمر التصنيف:", err);
    return message.reply("💥 حصلت مشكلة في التصنيف، جرب تاني.");
}
}