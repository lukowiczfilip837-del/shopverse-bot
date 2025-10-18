// === IMPORTY ===
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const express = require('express');

// === UTRZYMANIE AKTYWNOŚCI (dla Replit lub hostingu) ===
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('✅ Shopverse bot działa!'));
app.listen(PORT, () => console.log(`🌐 Serwer działa na porcie ${PORT}`));

// === KONFIGURACJA ===
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1429037840150564876'; // <--- ID kanału, gdzie ma wysyłać wiadomość

// === UTWORZENIE KLIENTA ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// === GOTOWOŚĆ BOTA ===
client.once('ready', async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
  await sendLegitMessage();
});

// === FUNKCJA WYSYŁAJĄCA WIADOMOŚĆ ===
async function sendLegitMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Shopverse × CZY LEGIT?')
      .setDescription('Reakcja ❌ bez dowodu skutkuje natychmiastową **7-dniową przerwą**.')
      .setFooter({ text: 'Shopverse Security System' });

    const message = await channel.send({ embeds: [embed] });
    await message.react('✅');
    await message.react('❌');
    console.log('📢 Wiadomość wysłana!');
  } catch (err) {
    console.error('❌ Błąd przy wysyłaniu wiadomości:', err);
  }
}

// === OBSŁUGA REAKCJI ===
client.on('messageReactionAdd', async (reaction, user) => {
  try {
    if (user.bot) return;

    // Upewnij się, że partiale są pełne
    if (reaction.partial) {
      try { await reaction.fetch(); } catch (err) { return console.error('❌ Nie udało się fetchować reaction:', err); }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch (err) { return console.error('❌ Nie udało się fetchować message:', err); }
    }

    // Sprawdź kanał i wiadomość
    if (reaction.message.channel.id !== CHANNEL_ID) return;
    const embed = reaction.message.embeds && reaction.message.embeds[0];
    if (!embed || !embed.title || !embed.title.includes('Shopverse')) return;

    // Tylko ❌ nas interesuje
    if (reaction.emoji.name !== '❌') return;

    // Usuń reakcję użytkownika
    try {
      await reaction.users.remove(user.id);
      console.log(`🧹 Usunięto reakcję ❌ od ${user.tag}`);
    } catch (err) {
      console.error('⚠️ Nie udało się usunąć reakcji użytkownika:', err);
    }

    // Timeout 7 dni
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return console.log('⚠️ Nie znaleziono członka w gildii.');

    const timeoutDuration = 7 * 24 * 60 * 60 * 1000;
    try {
      await member.timeout(timeoutDuration, 'Reakcja ❌ bez dowodu.');
      console.log(`🚫 ${user.tag} otrzymał timeout 7 dni.`);
    } catch (err) {
      console.error('❌ Błąd przy nadawaniu timeoutu:', err);
    }

    // DM do użytkownika
    try {
      await user.send('🚫 Otrzymałeś 7-dniową przerwę za reakcję ❌ bez dowodu.');
    } catch {
      console.log(`💬 Nie udało się wysłać DM do ${user.tag}`);
    }
  } catch (err) {
    console.error('❌ Błąd w obsłudze reakcji:', err);
  }
});

// === START BOTA ===
client.login(TOKEN);

