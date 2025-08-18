import axios from 'axios';
import Canvas from 'canvas';
import { writeFileSync} from 'fs';
import { join} from 'path';

const config = {
    name: "اصفع",
    description: "صفع مستخدم داخل صورة مضحكة",
    usage: "<@رد/منشن>",
    credits: "XaviaTeam",
    cooldown: 5
};

const langData = {
    "ar_SY": {
        "missingTarget": "رد على رسالة أو منشن شخص تريد صفعه 🤓",
        "loveMessage": "صفعة تنسيك الهموم <3",
        "error": "حدث خطأ أثناء إنشاء الصورة."
}
};

// 🔄 دالة جلب صورة البروفايل من Facebook GraphQL
async function getAvatarUrl(userID) {
    if (isNaN(userID)) throw new Error(`❌ userID غير صالح: ${userID}`);
    try {
        const user = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
            params: {
                doc_id: "5341536295888250",
                variables: JSON.stringify({ height: 500, scale: 1, userID, width: 500})
}
});
        return user.data.data.profile.profile_picture.uri;
} catch {
        return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

// 🖼️ دالة إنشاء صورة الصفعة
async function makeImage(data) {
    const { savePath, avatarPathOne, avatarPathTwo} = data;

    try {
        const template = await Canvas.loadImage(join(global.assetsPath, 'sato.png'));
        const avatarOne = await Canvas.loadImage(avatarPathOne);
        const avatarTwo = await Canvas.loadImage(avatarPathTwo);

        const avatarOneCircle = await global.circle(avatarOne, avatarOne.width / 2, avatarOne.height / 2, avatarOne.width / 2);
        const avatarTwoCircle = await global.circle(avatarTwo, avatarTwo.width / 2, avatarTwo.height / 2, avatarTwo.width / 2);

        const canvas = new Canvas.createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(template, 0, 0);
        ctx.drawImage(avatarOneCircle, 80, 190, 150, 150);
        ctx.drawImage(avatarTwoCircle, 260, 80, 150, 150);

        writeFileSync(savePath, canvas.toBuffer());
        return true;
} catch (e) {
        console.error(e);
        return false;
}
}

// 🧠 الدالة الرئيسية
async function onCall({ message, getLang}) {
    const { type, messageReply, mentions, senderID} = message;
    let savePath, avatarPathOne, avatarPathTwo;

    try {
        const targetID = type === 'message_reply'
? messageReply.senderID
: Object.keys(mentions).length> 0
? Object.keys(mentions)[0]
: senderID;

        if (targetID === senderID) return message.reply(getLang('missingTarget'));

        const selfData = await global.controllers.Users.get(senderID);
        const targetData = await global.controllers.Users.get(targetID);

        if (!selfData?.info?.name ||!targetData?.info?.name) return;

        const selfAvatarUrl = await getAvatarUrl(senderID);
        const targetAvatarUrl = await getAvatarUrl(targetID);

        savePath = join(global.cachePath, `slap_${targetID}_${Date.now()}.png`);
        avatarPathOne = join(global.cachePath, `slap_avatar_${senderID}_${Date.now()}.jpg`);
        avatarPathTwo = join(global.cachePath, `slap_avatar_${targetID}_${Date.now()}.jpg`);

        await global.downloadFile(avatarPathOne, selfAvatarUrl);
        await global.downloadFile(avatarPathTwo, targetAvatarUrl);

        const result = await makeImage({ savePath, avatarPathOne, avatarPathTwo});

        if (!result) {
            message.reply(getLang("error"));
} else {
            await message.reply({ body: getLang("loveMessage"), attachment: global.reader(savePath)});
}
} catch (e) {
        console.error(e);
        message.reply(getLang("error"));
}

    cleanup(savePath, avatarPathOne, avatarPathTwo);
}

// 🧹 تنظيف الملفات الم
function cleanup(savePath, avatarPathOne, avatarPathTwo) {
    try {
        if (global.isExists(savePath)) global.deleteFile(savePath);
        if (global.isExists(avatarPathOne)) global.deleteFile(avatarPathOne);
        if (global.isExists(avatarPathTwo)) global.deleteFile(avatarPathTwo);
} catch (e) {
        console.error(e);
}
}

export default {
    config,
    langData,
    onCall
};
