from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load .env file from root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

from app.models.base import Base
from app.models import *

target_metadata = Base.metadata

db_url = os.getenv("DATABASE_URL", "")
# Safely URL-encode the password to prevent parsing errors with special chars or brackets
if db_url.startswith("postgresql://"):
    import urllib.parse
    # Format: postgresql://user:password@host:port/db
    try:
        parts = db_url.split("@")
        if len(parts) == 2:
            auth_part = parts[0]
            host_part = parts[1]
            auth_split = auth_part.split("://")[1].split(":")
            if len(auth_split) == 2:
                user = auth_split[0]
                password = auth_split[1]
                encoded_password = urllib.parse.quote_plus(password)
                db_url = f"postgresql://{user}:{encoded_password}@{host_part}"
    except Exception:
        pass

# configparser uses % for interpolation, so we must escape it as %%
config.set_main_option("sqlalchemy.url", db_url.replace("%", "%%"))

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    connectable = create_engine(db_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
