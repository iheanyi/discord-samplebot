import os
import asyncio

import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()


class SampleBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)

    async def setup_hook(self):
        await self.load_extension("cogs.sample")
        await self.tree.sync()
        print(f"Synced slash commands for {self.user}")

    async def on_ready(self):
        print(f"Server is ready to start processing things.")
        print(f"Logged in as {self.user} (ID: {self.user.id})")


async def main():
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        raise ValueError("DISCORD_BOT_TOKEN environment variable is not set")

    bot = SampleBot()
    async with bot:
        await bot.start(token)


if __name__ == "__main__":
    asyncio.run(main())
