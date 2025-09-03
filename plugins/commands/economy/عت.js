import axios from "axios";
import { join} from "path";
import { loadImage, createCanvas} from "canvas";

export const config = {
  name: "عناق",
  description: "دمج صورتين داخل قالب عناق",
  usage: "[tag]",
  cooldown: 5,
  permissions: [0],
  credits: "Rako San"
};

const hugPath = join(global.assetsPath, "Hugging.png");

export async function onLoad() {
  await global.downloadFile(
    hugPath,
    "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg"
);
}

async function getAvatarUrl(userID) {
  try {
    const res = await axios.post("https://www.facebook.com/api/graphql/", null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({ height: 512, scale: 1, userID, width: 512})
}
});
    return res.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

function circleImage(image) {
  const size = Math.min(image.width, image.height);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, 0, 0, size, size);

  return canvas;
}

export async function makeImage({ one, two}) {
  const template = await loadImage(hugPath);

  const avatarUrlOne = await getAvatarUrl(one);
  const avatarUrlTwo = await getAvatarUrl(two);

  const avatarPathOne = join(global.cachePath, `avt_${one}_${Date.now()}.png`);
  const avatarPathTwo = join(global.cachePath, `avt_${two}_${Date.now()}.png`);
  const outputPath = join(global.cachePath, `hug_${one}_${two}_${Date.now()}.png`);

  await global.downloadFile(avatarPathOne, avatarUrlOne);
  await global.downloadFile(avatarPathTwo, avatarUrlTwo);

  const avatarOne = await loadImage(avatarPathOne);
  const avatarTwo = await loadImage(avatarPathTwo);

  const avatarOneCircle = circleImage(avatarOne);
  const avatarTwoCircle = circleImage(avatarTwo);

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(avatarOneCircle, 300, 100, 150, 150);
  ctx.drawImage(avatarTwoCircle, 250, 250, 130, 130);

  const imageBuffer = canvas.toBuffer();
  global.writeFile(outputPath, imageBuffer);

  global.deleteFile(avatarPathOne);
  global.deleteFile(avatarPathTwo);

  return outputPath;
}

export async function onCall({ message}) {
  const { senderID, mentions} = message;
  const mention = Object.keys(mentions);

  if (!mention[0]) {
    return message.reply("الشتاء بعمل اكتر من كدا \n كدي منشن المخده حقتك (𖠂_𖠂)");
}

  const one = senderID;
  const two = mention[0];

  try {
    const path = await makeImage({ one, two});

    await message.reply({
      body: "🐸 عناق مشمشي دافي بينكم 💞",
      attachment: global.reader(path)
});

    await global.deleteFile(path);
} catch (e) {
    console.error("❌ خطأ في أمر عناق:", e);
    await message.reply("حدث خطأ أثناء إنشاء صورة العناق، حاول مرة أخرى.");
}
}