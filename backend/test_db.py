import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set in environment.")
        return
        
    try:
        conn = await asyncpg.connect(db_url)
        print("Database connection test succeeded!")
        await conn.close()
    except Exception as e:
        print("Database connection test failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
