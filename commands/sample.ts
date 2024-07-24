import { AttachmentBuilder, SlashCommandBuilder, codeBlock } from "discord.js";
import fs from "node:fs";
import { temporaryFileTask } from "tempy";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";

async function youtubeSampleSource(url: string, filepath: string) {
  let info = await ytdl.getInfo(url);
  await new Promise<void>((resolve, reject) =>
    ffmpeg(
      ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
      }),
    )
      .format("mp3")
      .on("error", (e: Error) => reject(e))
      .on("end", () => resolve())
      .save(filepath),
  );

  let data = await fs.promises.readFile(filepath);
  return { data, title: info.videoDetails.title };
}

async function downloadSample(url: string, interaction: any) {
  let allowedHosts = [
    "youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtube.com",
    "music.youtube.com",
  ];
  let defaultFormat = "mp3";

  const { hostname } = new URL(url);
  if (allowedHosts.includes(hostname.toString())) {
    const user = interaction.user;
    await temporaryFileTask(async (filename) => {
      const { data, title } = await youtubeSampleSource(url, filename);
      const file = new AttachmentBuilder(data).setName(
        `${title}.${defaultFormat}`,
      );
      console.log("Successfully downloaded sample!");
      await interaction.followUp({
        content: `${user} Your sample is ready!`,
        files: [file],
      });
    });
  } else {
    throw new Error(`url "${url}" is not supported`);
  }
}

const command = {
  name: "sample",
  data: new SlashCommandBuilder()
    .setName("sample")
    .setDescription("Download a sample from YouTube")
    .addStringOption((option) => {
      return option
        .setName("url")
        .setDescription("YouTube URL to download")
        .setRequired(true);
    }),
  // @ts-ignore
  async execute(interaction): Promise<void> {
    const url = interaction.options.getString("url");
    try {
      await interaction.reply("Attempting to download sample...");
      await downloadSample(url, interaction);
    } catch (err: any) {
      console.error(err);
      await interaction.followUp({
        content: `There was an error while executing this command. ${codeBlock(err.toString())}`,
      });
    }
  },
};

export default command;
