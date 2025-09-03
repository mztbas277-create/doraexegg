export default async function ({ message}) {
  const { performance} = await import("perf_hooks");

  const timeStart = performance.now();

  await message.reply("⏳ جاري قياس السرعة...");

  const timeEnd = performance.now();
  const ping = Math.floor(timeEnd - timeStart);

  let level = "";
  let advice = "";

  if (ping <= 150) {
    level = "🔋 عالي";
    advice = "الاستجابة ممتازة، البوت يعمل بكفاءة عالية.";
} else if (ping <= 400) {
    level = "⚡ متوسط";
    advice = "الاستجابة جيدة، لكن يُفضل تقليل الضغط على البوت.";
} else {
    level = "🐢 ضعيف";
    advice = "الاستجابة بطيئة، قد يكون هناك ضغط على السيرفر أو ضعف في الاتصال.";
}

  return message.reply(
    `📶 تم القياس بنجاح!\n\n📍 النتيجة: ${ping}ms\n📊 التصنيف: ${level}\n💡 نصيحة: ${advice}`
);
}