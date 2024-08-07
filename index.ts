import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";

import SampleCommand from "./commands/sample";

dotenv.config();

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

class SampleBot {
  constructor() {}

  async run() {
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
          try {
            await interaction.reply({
              content: "There was an error while executing this command.",
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
    });

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token as string);

    const commandsToRegister = [SampleCommand];

    const registerBody = commandsToRegister.map((command) =>
      command.data.toJSON(),
    );

    (async () => {
      try {
        console.log(`Started refreshing 1 application (/) commands.`);
        /* await rest.put(
      Routes.applicationGuildCommands(String(clientID), String(guildID)),
      { body: [] },
    );
    console.log("Successfully deleted all guild commands.");

    // for global commands
    await rest.put(Routes.applicationCommands(String(clientID)), { body: [] });
    console.log("Successfully deleted all application commands.");*/

        // The put method is used to fully refresh all commands in the guild with the current set
        await rest.put(Routes.applicationCommands(String(clientID)), {
          body: registerBody,
        });
        console.log(`Successfully reloaded 1 application (/) commands.`);
      } catch (error) {
        console.error(error);
      }
    })();

    client.once(Events.ClientReady, () => {
      console.log("Server is ready to start processing things.");
    });

    client.login(token);
  }
}

const bot = new SampleBot();
bot.run();

export default SampleBot;
