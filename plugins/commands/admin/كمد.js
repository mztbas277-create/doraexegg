import fs from "fs";
import path from "path";

let currentPath = process.cwd(); // يبدأ من مجلد التشغيل

const config = {
  name: "shell",
  aliases: ["shell", "terminal"],
  description: "أوامر إدارة الملفات: ls, cd, mkdir, create, write, get, delete",
  usage: "<الأمر> <المحتوى>",
  credits: "راكو سان"
};

async function onCall({ message, args}) {
  // 🔐 حماية الأمر لمستخدم واحد فقط
  if (message.senderID!== "61553754531086") {
    return message.reply("🚫 ليس لديك صلاحية استخدام هذا الأمر.");
}

  const subCommand = args[0];
  const input = args.slice(1).join(" ");

  switch (subCommand) {
    case "ls": {
      try {
        const files = fs.readdirSync(currentPath);
        message.reply(`📁 محتويات المجلد الحالي:\n${files.join("\n")}`);
} catch {
        message.reply("❌ حدث خطأ أثناء قراءة المجلد.");
}
      break;
}

    case "cd": {
      const target = path.resolve(currentPath, input);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        currentPath = target;
        message.reply(`✅ تم الانتقال إلى:\n${currentPath}`);
} else {
        message.reply("❌ المجلد غير موجود أو غير صالح.");
}
      break;
}

    case "mkdir": {
      const dirPath = path.join(currentPath, input);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        message.reply(`📁 تم إنشاء المجلد:\n${dirPath}`);
} else {
        message.reply("⚠️ المجلد موجود بالفعل.");
}
      break;
}

    case "create": {
      const [fileName,...codeParts] = input.split("+");
      const filePath = path.join(currentPath, fileName.trim());
      const code = codeParts.join("+").trim();
      try {
        fs.writeFileSync(filePath, code || "", "utf8");
        message.reply(`📝 تم إنشاء الملف:\n${fileName.trim()}`);
} catch {
        message.reply("❌ فشل في إنشاء الملف.");
}
      break;
}

    case "write": {
      const [fileName,...codeParts] = input.split("+");
      const filePath = path.join(currentPath, fileName.trim());
      const code = codeParts.join("+").trim();
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, code, "utf8");
        message.reply(`✏️ تم تعديل الملف:\n${fileName.trim()}`);
} else {
        message.reply("❌ الملف غير موجود.");
}
      break;
}

    case "get": {
      const filePath = path.join(currentPath, input.trim());
      if (!fs.existsSync(filePath)) return message.reply("❌ الملف غير موجود.");

      const ext = path.extname(filePath).toLowerCase();
      if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        message.reply({ attachment: fs.createReadStream(filePath)});
} else {
        const content = fs.readFileSync(filePath, "utf8");
        message.reply(`📄 محتوى ${input}:\n\n${content}`);
}
      break;
}

    case "delete": {
      const targetPath = path.join(currentPath, input.trim());
      if (!fs.existsSync(targetPath)) {
        return message.reply("❌ الملف أو المجلد غير موجود.");
}

      try {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true});
          message.reply(`🗂️ تم حذف المجلد:\n${input.trim()}`);
} else {
          fs.unlinkSync(targetPath);
          message.reply(`🗑️ تم حذف الملف:\n${input.trim()}`);
}
} catch {
        message.reply("⚠️ حدث خطأ أثناء الحذف.");
}
      break;
}

    default:
      message.reply("❓ الأمر غير معروف. استخدم: ls, cd, mkdir, create, write, get, delete");
}
}

export default {
  config,
  onCall
};
