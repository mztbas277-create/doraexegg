import axios from 'axios';
import Canvas from 'canvas';
import { writeFileSync} from 'fs';
import { join} from 'path';

const config = {
    name: "سجن",
    description: "سجن مستخدم داخل صورة مضحكة",
    usage: "<@رد/منشن>",
    credits: "XaviaTeam",
    cooldown: 5
};

const langData = {
    "ar_SY": {
        "error": "حدث خطأ أثناء إنشاء صورة السجن."
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

// 🖼️ دالة إنشاء صورة السجن
async function makeImage(data) {
    const { savePath, avatarPath} = data;

    try {
        const template = await Canvas.loadImage(join(global.assetsPath, 'jail.png'));
        const avatar = await Canvas.loadImage(avatarPath);

        const canvas = new Canvas.createCanvas(avatar.width, avatar.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(avatar, 0, 0);
        ctx.drawImage(template, 0, 0, avatar.width, avatar.height);

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
    let savePath, avatarPath;

    try {
        const targetID = type === 'message_reply'
? messageReply.senderID
: Object.keys(mentions).length> 0
? Object.keys(mentions)[0]
: senderID;

        const targetData = await global.controllers.Users.get(targetID);
        if (!targetData ||!targetData.info ||!targetData.info.name) return;

        const avatarUrl = await getAvatarUrl(targetID);

        savePath = join(global.cachePath, `jail_${targetID}_${Date.now()}.png`);
        avatarPath = join(global.cachePath, `jail_avatar_${targetID}_${Date.now()}.jpg`);

        await global.downloadFile(avatarPath, avatarUrl);
        const result = await makeImage({ savePath, avatarPath});

        if (!result) {
            message.reply(getLang("error"));
} else {
            await message.reply({ attachment: global.reader(savePath)});
}
} catch (e) {
        console.error(e);
        message.reply(getLang("error"));
}

    cleanup(avatarPath, savePath);
}

// 🧹 تنظيف الملفات المؤقتة
function cleanup(avatarPath, savePath) {
    try {
        if (global.isExists(savePath)) global.deleteFile(savePath);
        if (global.isExists(avatarPath)) global.deleteFile(avatarPath);
} catch (e) {
        console.error(e);
}
}

export default {
    config,
    langData,
    onCall
};
