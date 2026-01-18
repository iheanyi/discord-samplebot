import tempfile
from pathlib import Path

import discord
import yt_dlp
from discord import app_commands
from discord.ext import commands


class Sample(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="sample", description="Download an audio sample from a URL")
    @app_commands.describe(url="URL to download audio from (YouTube, SoundCloud, etc.)")
    async def sample(self, interaction: discord.Interaction, url: str):
        await interaction.response.send_message("Attempting to download sample...")

        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                output_template = str(Path(tmpdir) / "%(title)s.%(ext)s")

                ydl_opts = {
                    "format": "bestaudio/best",
                    "outtmpl": output_template,
                    "postprocessors": [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "mp3",
                            "preferredquality": "192",
                        }
                    ],
                    "quiet": True,
                    "no_warnings": True,
                    "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
                }

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    title = info.get("title", "Unknown Title")
                    uploader = info.get("uploader", "Unknown Creator")

                # Find the downloaded mp3 file
                mp3_files = list(Path(tmpdir).glob("*.mp3"))
                if not mp3_files:
                    raise Exception("No audio file was created")

                audio_file = mp3_files[0]
                filename = f"{title} - {uploader}.mp3"

                # Check file size (Discord limit is 25MB for regular, 100MB for nitro)
                file_size = audio_file.stat().st_size
                if file_size > 25 * 1024 * 1024:
                    await interaction.followup.send(
                        f"File is too large to upload ({file_size / 1024 / 1024:.1f}MB). "
                        "Discord limit is 25MB."
                    )
                    return

                discord_file = discord.File(audio_file, filename=filename)
                await interaction.followup.send(
                    content=f"{interaction.user.mention} Your sample is ready!",
                    file=discord_file,
                )
                print(f"Successfully downloaded sample: {filename}")

        except Exception as e:
            print(f"Error downloading sample: {e}")
            await interaction.followup.send(
                f"There was an error while executing this command.\n```\n{e!s}\n```"
            )


async def setup(bot: commands.Bot):
    await bot.add_cog(Sample(bot))
