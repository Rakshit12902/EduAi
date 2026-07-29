"""add_accent_color_to_user_settings

Revision ID: bf1e3f7efbae
Revises: 2b0cd82adff4
Create Date: 2026-07-29 23:58:34.750600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf1e3f7efbae'
down_revision: Union[str, None] = '2b0cd82adff4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the Enum type first
    op.execute("CREATE TYPE appaccentcolor AS ENUM ('emerald', 'teal', 'sky', 'violet')")
    
    # Add the column using the new Enum type with a default value
    op.add_column('user_settings', sa.Column('accent_color', sa.Enum('emerald', 'teal', 'sky', 'violet', name='appaccentcolor'), nullable=False, server_default='violet'))


def downgrade() -> None:
    # Drop the column
    op.drop_column('user_settings', 'accent_color')
    
    # Drop the Enum type
    op.execute("DROP TYPE appaccentcolor")
