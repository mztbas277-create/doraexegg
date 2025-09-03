const binId = "68b0fd75ae596e708fda82c1"; // نفس Bin ID اللي استخدمناه
const masterKey = "$2a$10$V6m/7anDHsUmD8PNxlVHr.49kh2pau1VkKaQVzbUaPLwuyRa861Pe";
const OWNER_ID = "61553754531086";

const config = {
  name: "ظفو",
  version: "1.0.0",
  description: "عرض كل ردود مشمش",
  usage: "'الكل' أو سؤال موجود في الردود",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "Rako San",
};

const langData = {
  ar_SY: {
    allResponsesHeader: "📦 كل الردود المحفوظة:",
    noResponses: "ما في أي ردود محفوظة حالياً.",
    notOwner: "الأمر ده مخصص لصاحب البوت فقط.",
    missingInput: "اها يا عثل عايز شنو •-•؟ ",
    noResult: "ما لقيت رد للكلمة دي 😕",
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

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeText(text) {
  return text
.replace(/[أإآ]/g, 'ا')
.replace(/ة/g, 'ه')
.replace(/ى/g, 'ي')
.replace(/[؟?!.,،؛]/g, '')
.replace(/\s+/g, ' ')
.trim()
.toLowerCase();
}

async function onCall({ message, args, getLang}) {
  const input = args.join(" ").trim();
  const data = await loadData();

  if (!input) return message.reply(getLang("missingInput"));

  if (input === "الكل") {
    if (message.senderID!== OWNER_ID) {
      return message.reply(getLang("notOwner"));
}

    const keys = Object.keys(data);
    if (keys.length === 0) return message.reply(getLang("noResponses"));

    let reply = getLang("allResponsesHeader") + "\n\n";
    for (const key of keys) {
      reply += `📌 ${key}:\n`;
      data[key].forEach((r, i) => {
        reply += `   ${i + 1}. ${r}\n`;
});
      reply += "\n";
}

    return message.reply(reply.length> 1999? reply.slice(0, 1999): reply);
}

  const normalizedInput = normalizeText(input);
  let matchedKey = Object.keys(data).find(key => normalizeText(key) === normalizedInput);

  if (!matchedKey) {
    matchedKey = Object.keys(data).find(key => normalizeText(key).includes(normalizedInput));
}

  if (!matchedKey) return message.reply(getLang("noResult"));
  return message.reply(getRandom(data[matchedKey]));
}

export default {
  config,
  langData,
  onCall,
};
