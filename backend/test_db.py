import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect('postgresql://postgres.gqcedafwavkggyqwqmdb:xHc4mIpmu6fFwttV@aws-0-ap-south-1.pooler.supabase.com:6543/postgres')
        print("Success ap-south-1!")
        await conn.close()
    except Exception as e:
        print("Failed ap-south-1:", e)
        
    try:
        conn = await asyncpg.connect('postgresql://postgres.gqcedafwavkggyqwqmdb:xHc4mIpmu6fFwttV@aws-0-eu-central-1.pooler.supabase.com:6543/postgres')
        print("Success eu-central-1!")
        await conn.close()
    except Exception as e:
        print("Failed eu-central-1:", e)

asyncio.run(main())
