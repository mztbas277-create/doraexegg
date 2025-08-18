import axios from "axios";
import { join} from "path";
import { loadImage, createCanvas} from "canvas";

// إعدادات الأمر
export const config = {
  name: "زواج",
  version: "0.0.1-xaviabot-port-refactor",
  credits: "kudos",
  description: "دمج صورتين داخل قالب زواج",
  usage: "[tag]",
  cooldown: 5
};

// رابط الخلفية
const marryPath = join(global.assetsPath, "marrywi.png");

// تحميل الخلفية عند التشغيل
export async function onLoad() {
  await global.downloadFile(
    marryPath,
    "https://i.ibb.co/VDrz7Q9/336377253-520155543604186-3362317639442779902-n.png"
);
}

// 🔄 دالة جلب صورة البروفايل من Facebook GraphQL
async function getAvatarUrl(userID) {
  try {
    const user = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({ height: 512, scale: 1, userID, width: 512})
}
});
    return user.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

// 🖼️ إنشاء صورة الزواج
export async function makeImage({ one, two}) {
  const template = await loadImage(marryPath);

  const avatarUrlOne = await getAvatarUrl(one);
  const avatarUrlTwo = await getAvatarUrl(two);

  const avatarPathOne = join(global.cachePath, `avt_${one}_${Date.now()}.png`);
  const avatarPathTwo = join(global.cachePath, `avt_${two}_${Date.now()}.png`);
  const outputPath = join(global.cachePath, `marry_${one}_${two}_${Date.now()}.png`);

  await global.downloadFile(avatarPathOne, avatarUrlOne);
  await global.downloadFile(avatarPathTwo, avatarUrlTwo);

  const avatarOne = await loadImage(avatarPathOne);
  const avatarTwo = await loadImage(avatarPathTwo);

  const avatarOneCircle = await global.circle(avatarOne, avatarOne.width / 2, avatarOne.height / 2, avatarOne.width / 2);
  const avatarTwoCircle = await global.circle(avatarTwo, avatarTwo.width / 2, avatarTwo.height / 2, avatarTwo.width / 2);

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(avatarOneCircle, 200, 23, 60, 60);
  ctx.drawImage(avatarTwoCircle, 136, 40, 60, 60);

  const imageBuffer = canvas.toBuffer();
  global.writeFile(outputPath, imageBuffer);

  // تنظيف الصور المؤقتة
  global.deleteFile(avatarPathOne);
  global.deleteFile(avatarPathTwo);

  return outputPath;
}

// 📩 تنفيذ الأمر
export async function onCall({ message}) {
  const { senderID, mentions} = message;
  const mention = Object.keys(mentions);

  if (!mention[0]) {
    return message.reply("تاغ لي طونتك ヽ(*´з｀*)ﾉ.");
}

  const one = senderID;
  const two = mention[0];

  try {
    const path = await makeImage({ one, two});

    await message.reply({
      body: "💍 مبروك الزواج! نتمنى لكم حياة مليئة بالحب والهموم 💞",
      attachment: global.reader(path)
});

    global.deleteFile(path);
} catch (e) {
    console.error(e);
    message.reply("حدث خطأ أثناء إنشاء صورة الزواج، حاول مرة أخرى.");
}
}
