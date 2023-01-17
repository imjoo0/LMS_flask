"""empty message

Revision ID: ef0e6e177626
Revises: 
Create Date: 2023-01-16 11:21:12.488683

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'ef0e6e177626'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('question',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('subject', sa.String(length=200), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('create_date', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('answer',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=True),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('create_date', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['question_id'], ['question.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.drop_table('user')
    op.drop_table('consultinghistory')
    op.drop_table('class_switch_student')
    op.drop_table('workcategory')
    op.drop_table('class_student')
    op.drop_table('consulting')
    op.drop_table('student')
    op.drop_table('class_work')
    op.drop_table('consultingcategory')
    op.drop_table('class_out_student')
    op.drop_table('work')
    op.drop_table('class_refund_student')
    op.drop_table('ban')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('ban',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('register_no', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('name', mysql.VARCHAR(length=70), nullable=False),
    sa.Column('level', mysql.VARCHAR(length=30), nullable=True),
    sa.Column('teacher_id', mysql.VARCHAR(length=30), nullable=True),
    sa.Column('name_numeric', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('is_main', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_refund_student',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('r_classes', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('r_students', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('work',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('category_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('contents', mysql.MEDIUMTEXT(), nullable=False),
    sa.Column('url', mysql.VARCHAR(length=50), nullable=True),
    sa.Column('priority', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('startdate', sa.DATE(), server_default=sa.text('(curdate())'), nullable=True),
    sa.Column('deadline', sa.DATE(), server_default=sa.text('(curdate())'), nullable=True),
    sa.Column('cycle', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_out_student',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('o_classes', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('o_students', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('consultingcategory',
    sa.Column('id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('name', mysql.VARCHAR(length=30), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_work',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('cw_classes', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('cw_works', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('done', mysql.INTEGER(), server_default=sa.text("'0'"), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('student',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('original', mysql.VARCHAR(length=30), nullable=False),
    sa.Column('class_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('name', mysql.VARCHAR(length=30), nullable=True),
    sa.Column('register_no', mysql.VARCHAR(length=30), nullable=False),
    sa.Column('mobileno', mysql.VARCHAR(length=50), nullable=True),
    sa.Column('parent_name', mysql.VARCHAR(length=20), nullable=True),
    sa.Column('parent_mobileno', mysql.VARCHAR(length=50), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('consulting',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('class_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('category_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('student_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('contents', mysql.TEXT(), nullable=True),
    sa.Column('date', mysql.DATETIME(), nullable=True),
    sa.Column('deadline', mysql.DATETIME(), nullable=True),
    sa.Column('missed', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_student',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('cs_classes', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('cs_students', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('workcategory',
    sa.Column('id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('name', mysql.VARCHAR(length=30), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('class_switch_student',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('s_classes', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('s_students', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('consultinghistory',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('consulting_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('consulting_contents', mysql.TEXT(), nullable=True),
    sa.Column('reason', mysql.TEXT(), nullable=False),
    sa.Column('solution', mysql.TEXT(), nullable=False),
    sa.Column('result', mysql.TEXT(), nullable=False),
    sa.Column('date', mysql.DATETIME(), nullable=True),
    sa.Column('missed', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_table('user',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', mysql.VARCHAR(length=30), nullable=False),
    sa.Column('user_pw', mysql.VARCHAR(length=30), nullable=False),
    sa.Column('name', mysql.VARCHAR(length=30), nullable=True),
    sa.Column('mobileno', mysql.VARCHAR(length=30), nullable=True),
    sa.Column('email', mysql.VARCHAR(length=50), nullable=True),
    sa.Column('category', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('register_no', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.drop_table('answer')
    op.drop_table('question')
    # ### end Alembic commands ###
