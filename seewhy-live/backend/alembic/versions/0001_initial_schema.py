"""Initial schema — all tables

Revision ID: 0001
Revises:
Create Date: 2026-04-28
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("role", sa.Enum("viewer", "creator", "admin", name="user_role"), nullable=False, server_default="viewer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("follower_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("following_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("stream_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    # streams
    op.create_table(
        "streams",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("creator_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("tags", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.Enum("scheduled", "live", "ended", name="stream_status"), nullable=False, server_default="scheduled"),
        sa.Column("stream_key", sa.String(64), nullable=False, unique=True),
        sa.Column("hls_url", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("viewer_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("peak_viewer_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_streams_creator_id", "streams", ["creator_id"])
    op.create_index("ix_streams_category", "streams", ["category"])

    # why_questions
    op.create_table(
        "why_questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("stream_id", sa.String(36), sa.ForeignKey("streams.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("upvotes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("ai_answer", sa.Text, nullable=True),
        sa.Column("is_answered", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_why_questions_stream_id", "why_questions", ["stream_id"])

    # chat_messages
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("stream_id", sa.String(36), sa.ForeignKey("streams.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_why_question", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_chat_messages_stream_id", "chat_messages", ["stream_id"])

    # follows
    op.create_table(
        "follows",
        sa.Column("follower_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("following_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # transactions
    op.create_table(
        "transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("stream_id", sa.String(36), sa.ForeignKey("streams.id"), nullable=True),
        sa.Column("sender_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("creator_amount", sa.Float, nullable=False),
        sa.Column("platform_amount", sa.Float, nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("stripe_payment_intent", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("transactions")
    op.drop_table("follows")
    op.drop_table("chat_messages")
    op.drop_table("why_questions")
    op.drop_table("streams")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS stream_status")
    op.execute("DROP TYPE IF EXISTS user_role")
