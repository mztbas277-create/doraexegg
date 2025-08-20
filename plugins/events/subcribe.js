import { createCanvas, loadImage} from "canvas";
import axios from "axios";
import fs from "fs-extra";
import path from "path";

const backgrounds = [
  "https://i.imgur.com/dDSh0wc.jpeg",
  "https://i.imgur.com/UucSRWJ.jpeg",
  "https://i.imgur.com/OYzHKNE.jpeg",
  "https://i.imgur.com/V5L9dPi.jpeg",
  "https://i.imgur.com/M7HEAMA.jpeg"
];

async function getAvatarUrl(userID) {
  try {
    const res = await axios.post("https://www.facebook.com/api/graphql/", null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({
          height: 400,
          scale: 1,
          userID,
          width: 400
})
}
});
    return res.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

async function createWelcomeCard({ userID, username, threadName, memberNumber, threadID}) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext("2d");

  const avatarUrl = await getAvatarUrl(userID);
  const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  const background = await loadImage(backgroundUrl);
  const avatar = await loadImage(avatarUrl);

  // خلفية
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // ✅ إطار أبيض حول البطاقة
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // صورة البروفايل في المنتصف
  const avatarSize = 180;
  const avatarX = canvas.width / 2 - avatarSize / 2;
  const avatarY = 60;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // نصوص تحت الصورة
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Sans";
  ctx.textAlign = "center";

  ctx.fillText(`مرحباً ${username}`, canvas.width / 2, avatarY + avatarSize + 50);
  ctx.font = "28px Sans";
  ctx.fillText(`في ${threadName}`, canvas.width / 2, avatarY + avatarSize + 100);
  ctx.fillText(`عضو رقم ${memberNumber}`, canvas.width / 2, avatarY + avatarSize + 150);

  const outputPath = path.join(global.mainPath, "plugins/events/subcribeGifs", `${threadID}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return fs.createReadStream(outputPath);
}

export default async function ({ event}) {
  const { api, botID} = global;
  const { threadID, author, logMessageData} = event;
  const { Threads, Users} = global.controllers;
  const getThread = (await Threads.get(threadID)) || {};
  const getThreadData = getThread.data || {};
  const getThreadInfo = getThread.info || {};

  if (Object.keys(getThreadInfo).length> 0) {
    for (const user of logMessageData.addedParticipants) {
      if (!getThreadInfo.members.some(mem => mem.userID == user.userFbId)) {
        getThreadInfo.members.push({ userID: user.userFbId});
}
}
}

  const authorName = (await Users.getInfo(author))?.name || author;

  // ✅ حالة انضمام البوت نفسه
  if (logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
    if (getThreadInfo.isSubscribed == false) getThreadInfo.isSubscribed = true;

    for (const adid of global.config.MODERATORS) {
      global.sleep(300);
      api.sendMessage(
        getLang("plugins.events.subcribe.addSelf"),
        {
          threadName: getThreadInfo.name || threadID,
          threadId: threadID,
          authorName,
          authorId: author
},
        adid
);
}
const PREFIX = getThreadData.prefix || global.config.PREFIX;
    api.changeNickname(`○ ❴ ${PREFIX} ❵ ○   ${global.config.NAME || "مشمش"}`, threadID, botID);

    // ✅ إرسال رسالة "تم الاتصال" مع صورة botW.png
    const imagePath = path.join(global.mainPath, "plugins/events/subcribeGifs/bot.png");
    let connectedMsg = {
      body: getLang("plugins.events.subcribe.connected", { PREFIX})
};

    if (fs.existsSync(imagePath)) {
      connectedMsg.attachment = [fs.createReadStream(imagePath)];
}

    api.sendMessage(connectedMsg, threadID);
    return;
}

  // ✅ ترحيب بالأعضاء الحقيقيين فقط
  const joinNameArray = [], mentions = [], warns = [];
  const realParticipants = logMessageData.addedParticipants.filter(p => p.userFbId!= botID);

  for (const participant of realParticipants) {
    let uid = participant.userFbId;
    if (getThreadInfo.members.some(mem => mem.userID == uid && mem?.warns?.length>= 3)) {
      warns.push(uid);
      continue;
}

    const joinName = participant.fullName;
    joinNameArray.push(joinName);
    mentions.push({ id: uid, tag: joinName});
}

  if (warns.length> 0) {
    for (const uid of warns) {
      await new Promise(resolve => {
        api.removeUserFromGroup(uid, threadID, err => {
          if (err) return resolve();
          const username = logMessageData.addedParticipants.find(i => i.userFbId == uid).fullName;
          api.sendMessage({
            body: getLang("plugins.events.subcribe.warns", { username}),
            mentions: [{ id: uid, tag: username}]
}, threadID, () => resolve());
});
});
}
}

  let oldMembersLength = getThreadInfo.members.length - joinNameArray.length;
  let newCount = joinNameArray.map((_, i) => i + oldMembersLength + 1);

  let atlertMsg = {
    body: (getThreadData?.joinMessage || getLang("plugins.events.subcribe.welcome"))
.replace(/\{members}/g, joinNameArray.join(", "))
.replace(/\{newCount}/g, newCount.join(", "))
.replace(/\{threadName}/g, getThreadInfo.name || threadID),
    mentions
};

  if (realParticipants.length === 1 && warns.length === 0) {
    const user = realParticipants[0];
    const welcomeCard = await createWelcomeCard({
      userID: user.userFbId,
      username: user.fullName,
      threadName: getThreadInfo.name || threadID,
      memberNumber: newCount[0],
      threadID
});

    atlertMsg.attachment = [welcomeCard];
}

  if (joinNameArray.length> 0) {
    api.sendMessage(atlertMsg, threadID);
}

  await Threads.updateInfo(threadID, {
    members: getThreadInfo.members,
    isSubscribed: getThreadInfo.isSubscribed
});

  return;
}
