export const config = {
  name: "كازينو",
  description: "جرب حظك في ماكينة الكازينو",
  usage: "",
  cooldown: 5,
  permissions: [0],
  credits: "Rako San",
};

export default function ({ message}) {
  const icons = ["🍒", "🍋", "🍉", "💎", "7️⃣"];
  const spin = () => icons[Math.floor(Math.random() * icons.length)];

  const slot1 = spin();
  const slot2 = spin();
  const slot3 = spin();

  const win = slot1 === slot2 && slot2 === slot3;

  message.reply(
    `🎰 كازينو مشمشة :\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${win? "💰 كسبت الجائزة!": "😢 خسرت، جرب تاني!"}`
);
}