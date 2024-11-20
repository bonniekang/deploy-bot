import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // For guild-related events
    GatewayIntentBits.GuildMessages, // For reading messages in guilds
    GatewayIntentBits.MessageContent, // For reading message content
  ],
});

// Discord bot token from the Developer Portal
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Vercel deployment webhook URL
const VERCEL_WEBHOOK_URL = process.env.VERCEL_WEBHOOK_URL;

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  console.log(message.content, "message");
  // Listen for "publish" in a specific channel or DM
  if (message.content.toLowerCase() === "publish" && !message.author.bot) {
    message.reply(
      'Are you sure you want to deploy? Reply with "yes" to confirm.'
    );

    // Wait for user's confirmation
    const filter = (response) =>
      response.content.toLowerCase() === "yes" &&
      response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async () => {
      message.reply("Triggering deployment...");
      try {
        const response = await fetch(VERCEL_WEBHOOK_URL, {
          method: "POST",
        });

        if (response.ok) {
          message.channel.send("Deployment triggered successfully!");
        } else {
          message.channel.send(
            `Failed to trigger deployment. Server responded with status: ${response.status}`
          );
        }
      } catch (error) {
        message.channel.send(
          "Failed to trigger deployment. Please check the webhook URL."
        );
        console.error("Error triggering deployment:", error);
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        message.reply("Deployment cancelled due to no confirmation.");
      }
    });
  }
});

// Log in to Discord
client.login(DISCORD_TOKEN);
