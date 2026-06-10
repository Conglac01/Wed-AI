"""Create jobs table

Revision ID: 002
Revises: 001
Create Date: 2026-06-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        # BaseEntity columns
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "deleted_at",
            sa.DateTime(),
            nullable=True,
        ),
        # Required
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        # Optional metadata
        sa.Column("company_logo_url", sa.String(1024), nullable=True),
        sa.Column("salary_text", sa.String(255), nullable=True),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("skills", postgresql.JSONB(), nullable=True),
        sa.Column("requirements", sa.Text(), nullable=True),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column("deadline", sa.String(50), nullable=True),
        # Source tracking
        sa.Column("source_name", sa.String(100), nullable=True),
        sa.Column("source_url", sa.String(1024), nullable=True),
        # Quality & status
        sa.Column(
            "quality_score",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0.0"),
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("TRUE"),
        ),
        # Constraints
        sa.PrimaryKeyConstraint("id", name=op.f("pk_jobs")),
    )


def downgrade() -> None:
    op.drop_table("jobs")
