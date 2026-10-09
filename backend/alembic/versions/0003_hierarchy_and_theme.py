"""Period-course-group hierarchy, group date, and per-user theme.

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("theme_color", sa.String(7), nullable=False, server_default="#526d82"))
    with op.batch_alter_table("courses") as batch:
        batch.add_column(sa.Column("period_id", sa.Integer(), nullable=True))
        batch.create_foreign_key("fk_courses_period", "academic_periods", ["period_id"], ["id"])
        batch.create_index("ix_courses_period_id", ["period_id"])
    with op.batch_alter_table("student_groups") as batch:
        batch.add_column(sa.Column("presentation_date", sa.Date(), nullable=True))
    op.execute("UPDATE courses SET period_id=(SELECT period_id FROM student_groups WHERE student_groups.course_id=courses.id ORDER BY id LIMIT 1)")
    op.execute("UPDATE student_groups SET presentation_date=(SELECT session_date FROM presentation_sessions WHERE presentation_sessions.group_id=student_groups.id ORDER BY session_date LIMIT 1)")


def downgrade():
    with op.batch_alter_table("student_groups") as batch: batch.drop_column("presentation_date")
    with op.batch_alter_table("courses") as batch:
        batch.drop_index("ix_courses_period_id"); batch.drop_constraint("fk_courses_period", type_="foreignkey"); batch.drop_column("period_id")
    with op.batch_alter_table("users") as batch: batch.drop_column("theme_color")
