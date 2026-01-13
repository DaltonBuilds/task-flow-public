// Analytics API routes
import { Hono } from 'hono';
import type { 
  Bindings, 
  AnalyticsSummary, 
  TasksByStatus, 
  TasksByPriority,
  CompletionTrend,
  VelocityData,
  ProjectBreakdown
} from '../types';
import { getLogger } from '../utils/logger';

const analytics = new Hono<{ Bindings: Bindings }>();

// Helper to get date strings
function getDateStrings() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toISOString().split('T')[0];
  
  // Start of this week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  
  // End of this week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  
  // Start of this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  
  // 30 days ago for trend data
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  
  // 8 weeks ago for velocity data
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(today.getDate() - 56);
  const eightWeeksAgoStr = eightWeeksAgo.toISOString().split('T')[0];
  
  return {
    todayStr,
    startOfWeekStr,
    endOfWeekStr,
    startOfMonthStr,
    thirtyDaysAgoStr,
    eightWeeksAgoStr
  };
}

// GET /api/analytics - Get analytics summary (all boards)
analytics.get('/', async (c) => {
  try {
    const boardId = c.req.query('board_id'); // Optional: filter to specific board
    const dates = getDateStrings();
    
    // Build the board filter condition
    const boardFilter = boardId ? 'AND t.board_id = ?' : '';
    const boardParams = boardId ? [boardId] : [];
    
    // 1. Total tasks count (active, non-archived, non-deleted)
    const totalTasksQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      ${boardFilter}
    `;
    const totalTasksResult = await c.env.DB.prepare(totalTasksQuery).bind(...boardParams).first<{ count: number }>();
    const totalTasks = totalTasksResult?.count || 0;
    
    // 2. Completed tasks (archived tasks that were moved to "Done" type columns)
    // We consider archived tasks as "completed" for analytics
    const completedTasksQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      ${boardFilter}
    `;
    const completedTasksResult = await c.env.DB.prepare(completedTasksQuery).bind(...boardParams).first<{ count: number }>();
    const completedTasks = completedTasksResult?.count || 0;
    
    // 3. Overdue tasks
    const overdueQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) < DATE(?)
      ${boardFilter}
    `;
    const overdueResult = await c.env.DB.prepare(overdueQuery).bind(dates.todayStr, ...boardParams).first<{ count: number }>();
    const overdueTasks = overdueResult?.count || 0;
    
    // 4. Due today
    const dueTodayQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) = DATE(?)
      ${boardFilter}
    `;
    const dueTodayResult = await c.env.DB.prepare(dueTodayQuery).bind(dates.todayStr, ...boardParams).first<{ count: number }>();
    const dueToday = dueTodayResult?.count || 0;
    
    // 5. Due this week
    const dueThisWeekQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      AND DATE(t.due_date) >= DATE(?) AND DATE(t.due_date) <= DATE(?)
      ${boardFilter}
    `;
    const dueThisWeekResult = await c.env.DB.prepare(dueThisWeekQuery)
      .bind(dates.todayStr, dates.endOfWeekStr, ...boardParams).first<{ count: number }>();
    const dueThisWeek = dueThisWeekResult?.count || 0;
    
    // 6. Completed this week (archived this week)
    const completedThisWeekQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${boardFilter}
    `;
    const completedThisWeekResult = await c.env.DB.prepare(completedThisWeekQuery)
      .bind(dates.startOfWeekStr, ...boardParams).first<{ count: number }>();
    const completedThisWeek = completedThisWeekResult?.count || 0;
    
    // 7. Completed this month
    const completedThisMonthQuery = `
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${boardFilter}
    `;
    const completedThisMonthResult = await c.env.DB.prepare(completedThisMonthQuery)
      .bind(dates.startOfMonthStr, ...boardParams).first<{ count: number }>();
    const completedThisMonth = completedThisMonthResult?.count || 0;
    
    // 8. Tasks by status (by column)
    const tasksByStatusQuery = boardId ? `
      SELECT c.id as column_id, c.name as column_name, COUNT(t.id) as count
      FROM columns c
      LEFT JOIN tasks t ON t.column_id = c.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
      WHERE c.board_id = ? AND c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.position ASC
    ` : `
      SELECT c.id as column_id, c.name as column_name, COUNT(t.id) as count
      FROM columns c
      LEFT JOIN tasks t ON t.column_id = c.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.position ASC
    `;
    const tasksByStatusResult = await c.env.DB.prepare(tasksByStatusQuery)
      .bind(...(boardId ? [boardId] : [])).all<{ column_id: string; column_name: string; count: number }>();
    
    const statusTotal = (tasksByStatusResult.results || []).reduce((sum: number, row: { column_id: string; column_name: string; count: number }) => sum + row.count, 0) || 1;
    const tasksByStatus: TasksByStatus[] = (tasksByStatusResult.results || []).map((row: { column_id: string; column_name: string; count: number }) => ({
      column_id: row.column_id,
      column_name: row.column_name,
      count: row.count,
      percentage: Math.round((row.count / statusTotal) * 100)
    }));
    
    // 9. Tasks by priority
    const tasksByPriorityQuery = `
      SELECT priority, COUNT(*) as count FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NULL
      ${boardFilter}
      GROUP BY priority
    `;
    const tasksByPriorityResult = await c.env.DB.prepare(tasksByPriorityQuery)
      .bind(...boardParams).all<{ priority: 'low' | 'medium' | 'high'; count: number }>();
    
    const priorityTotal = totalTasks || 1;
    const priorityMap: Record<string, number> = { high: 0, medium: 0, low: 0 };
    (tasksByPriorityResult.results || []).forEach((row: { priority: 'low' | 'medium' | 'high'; count: number }) => {
      priorityMap[row.priority] = row.count;
    });
    
    const tasksByPriority: TasksByPriority[] = [
      { priority: 'high', count: priorityMap['high'], percentage: Math.round((priorityMap['high'] / priorityTotal) * 100) },
      { priority: 'medium', count: priorityMap['medium'], percentage: Math.round((priorityMap['medium'] / priorityTotal) * 100) },
      { priority: 'low', count: priorityMap['low'], percentage: Math.round((priorityMap['low'] / priorityTotal) * 100) }
    ];
    
    // 10. Completion trend (last 30 days)
    const completionTrendQuery = `
      SELECT 
        DATE(t.archived_at) as date,
        COUNT(*) as completed
      FROM tasks t
      WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
      AND DATE(t.archived_at) >= DATE(?)
      ${boardFilter}
      GROUP BY DATE(t.archived_at)
      ORDER BY date ASC
    `;
    const completionTrendResult = await c.env.DB.prepare(completionTrendQuery)
      .bind(dates.thirtyDaysAgoStr, ...boardParams).all<{ date: string; completed: number }>();
    
    const createdTrendQuery = `
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as created
      FROM tasks t
      WHERE t.deleted_at IS NULL
      AND DATE(t.created_at) >= DATE(?)
      ${boardFilter}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `;
    const createdTrendResult = await c.env.DB.prepare(createdTrendQuery)
      .bind(dates.thirtyDaysAgoStr, ...boardParams).all<{ date: string; created: number }>();
    
    // Merge completed and created data
    const trendMap = new Map<string, CompletionTrend>();
    
    // Generate all dates in the range
    const startDate = new Date(dates.thirtyDaysAgoStr);
    const endDate = new Date(dates.todayStr);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, { date: dateStr, completed: 0, created: 0 });
    }
    
    (completionTrendResult.results || []).forEach((row: { date: string; completed: number }) => {
      const existing = trendMap.get(row.date) || { date: row.date, completed: 0, created: 0 };
      existing.completed = row.completed;
      trendMap.set(row.date, existing);
    });
    
    (createdTrendResult.results || []).forEach((row: { date: string; created: number }) => {
      const existing = trendMap.get(row.date) || { date: row.date, completed: 0, created: 0 };
      existing.created = row.created;
      trendMap.set(row.date, existing);
    });
    
    const completionTrend: CompletionTrend[] = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // 11. Velocity (tasks completed per week, last 8 weeks)
    const velocity: VelocityData[] = [];
    const currentWeekStart = new Date(dates.startOfWeekStr);
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekCompletedQuery = `
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.deleted_at IS NULL AND t.archived_at IS NOT NULL
        AND DATE(t.archived_at) >= DATE(?) AND DATE(t.archived_at) <= DATE(?)
        ${boardFilter}
      `;
      const weekCompletedResult = await c.env.DB.prepare(weekCompletedQuery)
        .bind(weekStartStr, weekEndStr, ...boardParams).first<{ count: number }>();
      
      const weekCreatedQuery = `
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.deleted_at IS NULL
        AND DATE(t.created_at) >= DATE(?) AND DATE(t.created_at) <= DATE(?)
        ${boardFilter}
      `;
      const weekCreatedResult = await c.env.DB.prepare(weekCreatedQuery)
        .bind(weekStartStr, weekEndStr, ...boardParams).first<{ count: number }>();
      
      velocity.push({
        week_start: weekStartStr,
        week_end: weekEndStr,
        completed: weekCompletedResult?.count || 0,
        created: weekCreatedResult?.count || 0
      });
    }
    
    // 12. Per-project breakdown (only when no board filter)
    let projectBreakdown: ProjectBreakdown[] = [];
    
    if (!boardId) {
      const projectsQuery = `
        SELECT 
          b.id as board_id,
          b.name as board_name,
          b.icon as board_icon,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NULL) as total_tasks,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NOT NULL) as completed_tasks,
          (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.deleted_at IS NULL AND t.archived_at IS NULL AND DATE(t.due_date) < DATE(?)) as overdue_tasks
        FROM boards b
        WHERE b.deleted_at IS NULL
        ORDER BY b.created_at DESC
      `;
      const projectsResult = await c.env.DB.prepare(projectsQuery)
        .bind(dates.todayStr).all<{ 
          board_id: string; 
          board_name: string; 
          board_icon: string; 
          total_tasks: number; 
          completed_tasks: number;
          overdue_tasks: number;
        }>();
      
      projectBreakdown = (projectsResult.results || []).map((row: { 
        board_id: string; 
        board_name: string; 
        board_icon: string; 
        total_tasks: number; 
        completed_tasks: number;
        overdue_tasks: number;
      }) => ({
        board_id: row.board_id,
        board_name: row.board_name,
        board_icon: row.board_icon || '📋',
        total_tasks: row.total_tasks,
        completed_tasks: row.completed_tasks,
        overdue_tasks: row.overdue_tasks,
        completion_rate: row.total_tasks + row.completed_tasks > 0 
          ? Math.round((row.completed_tasks / (row.total_tasks + row.completed_tasks)) * 100) 
          : 0
      }));
    }
    
    const summary: AnalyticsSummary = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      due_today: dueToday,
      due_this_week: dueThisWeek,
      completed_this_week: completedThisWeek,
      completed_this_month: completedThisMonth,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      completion_trend: completionTrend,
      velocity,
      project_breakdown: projectBreakdown
    };
    
    return c.json({ success: true, data: summary });
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching analytics', {}, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' }
    }, 500);
  }
});

// GET /api/analytics/boards/:boardId - Get analytics for a specific board
analytics.get('/boards/:boardId', async (c) => {
  try {
    const boardId = c.req.param('boardId');
    
    // Redirect to main analytics with board_id filter
    const url = new URL(c.req.url);
    url.pathname = '/api/analytics';
    url.searchParams.set('board_id', boardId);
    
    // Call the main analytics endpoint logic
    return c.redirect(url.pathname + url.search);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Error fetching board analytics', { boardId: c.req.param('boardId') }, error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch board analytics' }
    }, 500);
  }
});

export default analytics;
