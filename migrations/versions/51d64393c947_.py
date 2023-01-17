"""empty message

Revision ID: 51d64393c947
Revises: ef0e6e177626
Create Date: 2023-01-17 11:58:20.588353

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '51d64393c947'
down_revision = 'ef0e6e177626'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(length=15), nullable=False),
    sa.Column('user_pw', sa.String(length=15), nullable=False),
    sa.Column('name', sa.String(length=15), nullable=True),
    sa.Column('eng_name', sa.String(length=15), nullable=True),
    sa.Column('mobileno', sa.String(length=30), nullable=True),
    sa.Column('email', sa.String(length=50), nullable=True),
    sa.Column('category', sa.Integer(), nullable=False),
    sa.Column('register_no', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('register_no')
    )
    op.create_table('ban',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('register_no', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(length=30), nullable=True),
    sa.Column('teacher_id', sa.Integer(), nullable=True),
    sa.Column('semester', sa.Integer(), nullable=False),
    sa.Column('notice_num', sa.Integer(), nullable=True),
    sa.Column('inquiry_num', sa.Integer(), nullable=True),
    sa.Column('not_answered_inquiry_num', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['teacher_id'], ['user.register_no'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('register_no')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('ban')
    op.drop_table('user')
    # ### end Alembic commands ###
