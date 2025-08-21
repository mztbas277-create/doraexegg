const binId = "68a6dedf43b1c97be92426df";
const masterKey = "$2a$10$V6m/7anDHsUmD8PNxlVHr.49kh2pau1VkKaQVzbUaPLwuyRa861Pe";

const config = {
  name: "تعلم",
  aliases: ["تعلم"],
  description: "علم لوسي كيفية الكلام",
  usage: "[سؤال] => [رد]",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "TobySanchez",
};

const langData = {
  ar_SY: {
    wrongSyntax: "الصيغة غلط. استعمل: السؤال => الرد",
    missingInput: "السؤال أو الرد ناقص!",
    succeed: "تم إضافة الرد ✅",
    failed: "فشل الاضافه ",
    error: "في مشكلة، حاول تاني",
},
};

async function loadData() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        "X-Master-Key": masterKey
}
});
    const json = await res.json();
    return json.record || {};
} catch {
    return {};
}
}

async function saveData(data) {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": masterKey
},
      body: JSON.stringify(data)
});
    const result = await res.json();
    return result.message === "Bin updated";
} catch {
    return false;
}
}

async function onCall({ message, args, getLang}) {
  const arrowIndex = args.indexOf("=>");
  if (arrowIndex === -1) return message.reply(getLang("wrongSyntax"));

  const key = args.slice(0, arrowIndex).join(" ").trim();
  const value = args.slice(arrowIndex + 1).join(" ").trim();

  if (!key ||!value) return message.reply(getLang("missingInput"));

  try {
    const data = await loadData();
    if (!data[key]) data[key] = [];
    if (!data[key].includes(value)) data[key].push(value);
    const saved = await saveData(data);
    if (saved) return message.reply(getLang("succeed"));
    else return message.reply(getLang("succeed"));
} catch (err) {
    return message.reply(getLang("error"));
}
}

export default {
  config,
  langData,
  onCall,
};
