"""Add auth trigger for user_profiles

Revision ID: d8aeb9ef762e
Revises: 66a8b431a350
Create Date: 2026-07-23 21:59:43.496218

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8aeb9ef762e'
down_revision: Union[str, None] = '66a8b431a350'
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
            new.email,
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'avatar_url',
            now(),
            now()
          );
          RETURN new;
        END;
        $$;
        
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    """)


def downgrade() -> None:
    op.execute("""
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS public.handle_new_user();
    """)
