"""Fix auth trigger upsert and exception handling

Revision ID: e7c2f1a94b8d
Revises: bf1e3f7efbae
Create Date: 2026-08-25 12:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e7c2f1a94b8d'
down_revision: Union[str, None] = 'bf1e3f7efbae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.user_profiles (id, email, full_name, avatar_url, created_at, updated_at)
          VALUES (
            new.id,
            COALESCE(new.email, new.id::text || '@placeholder.edu'),
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
            now(),
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
            updated_at = now();
          RETURN new;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN new;
        END;
        $$;
        
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    """)

def downgrade() -> None:
    pass
