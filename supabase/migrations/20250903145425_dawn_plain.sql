/*
  # 注意力追踪器数据库架构

  1. 新建表
    - `activities` - 活动记录表
      - `id` (text, 主键) - 活动唯一标识符
      - `activity_name` (text) - 活动名称
      - `start_time` (timestamptz) - 开始时间
      - `end_time` (timestamptz) - 结束时间
      - `duration_minutes` (integer) - 持续时间（分钟）
      - `continued_from` (text) - 连续活动的上一个ID
      - `is_part_of_series` (boolean) - 是否为系列活动
      - `note` (text) - 备注信息
      - `color` (text) - 活动颜色
      - `created_at` (timestamptz) - 创建时间
      - `updated_at` (timestamptz) - 更新时间

    - `current_activities` - 当前活动表
      - `id` (text, 主键) - 活动ID
      - `activity_name` (text) - 活动名称
      - `start_time` (timestamptz) - 开始时间
      - `paused_time_ms` (bigint) - 暂停时间（毫秒）
      - `total_elapsed_ms` (bigint) - 总经过时间（毫秒）
      - `state` (text) - 状态（running/paused/stopped）
      - `last_update` (timestamptz) - 最后更新时间

    - `activity_stats` - 活动统计表
      - `id` (uuid, 主键) - 统计记录ID
      - `date` (date) - 统计日期
      - `activity_name` (text) - 活动名称
      - `total_minutes` (integer) - 当日总时间
      - `session_count` (integer) - 当日会话数
      - `created_at` (timestamptz) - 创建时间

  2. 安全设置
    - 为所有表启用行级安全（RLS）
    - 添加基本的读写策略（暂时允许所有操作，后续可根据需要添加用户认证）

  3. 索引优化
    - 为常用查询字段添加索引
    - 优化时间范围查询性能
*/

-- 创建活动记录表
CREATE TABLE IF NOT EXISTS activities (
    id text PRIMARY KEY,
    activity_name text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    duration_minutes integer DEFAULT 0,
    continued_from text,
    is_part_of_series boolean DEFAULT false,
    note text,
    color text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建当前活动表
CREATE TABLE IF NOT EXISTS current_activities (
    id text PRIMARY KEY,
    activity_name text NOT NULL,
    start_time timestamptz NOT NULL,
    paused_time_ms bigint DEFAULT 0,
    total_elapsed_ms bigint DEFAULT 0,
    state text DEFAULT 'running' CHECK (state IN ('running', 'paused', 'stopped')),
    last_update timestamptz DEFAULT now()
);

-- 创建活动统计表
CREATE TABLE IF NOT EXISTS activity_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    activity_name text NOT NULL,
    total_minutes integer DEFAULT 0,
    session_count integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    UNIQUE(date, activity_name)
);

-- 创建多计时器数据表
CREATE TABLE IF NOT EXISTS multi_timers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timer_name text NOT NULL UNIQUE,
    start_time timestamptz,
    elapsed_time_ms bigint DEFAULT 0,
    is_running boolean DEFAULT false,
    laps jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_activity_name ON activities(activity_name);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_stats_date ON activity_stats(date);
CREATE INDEX IF NOT EXISTS idx_activity_stats_activity_name ON activity_stats(activity_name);
CREATE INDEX IF NOT EXISTS idx_current_activities_state ON current_activities(state);
CREATE INDEX IF NOT EXISTS idx_multi_timers_is_running ON multi_timers(is_running);

-- 启用行级安全
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_timers ENABLE ROW LEVEL SECURITY;

-- 创建基本的安全策略（允许所有操作，后续可根据需要添加用户认证）
CREATE POLICY "Allow all operations on activities"
    ON activities
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on current_activities"
    ON current_activities
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on activity_stats"
    ON activity_stats
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on multi_timers"
    ON multi_timers
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为activities表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为multi_timers表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_multi_timers_updated_at ON multi_timers;
CREATE TRIGGER update_multi_timers_updated_at
    BEFORE UPDATE ON multi_timers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();