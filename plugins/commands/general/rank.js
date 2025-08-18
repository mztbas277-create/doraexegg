import axios from 'axios';
import Canvas from 'canvas';
import { writeFileSync} from 'fs';
import { join} from 'path';

const config = {
    name: 'رانك',
    description: 'عرض بطاقة التفاعل الخاصة بك',
    usage: "[@رد/منشن]",
    credits: "XaviaTeam",
    cooldown: 10
};

const langData = {
    "ar_SY": {
        "rank_error": "حدث خطأ أثناء إنشاء البطاقة."
}
};

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

function progressBar(ctx, x, y, width, radius, progress) {
    ctx.fillStyle = '#d2d2d2';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y + radius * 2, x + width - radius, y + radius * 2);
    ctx.lineTo(x + radius, y + radius * 2);
    ctx.quadraticCurveTo(x, y + radius * 2, x, y + radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    if (progress === 0) return;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + (width * progress / 100) - radius, y);
    ctx.quadraticCurveTo(x + (width * progress / 100), y, x + (width * progress / 100), y + radius);
    ctx.lineTo(x + (width * progress / 100), y + radius);
    ctx.quadraticCurveTo(x + (width * progress / 100), y + radius * 2, x + (width * progress / 100) - radius, y + radius * 2);
    ctx.lineTo(x + radius, y + radius * 2);
    ctx.quadraticCurveTo(x, y + radius * 2, x, y + radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

async function makeCard(data) {
    const { savePath, avatarPath, name, rank, exp, level, expToNextLevel} = data;
    try {
        const template = await Canvas.loadImage(join(global.assetsPath, 'rank_card.png'));
        const avatar = await Canvas.loadImage(avatarPath);
        const circledAvatar = global.circle(avatar, avatar.width / 2, avatar.height / 2, avatar.width / 2);

        const canvas = new Canvas.createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(template, 0, 0);
        ctx.drawImage(circledAvatar, 15, 21, 101, 101);

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(name, 136, 43);

        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`Rank ${rank}`, 136, 66);

        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Lv.${level}`, 136, 87);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${exp}/${expToNextLevel}`, 270, 87);

        let percent = (exp / expToNextLevel) * 100;
        percent = percent> 0? percent % 5 === 0? percent: Math.round(percent / 5) * 5: 0;

        progressBar(ctx, 134, 98, 230, 7, percent);

        const buffer = canvas.toBuffer('image/png');
        writeFileSync(savePath, buffer);
        return true;
} catch (e) {
        console.error(e);
        return false;
}
}

async function onCall({ message, getLang}) {
    const { type, messageReply, mentions, senderID, threadID, participantIDs} = message;
    let savePath, avatarPath;

    try {
        const targetID = type === 'message_reply'
? messageReply.senderID
: Object.keys(mentions).length> 0
? Object.keys(mentions)[0]
: senderID;

        const allData = (global.data.threads.get(String(threadID))?.info?.members) || [];
        if (allData.length === 0 ||!allData.some(e => e.userID === targetID)) return;

        const targetData = await global.controllers.Users.get(targetID);
        if (!targetData ||!targetData.info ||!targetData.info.name) return;

        const avatarUrl = await getAvatarUrl(targetID);

        const sortedData = allData
.filter(e => participantIDs.includes(e.userID))
.map(e => ({ userID: e.userID, exp: e.exp || 0}))
.sort((a, b) => a.exp === b.exp? a.userID.localeCompare(b.userID): b.exp - a.exp);

        const rank = sortedData.findIndex(e => e.userID === targetID) + 1;
        const exp = sortedData[rank - 1].exp || 1;
        const level = global.expToLevel(exp);

        const currentExp = exp - global.levelToExp(level);
        const expToNextLevel = global.levelToExp(level + 1) - global.levelToExp(level);

        savePath = join(global.cachePath, `rank_${targetID}_${Date.now()}.png`);
        avatarPath = join(global.cachePath, `rank_avatar_${targetID}_${Date.now()}.jpg`);

        await global.downloadFile(avatarPath, avatarUrl);
        const result = await makeCard({
            savePath,
            avatarPath,
            name: targetData.info.name,
            rank,
            exp: currentExp,
            level,
            expToNextLevel
});

        if (!result) {
            message.reply(getLang("rank_error"));
} else {
            await message.reply({ attachment: global.reader(savePath)});
}
} catch (e) {
        console.error(e);
        message.reply(getLang("rank_error"));
}

    cleanup(savePath, avatarPath);
}

function cleanup(savePath, avatarPath) {
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
