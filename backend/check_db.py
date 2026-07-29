import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv('.env')

async def main():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'])
    
    # Get function signatures
    query = '''
    SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('handle_new_user', 'rls_auto_enable');
    '''
    rows = await conn.fetch(query)
    for r in rows:
        print(f"{r['schema']}.{r['name']}({r['args']})")
        
    await conn.close()

asyncio.run(main())
