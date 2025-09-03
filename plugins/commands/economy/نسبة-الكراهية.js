const config = {
  name:  "كراهية",
  description: "احسب نسبة الكراهية بينك وبين شخص",
  usage: "[اسم الشخص]",
  cooldown: 3,
  permissions: [0],
  credits: "Rako San",
};

export default function ({ message, args}) {
  const name = args.join(" ");
  if (!name) return message.reply("🐸💔 وريني اسم الزول التاني عشان أحسب الكراهية!");

  const hateRate = Math.floor(Math.random() * 101);
  const emoji = hateRate> 80? "😡": hateRate> 50? "😤": "😐";

  message.reply(`نسبة الكراهية بينك وبين ${name}: ${hateRate}% ${emoji}`);
}


