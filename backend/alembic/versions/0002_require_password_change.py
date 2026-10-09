"""Require temporary passwords to be changed."""
from alembic import op
import sqlalchemy as sa
revision="0002"; down_revision="0001"; branch_labels=None; depends_on=None
def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.true()))
        batch.add_column(sa.Column("auth_version", sa.Integer(), nullable=False, server_default="0"))
def downgrade():
    with op.batch_alter_table("users") as batch:
        batch.drop_column("auth_version")
        batch.drop_column("must_change_password")
