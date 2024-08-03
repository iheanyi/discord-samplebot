import fs from "node:fs";

import ytdl from "@distube/ytdl-core";
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  codeBlock,
  SlashCommandBuilder,
} from "discord.js";
import ffmpeg from "fluent-ffmpeg";
import { temporaryFileTask } from "tempy";

async function youtubeSampleSource(url: string, filepath: string) {
  const info = await ytdl.getInfo(url);
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

  const data = await fs.promises.readFile(filepath);
  return { data, title: info.videoDetails.title };
}

async function downloadSample(url: string, interaction: any) {
  const allowedHosts = [
    "youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtube.com",
    "music.youtube.com",
  ];
  const defaultFormat = "mp3";

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
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const url = interaction.options.getString("url", true);
    try {
      await interaction.reply("Attempting to download sample...");
      await downloadSample(url, interaction);
    } catch (err: any) {
      console.error(err);
      try {
        await interaction.followUp({
          content: `There was an error while executing this command. ${codeBlock(err.toString())}`,
        });
      } catch (error) {
        console.error(error);
      }
    }
  },
};

export default command;
