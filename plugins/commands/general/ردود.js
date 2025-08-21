const binId = "68a6dedf43b1c97be92426df";
const masterKey = "$2a$10$V6m/7anDHsUmD8PNxlVHr.49kh2pau1VkKaQVzbUaPLwuyRa861Pe";

const OWNER_ID = "61553754531086";

const config = {
  name: "ردود",
  version: "1.0.0",
  description: "تعديل أو حذف ردود لوسي",
  usage: "ردود حذف [سؤال] => [رد] أو ردود تعديل [سؤال] => [رد جديد]",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "TobySanchez",
};

const langData = {
  ar_SY: {
    notOwner: "الأمر ده مخصص لصاحب البوت فقط.",
    wrongSyntax: "الصيغة غلط. استعمل: ردود حذف أو تعديل [سؤال] => [رد]",
    missingInput: "السؤال أو الرد ناقص!",
    deleted: "✅ تم حذف الرد",
    deletedAll: "✅ تم حذف كل الردود للسؤال",
    updated: "✅ تم تعديل الرد",
    notFound: "ما لقيت الرد المطلوب 😕",
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
  if (message.senderID!== OWNER_ID) {
    return message.reply(getLang("notOwner"));
}

  const action = args[0]; // حذف أو تعديل
  const arrowIndex = args.indexOf("=>");

  if (!["حذف", "تعديل"].includes(action) || arrowIndex === -1) {
    return message.reply(getLang("wrongSyntax"));
}

  const key = args.slice(1, arrowIndex).join(" ").trim();
  const value = args.slice(arrowIndex + 1).join(" ").trim();

  if (!key ||!value) return message.reply(getLang("missingInput"));

  try {
    const data = await loadData();

    if (!data[key]) return message.reply(getLang("notFound"));

    if (action === "حذف") {
      // حذف رد معين أو كل الردود
      if (data[key].includes(value)) {
        data[key] = data[key].filter(r => r!== value);
        if (data[key].length === 0) delete data[key];
        const saved = await saveData(data);
        return message.reply(saved? getLang("deleted"): getLang("error"));
} else {
        return message.reply(getLang("notFound"));
}
}

    if (action === "تعديل") {
      // تعديل كل الردود برد جديد واحد
      data[key] = [value];
      const saved = await saveData(data);
      return message.reply(saved? getLang("updated"): getLang("error"));
}

} catch (err) {
    return message.reply(getLang("error"));
}
}

export default {
  config,
  langData,
  onCall,
};
