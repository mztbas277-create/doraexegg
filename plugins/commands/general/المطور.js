import fs from "fs";
import axios from "axios";

const imageURL = "https://i.postimg.cc/sDwzm8XB/Messenger-creation-1069310175245840.jpg";
const imagePath = "./cache/botW.jpg";

async function ensureImageExists() {
  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");
  if (!fs.existsSync(imagePath)) {
    const { data} = await axios.get(imageURL, { responseType: "arraybuffer"});
    fs.writeFileSync(imagePath, Buffer.from(data));
}
  return fs.createReadStream(imagePath);
}

export default async function ({ message, prefix}) {
  const imageStream = await ensureImageExists();

  const msg = `❀━━━━〖 ظفو 〗━━━━❀
معلومات البوت ✨
════════❍════════
  اسم البوت: ظفو
════════❍════════
  اسم المطور: صلاح الدين
════════❍════════
  رابط حساب المطور: https://www.facebook.com/Rako.San.r.s
════════❍════════
  ${prefix}اوامر لرؤية قائمة الأوامر.`;

  message.reply({ body: msg, attachment: imageStream});
}
