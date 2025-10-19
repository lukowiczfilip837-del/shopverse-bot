// === IMPORTY ===
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const express = require("express");

// === UTRZYMANIE AKTYWNOŚCI (dla Replit lub Render) ===
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("✅ Shopverse bot działa!"));
app.listen(PORT, () => console.log(`🌐 Serwer działa na porcie ${PORT}`));

// === KONFIGURACJA ===
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1429037840150564876"; // ID kanału

// === UTWORZENIE KLIENTA ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// === GOTOWOŚĆ BOTA ===
client.once("ready", async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
  await sendLegitMessage();
});

// === FUNKCJA WYSYŁAJĄCA WIADOMOŚĆ (z zabezpieczeniem przed duplikatami) ===
async function sendLegitMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    // Sprawdź, czy wiadomość już istnieje (szuka embed z tytułem Shopverse)
    const messages = await channel.messages.fetch({ limit: 10 });
    const existing = messages.find(
      (msg) =>
        msg.embeds.length > 0 &&
        msg.embeds[0].title?.includes("Shopverse × CZY LEGIT?")
    );

    if (existing) {
      console.log("✅ Wiadomość już istnieje — nie wysyłam nowej.");
      return;
    }

    // Jeśli nie ma — wyślij nową
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Shopverse × CZY LEGIT?")
      .setDescription(
        "Reakcja ❌ bez dowodu skutkuje natychmiastową **7-dniową przerwą**."
      )
      .setFooter({ text: "Shopverse Security System" });

    const message = await channel.send({ embeds: [embed] });
    await message.react("✅");
    await message.react("❌");
    console.log("📢 Nowa wiadomość wysłana!");
  } catch (err) {
    console.error("❌ Błąd przy wysyłaniu wiadomości:", err);
  }
}

// === OBSŁUGA REAKCJI ===
client.on("messageReactionAdd", async (reaction, user) => {
  try {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch().catch(() => null);
    if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

    if (reaction.message.channel.id !== CHANNEL_ID) return;
    const embed = reaction.message.embeds?.[0];
    if (!embed || !embed.title?.includes("Shopverse")) return;

    if (reaction.emoji.name !== "❌") return;

    // Usuń reakcję użytkownika
    try {
      await reaction.users.remove(user.id);
      console.log(`🧹 Usunięto reakcję ❌ od ${user.tag}`);
    } catch (err) {
      console.error("⚠️ Nie udało się usunąć reakcji:", err);
    }

    // Timeout 7 dni
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return console.log("⚠️ Nie znaleziono członka w gildii.");

    const timeoutDuration = 7 * 24 * 60 * 60 * 1000;
    try {
      await member.timeout(timeoutDuration, "Reakcja ❌ bez dowodu.");
      console.log(`🚫 ${user.tag} otrzymał timeout 7 dni.`);
    } catch (err) {
      console.error("❌ Błąd przy nadawaniu timeoutu:", err);
    }

    // DM do użytkownika
    try {
      await user.send("🚫 Otrzymałeś 7-dniową przerwę za reakcję ❌ bez dowodu.");
    } catch {
      console.log(`💬 Nie udało się wysłać DM do ${user.tag}`);
    }
  } catch (err) {
    console.error("❌ Błąd w obsłudze reakcji:", err);
  }
});

// === START BOTA ===
client.login(TOKEN);
