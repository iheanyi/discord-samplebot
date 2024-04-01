import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import urlParse from "url";
import tempfile from "tempfile";
import fs from "node:fs";
// @ts-ignore
import ffmpeg from "fluent-ffmpeg";
import ytdl from "ytdl-core";

async function youtubeSampleSource(url: string) {
  let info = await ytdl.getInfo(url);
  let filepath = tempfile({
    extension: `.mp3`,
  });
  await new Promise<void>((resolve, reject): void =>
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

async function downloadSample(url, interaction) {
  let allowedHosts = [
    "youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtube.com",
    "music.youtube.com",
  ];
  let defaultFormat = "mp3";

  // @eslint-ignore
  let { hostname } = urlParse.parse(url);
  if (allowedHosts.includes(hostname!.toString())) {
    const user = interaction.user;
    const { data, title } = await youtubeSampleSource(url);
    const file = new AttachmentBuilder(data).setName(
      `${title}.${defaultFormat}`,
    );
    console.log("Successfully downloaded sample!");
    await interaction.followUp({
      content: `${user} Your sample is ready!`,
      files: [file],
    });
  } else {
    throw new Error(`url "${url}" is not supported`);
  }
}

const command = {
  data: new SlashCommandBuilder()
    .setName("sample")
    .setDescription("Download a sample from YouTube")
    .addStringOption((option) => {
      return option
        .setName("url")
        .setDescription("YouTube URL to download the sample from")
        .setRequired(true);
    }),
  // @ts-ignore
  async execute(interaction): Promise<void> {
    const url = interaction.options.getString("url");
    try {
      await interaction.reply("Attempting to download sample...");
      await downloadSample(url, interaction);
    } catch (err) {
      console.error(err);
      await interaction.followUp({
        content: `There was an error while executing this command. ${err}`,
      });
    }
  },
};

export default command;
