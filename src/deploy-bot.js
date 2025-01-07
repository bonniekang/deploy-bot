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
  // "publish" command: Deploy content
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

  // "revalidate" command: Trigger revalidation
  if (
    message.content.toLowerCase().startsWith("revalidate") &&
    !message.author.bot
  ) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      message.reply(
        "Usage: revalidate <pageId>. Please provide the pageId to revalidate."
      );
      return;
    }

    const pageId = args[1];

    message.reply(
      `Are you sure you want to revalidate the page with ID: ${pageId}? Reply with "yes" to confirm.`
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
      message.reply("Triggering revalidation...");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/revalidate-path?pageId=${pageId}`,
          { method: "GET" }
        );

        if (response.ok) {
          const result = await response.json();
          message.channel.send(
            `Revalidation triggered successfully for path: ${result.path}`
          );
        } else {
          const error = await response.json();
          message.channel.send(
            `Failed to revalidate path. Server responded with status: ${response.status}. Error: ${error.message}`
          );
        }
      } catch (error) {
        message.channel.send(
          "Failed to trigger revalidation. Please check the API endpoint."
        );
        console.error("Error triggering revalidation:", error);
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        message.reply("Revalidation cancelled due to no confirmation.");
      }
    });
  }
});

// Log in to Discord
client.login(DISCORD_TOKEN);
