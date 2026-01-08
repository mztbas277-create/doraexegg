import fs from "fs";
import axios from "axios";

const imageURL = "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";
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

  const msg = `❀━━━━〖 ساكورا 〗━━━━❀
معلومات البوت ✨
 ساكورا ❍ اسم البوت
  
وسكي ❍ المطور 
  
رابطابط حساب المطور: https://www.facebook.com/profile.php?id=61582847128354
❍
  ${prefix}اوامر لرؤية قائمة الأوامر.`;

  message.reply({ body: msg, attachment: imageStream});
}
