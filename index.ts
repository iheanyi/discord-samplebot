import dotenv from "dotenv";
dotenv.config();
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import SampleCommand from "./commands/sample";

const {
  DISCORD_APP_ID: clientID,
  DISCORD_BOT_TOKEN: token,
  DISCORD_DEV_SERVER_ID: guildID,
} = process.env;

const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sample") {
    try {
      // @ts-ignore
      await SampleCommand.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command.",
      });
    }
  }
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token as string);

const commandsToRegister = [SampleCommand];

const registerBody = commandsToRegister.map((command) => command.data.toJSON());

(async () => {
  try {
    console.log(`Started refreshing 1 application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
      Routes.applicationGuildCommands(String(clientID), String(guildID)),
      {
        body: registerBody,
      },
    );

    console.log(`Successfully reloaded 1 application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

client.once(Events.ClientReady, () => {
  console.log("Server is ready to start processing things.");
});

client.login(token);
