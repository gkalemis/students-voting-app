"""Require temporary passwords to be changed."""
from alembic import op
import sqlalchemy as sa
revision="0002"; down_revision="0001"; branch_labels=None; depends_on=None


def column_names():
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}


def upgrade():
    existing = column_names()
    if "must_change_password" not in existing:
        op.add_column("users", sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.true()))
    if "auth_version" not in existing:
        op.add_column("users", sa.Column("auth_version", sa.Integer(), nullable=False, server_default="0"))


def downgrade():
    existing = column_names()
    if "auth_version" in existing:
        op.drop_column("users", "auth_version")
    if "must_change_password" in existing:
        op.drop_column("users", "must_change_password")
