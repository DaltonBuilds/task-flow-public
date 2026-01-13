/**
 * TaskFlow Demo API Layer
 * =======================
 * Intercepts all /api/* fetch requests and handles them with localStorage.
 * This allows the app to run as a fully client-side demo without any backend.
 */

(function() {
  'use strict';

  // localStorage keys
  const STORAGE_KEYS = {
    boards: 'taskflow_demo_boards',
    columns: 'taskflow_demo_columns',
    tasks: 'taskflow_demo_tasks',
    subtasks: 'taskflow_demo_subtasks',
    comments: 'taskflow_demo_comments',
    activity: 'taskflow_demo_activity',
    initialized: 'taskflow_demo_initialized'
  };

  // Board templates
  const BOARD_TEMPLATES = {
    'blank': [],
    'simple': ['Not Started', 'Completed'],
    'basic': ['To Do', 'In Progress', 'Done'],
    'extended': ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
  };

  // ===================
  // Utility Functions
  // ===================

  function generateId(prefix = '') {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid}` : uuid;
  }

  function now() {
    return new Date().toISOString();
  }

  function getStore(key) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS[key]);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('DemoAPI: Failed to read from localStorage', e);
      return [];
    }
  }

  function setStore(key, data) {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    } catch (e) {
      console.error('DemoAPI: Failed to write to localStorage', e);
    }
  }

  function jsonResponse(data, success = true) {
    return new Response(JSON.stringify({ success, data }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function errorResponse(message, code = 'ERROR', status = 400) {
    return new Response(JSON.stringify({
      success: false,
      error: { code, message }
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ===================
  // Activity Logging
  // ===================

  function logActivity(entityType, entityId, action, details = {}) {
    const activity = getStore('activity');
    activity.unshift({
      id: generateId('activity'),
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      details: details,
      created_at: now()
    });
    // Keep only last 500 activities
    setStore('activity', activity.slice(0, 500));
  }

  // ===================
  // Board Operations
  // ===================

  function getBoards(params) {
    let boards = getStore('boards');
    
    if (!params.get('include_deleted')) {
      boards = boards.filter(b => !b.deleted_at);
    }
    if (!params.get('include_archived')) {
      boards = boards.filter(b => !b.archived_at);
    }
    
    return boards.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function getBoardById(id) {
    const boards = getStore('boards');
    return boards.find(b => b.id === id) || null;
  }

  function getBoardWithDetails(id) {
    const board = getBoardById(id);
    if (!board) return null;

    const columns = getStore('columns')
      .filter(c => c.board_id === id && !c.deleted_at)
      .sort((a, b) => a.position - b.position);

    const tasks = getStore('tasks')
      .filter(t => t.board_id === id && !t.deleted_at && !t.archived_at)
      .sort((a, b) => a.position - b.position);

    const subtasks = getStore('subtasks');
    const comments = getStore('comments');

    // Build comment counts
    const commentCounts = {};
    comments.forEach(c => {
      commentCounts[c.task_id] = (commentCounts[c.task_id] || 0) + 1;
    });

    // Build nested structure
    const columnsWithTasks = columns.map(col => ({
      ...col,
      tasks: tasks
        .filter(t => t.column_id === col.id)
        .map(t => ({
          ...t,
          subtasks: subtasks.filter(s => s.task_id === t.id),
          comments: [],
          comment_count: commentCounts[t.id] || 0
        }))
    }));

    return {
      ...board,
      columns: columnsWithTasks
    };
  }

  function createBoard(data) {
    const id = generateId('board');
    const timestamp = now();
    
    const board = {
      id,
      name: data.name,
      description: data.description || null,
      icon: data.icon || '📋',
      color: data.color || '#10B981',
      background_type: data.background_type || 'solid',
      background_value: data.background_value || '#f3f4f6',
      created_at: timestamp,
      updated_at: timestamp,
      archived_at: null,
      deleted_at: null
    };

    const boards = getStore('boards');
    boards.push(board);
    setStore('boards', boards);

    // Create columns based on template
    const template = data.template || 'basic';
    const columnNames = BOARD_TEMPLATES[template] || BOARD_TEMPLATES['basic'];
    const columns = getStore('columns');
    
    columnNames.forEach((name, i) => {
      columns.push({
        id: generateId('col'),
        board_id: id,
        name,
        position: i,
        auto_archive: false,
        auto_archive_days: 7,
        created_at: timestamp,
        updated_at: timestamp,
        archived_at: null,
        deleted_at: null
      });
    });
    
    setStore('columns', columns);

    return getBoardWithDetails(id);
  }

  function updateBoard(id, data) {
    const boards = getStore('boards');
    const index = boards.findIndex(b => b.id === id);
    if (index === -1) return null;

    const board = boards[index];
    const updated = {
      ...board,
      ...data,
      updated_at: now()
    };
    
    boards[index] = updated;
    setStore('boards', boards);
    
    return updated;
  }

  function deleteBoard(id, hard = false) {
    const boards = getStore('boards');
    const index = boards.findIndex(b => b.id === id);
    if (index === -1) return false;

    if (hard) {
      boards.splice(index, 1);
    } else {
      boards[index].deleted_at = now();
      boards[index].updated_at = now();
    }
    
    setStore('boards', boards);
    return true;
  }

  // ===================
  // Column Operations
  // ===================

  function createColumn(boardId, data) {
    const id = generateId('col');
    const timestamp = now();
    const columns = getStore('columns');
    
    let position = data.position;
    if (position === undefined) {
      const boardColumns = columns.filter(c => c.board_id === boardId);
      position = boardColumns.length;
    }

    const column = {
      id,
      board_id: boardId,
      name: data.name,
      position,
      auto_archive: false,
      auto_archive_days: 7,
      created_at: timestamp,
      updated_at: timestamp,
      archived_at: null,
      deleted_at: null
    };

    columns.push(column);
    setStore('columns', columns);
    
    return column;
  }

  function updateColumn(id, data) {
    const columns = getStore('columns');
    const index = columns.findIndex(c => c.id === id);
    if (index === -1) return null;

    const column = columns[index];
    const updated = {
      ...column,
      ...data,
      updated_at: now()
    };
    
    columns[index] = updated;
    setStore('columns', columns);
    
    return updated;
  }

  function deleteColumn(id) {
    const columns = getStore('columns');
    const index = columns.findIndex(c => c.id === id);
    if (index === -1) return false;

    columns[index].deleted_at = now();
    columns[index].updated_at = now();
    setStore('columns', columns);
    
    return true;
  }

  // ===================
  // Task Operations
  // ===================

  function getTaskById(id) {
    const tasks = getStore('tasks');
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const subtasks = getStore('subtasks').filter(s => s.task_id === id);
    const comments = getStore('comments').filter(c => c.task_id === id);

    return {
      ...task,
      subtasks,
      comments,
      comment_count: comments.length
    };
  }

  function createTask(boardId, data) {
    const id = generateId('task');
    const timestamp = now();
    const tasks = getStore('tasks');

    let position = data.position;
    if (position === undefined) {
      const columnTasks = tasks.filter(t => t.column_id === data.column_id && !t.deleted_at);
      position = columnTasks.length;
    }

    const task = {
      id,
      board_id: boardId,
      column_id: data.column_id,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      tags: data.tags || [],
      position,
      recurrence_rule: data.recurrence_rule || null,
      recurrence_end_date: data.recurrence_end_date || null,
      recurrence_count: data.recurrence_count || null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: timestamp,
      updated_at: timestamp,
      archived_at: null,
      deleted_at: null
    };

    tasks.push(task);
    setStore('tasks', tasks);

    // Get column name for activity
    const columns = getStore('columns');
    const column = columns.find(c => c.id === data.column_id);
    
    logActivity('task', id, 'created', {
      title: data.title,
      column_name: column?.name || 'Unknown'
    });

    return getTaskById(id);
  }

  function updateTask(id, data) {
    const tasks = getStore('tasks');
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const task = tasks[index];
    const columns = getStore('columns');

    // Track changes for activity log
    if (data.column_id && data.column_id !== task.column_id) {
      const oldColumn = columns.find(c => c.id === task.column_id);
      const newColumn = columns.find(c => c.id === data.column_id);
      logActivity('task', id, 'moved', {
        from_column: oldColumn?.name || 'Unknown',
        to_column: newColumn?.name || 'Unknown'
      });
    }

    if (data.priority && data.priority !== task.priority) {
      logActivity('task', id, 'priority_changed', {
        old_priority: task.priority,
        new_priority: data.priority
      });
    }

    if (data.archived_at && !task.archived_at) {
      logActivity('task', id, 'archived', {});
    } else if (data.archived_at === null && task.archived_at) {
      logActivity('task', id, 'restored', {});
    }

    const updated = {
      ...task,
      ...data,
      updated_at: now()
    };
    
    tasks[index] = updated;
    setStore('tasks', tasks);

    return getTaskById(id);
  }

  function deleteTask(id) {
    const tasks = getStore('tasks');
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const task = tasks[index];
    tasks[index].deleted_at = now();
    tasks[index].updated_at = now();
    setStore('tasks', tasks);

    logActivity('task', id, 'deleted', { title: task.title });
    
    return true;
  }

  function archiveTask(id) {
    return updateTask(id, { archived_at: now() });
  }

  function unarchiveTask(id) {
    return updateTask(id, { archived_at: null });
  }

  // ===================
  // Subtask Operations
  // ===================

  function createSubtask(taskId, data) {
    const id = generateId('sub');
    const timestamp = now();
    const subtasks = getStore('subtasks');

    let position = data.position;
    if (position === undefined) {
      const taskSubtasks = subtasks.filter(s => s.task_id === taskId);
      position = taskSubtasks.length;
    }

    const subtask = {
      id,
      task_id: taskId,
      title: data.title,
      is_completed: false,
      position,
      created_at: timestamp,
      updated_at: timestamp
    };

    subtasks.push(subtask);
    setStore('subtasks', subtasks);

    logActivity('subtask', id, 'subtask_created', {
      task_id: taskId,
      title: data.title
    });

    return subtask;
  }

  function updateSubtask(id, data) {
    const subtasks = getStore('subtasks');
    const index = subtasks.findIndex(s => s.id === id);
    if (index === -1) return null;

    const subtask = subtasks[index];

    if (data.is_completed !== undefined && data.is_completed !== subtask.is_completed) {
      logActivity('subtask', id, 'subtask_completed', {
        task_id: subtask.task_id,
        title: subtask.title,
        completed: data.is_completed
      });
    }

    const updated = {
      ...subtask,
      ...data,
      updated_at: now()
    };
    
    subtasks[index] = updated;
    setStore('subtasks', subtasks);
    
    return updated;
  }

  function deleteSubtask(id) {
    const subtasks = getStore('subtasks');
    const index = subtasks.findIndex(s => s.id === id);
    if (index === -1) return false;

    const subtask = subtasks[index];
    subtasks.splice(index, 1);
    setStore('subtasks', subtasks);

    logActivity('subtask', id, 'subtask_deleted', {
      task_id: subtask.task_id,
      title: subtask.title
    });
    
    return true;
  }

  // ===================
  // Comment Operations
  // ===================

  function getComments(taskId) {
    return getStore('comments')
      .filter(c => c.task_id === taskId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  function createComment(taskId, data) {
    const id = generateId('comment');
    const timestamp = now();
    const comments = getStore('comments');

    const comment = {
      id,
      task_id: taskId,
      content: data.content,
      created_at: timestamp,
      updated_at: timestamp
    };

    comments.push(comment);
    setStore('comments', comments);

    logActivity('task', taskId, 'comment_added', {
      comment_id: id,
      content_preview: data.content.substring(0, 100)
    });

    return comment;
  }

  function updateComment(id, data) {
    const comments = getStore('comments');
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return null;

    const comment = comments[index];
    const updated = {
      ...comment,
      ...data,
      updated_at: now()
    };
    
    comments[index] = updated;
    setStore('comments', comments);

    logActivity('task', comment.task_id, 'comment_edited', { comment_id: id });
    
    return updated;
  }

  function deleteComment(id) {
    const comments = getStore('comments');
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return false;

    const comment = comments[index];
    comments.splice(index, 1);
    setStore('comments', comments);

    logActivity('task', comment.task_id, 'comment_deleted', { comment_id: id });
    
    return true;
  }

  // ===================
  // Trash Operations
  // ===================

  function getTrash() {
    const boards = getStore('boards').filter(b => b.deleted_at);
    const columns = getStore('columns').filter(c => c.deleted_at);
    const tasks = getStore('tasks').filter(t => t.deleted_at);
    
    return { boards, columns, tasks };
  }

  function restoreFromTrash(type, id) {
    if (type === 'board') {
      const boards = getStore('boards');
      const index = boards.findIndex(b => b.id === id);
      if (index !== -1) {
        boards[index].deleted_at = null;
        boards[index].updated_at = now();
        setStore('boards', boards);
        return true;
      }
    } else if (type === 'column') {
      const columns = getStore('columns');
      const index = columns.findIndex(c => c.id === id);
      if (index !== -1) {
        columns[index].deleted_at = null;
        columns[index].updated_at = now();
        setStore('columns', columns);
        return true;
      }
    } else if (type === 'task' || type === 'tasks') {
      const tasks = getStore('tasks');
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index].deleted_at = null;
        tasks[index].updated_at = now();
        setStore('tasks', tasks);
        return true;
      }
    }
    return false;
  }

  // ===================
  // Archive Operations
  // ===================

  function getArchive(boardId) {
    const tasks = getStore('tasks')
      .filter(t => t.board_id === boardId && t.archived_at && !t.deleted_at);
    
    const subtasks = getStore('subtasks');
    const comments = getStore('comments');

    return tasks.map(t => ({
      ...t,
      subtasks: subtasks.filter(s => s.task_id === t.id),
      comments: comments.filter(c => c.task_id === t.id)
    }));
  }

  // ===================
  // Activity Operations
  // ===================

  function getActivity(options = {}) {
    let activity = getStore('activity');

    if (options.entityId) {
      activity = activity.filter(a => a.entity_id === options.entityId);
    }

    if (options.boardId) {
      const tasks = getStore('tasks').filter(t => t.board_id === options.boardId);
      const taskIds = tasks.map(t => t.id);
      const columns = getStore('columns').filter(c => c.board_id === options.boardId);
      const columnIds = columns.map(c => c.id);
      
      activity = activity.filter(a => 
        taskIds.includes(a.entity_id) ||
        columnIds.includes(a.entity_id) ||
        a.entity_id === options.boardId
      );
    }

    if (options.action) {
      activity = activity.filter(a => a.action === options.action);
    }

    if (options.limit) {
      activity = activity.slice(0, parseInt(options.limit));
    }

    return activity;
  }

  // ===================
  // Analytics Operations
  // ===================

  function getAnalytics(boardId) {
    const boards = getStore('boards').filter(b => !b.deleted_at && !b.archived_at);
    let tasks = getStore('tasks').filter(t => !t.deleted_at);
    const columns = getStore('columns').filter(c => !c.deleted_at);

    if (boardId) {
      tasks = tasks.filter(t => t.board_id === boardId);
    }

    const activeTasks = tasks.filter(t => !t.archived_at);
    const archivedTasks = tasks.filter(t => t.archived_at);
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const overdueTasks = activeTasks.filter(t => t.due_date && t.due_date < today);
    const dueToday = activeTasks.filter(t => t.due_date === today);
    const dueThisWeek = activeTasks.filter(t => t.due_date && t.due_date >= today && t.due_date <= weekFromNow);

    // Tasks by status (column)
    const tasksByStatus = columns
      .filter(c => boardId ? c.board_id === boardId : true)
      .map(col => {
        const count = activeTasks.filter(t => t.column_id === col.id).length;
        return {
          column_id: col.id,
          column_name: col.name,
          count,
          percentage: activeTasks.length > 0 ? Math.round((count / activeTasks.length) * 100) : 0
        };
      });

    // Tasks by priority
    const tasksByPriority = ['high', 'medium', 'low'].map(priority => {
      const count = activeTasks.filter(t => t.priority === priority).length;
      return {
        priority,
        count,
        percentage: activeTasks.length > 0 ? Math.round((count / activeTasks.length) * 100) : 0
      };
    });

    // Project breakdown
    const projectBreakdown = boards.map(board => {
      const boardTasks = tasks.filter(t => t.board_id === board.id && !t.archived_at);
      const completed = tasks.filter(t => t.board_id === board.id && t.archived_at).length;
      const overdue = boardTasks.filter(t => t.due_date && t.due_date < today).length;
      
      return {
        board_id: board.id,
        board_name: board.name,
        board_icon: board.icon,
        total_tasks: boardTasks.length,
        completed_tasks: completed,
        overdue_tasks: overdue,
        completion_rate: (boardTasks.length + completed) > 0 
          ? Math.round((completed / (boardTasks.length + completed)) * 100) 
          : 0
      };
    });

    return {
      total_tasks: activeTasks.length,
      completed_tasks: archivedTasks.length,
      overdue_tasks: overdueTasks.length,
      due_today: dueToday.length,
      due_this_week: dueThisWeek.length,
      completed_this_week: 0,
      completed_this_month: archivedTasks.length,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      completion_trend: [],
      velocity: [],
      project_breakdown: projectBreakdown
    };
  }

  // ===================
  // Search Operations
  // ===================

  function searchTasks(query, boardId) {
    const q = (query || '').toLowerCase();
    let tasks = getStore('tasks').filter(t => !t.deleted_at && !t.archived_at);
    
    if (boardId) {
      tasks = tasks.filter(t => t.board_id === boardId);
    }

    if (q) {
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    const subtasks = getStore('subtasks');
    const columns = getStore('columns');
    const boards = getStore('boards');

    return tasks.map(t => {
      const column = columns.find(c => c.id === t.column_id);
      const board = boards.find(b => b.id === t.board_id);
      return {
        ...t,
        subtasks: subtasks.filter(s => s.task_id === t.id),
        column_name: column?.name || 'Unknown',
        board_name: board?.name || 'Unknown'
      };
    });
  }

  // ===================
  // Route Handler
  // ===================

  async function handleRequest(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const pathname = new URL(url, window.location.origin).pathname;
    const searchParams = new URL(url, window.location.origin).searchParams;
    
    let body = null;
    if (options.body) {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    }

    // Health check
    if (pathname === '/api/health') {
      return jsonResponse({ status: 'ok', demo_mode: true });
    }

    // Boards
    if (pathname === '/api/boards') {
      if (method === 'GET') {
        return jsonResponse(getBoards(searchParams));
      }
      if (method === 'POST') {
        return jsonResponse(createBoard(body));
      }
    }

    // Board by ID
    const boardMatch = pathname.match(/^\/api\/boards\/([^/]+)$/);
    if (boardMatch) {
      const boardId = boardMatch[1];
      if (method === 'GET') {
        const board = getBoardWithDetails(boardId);
        return board ? jsonResponse(board) : errorResponse('Board not found', 'NOT_FOUND', 404);
      }
      if (method === 'PATCH') {
        const board = updateBoard(boardId, body);
        return board ? jsonResponse(board) : errorResponse('Board not found', 'NOT_FOUND', 404);
      }
      if (method === 'DELETE') {
        const hard = searchParams.get('hard') === 'true';
        const success = deleteBoard(boardId, hard);
        return success ? jsonResponse({ success: true }) : errorResponse('Board not found', 'NOT_FOUND', 404);
      }
    }

    // Board columns
    const boardColumnsMatch = pathname.match(/^\/api\/boards\/([^/]+)\/columns$/);
    if (boardColumnsMatch && method === 'POST') {
      const boardId = boardColumnsMatch[1];
      return jsonResponse(createColumn(boardId, body));
    }

    // Board tasks
    const boardTasksMatch = pathname.match(/^\/api\/boards\/([^/]+)\/tasks$/);
    if (boardTasksMatch) {
      const boardId = boardTasksMatch[1];
      if (method === 'GET') {
        const tasks = getStore('tasks')
          .filter(t => t.board_id === boardId && !t.deleted_at && !t.archived_at);
        return jsonResponse(tasks);
      }
      if (method === 'POST') {
        return jsonResponse(createTask(boardId, body));
      }
    }

    // Board archive
    const boardArchiveMatch = pathname.match(/^\/api\/boards\/([^/]+)\/archive$/);
    if (boardArchiveMatch && method === 'GET') {
      const boardId = boardArchiveMatch[1];
      return jsonResponse(getArchive(boardId));
    }

    // Board archive-all
    const boardArchiveAllMatch = pathname.match(/^\/api\/boards\/([^/]+)\/archive-all$/);
    if (boardArchiveAllMatch && method === 'POST') {
      const boardId = boardArchiveAllMatch[1];
      const columnId = body?.column_id;
      const tasks = getStore('tasks');
      let count = 0;
      
      tasks.forEach((t, i) => {
        if (t.board_id === boardId && (!columnId || t.column_id === columnId) && !t.deleted_at && !t.archived_at) {
          tasks[i].archived_at = now();
          tasks[i].updated_at = now();
          count++;
        }
      });
      
      setStore('tasks', tasks);
      return jsonResponse({ archived_count: count });
    }

    // Board auto-archive
    const boardAutoArchiveMatch = pathname.match(/^\/api\/boards\/([^/]+)\/auto-archive$/);
    if (boardAutoArchiveMatch && method === 'POST') {
      return jsonResponse({ archived_count: 0 });
    }

    // Board activity
    const boardActivityMatch = pathname.match(/^\/api\/boards\/([^/]+)\/activity$/);
    if (boardActivityMatch && method === 'GET') {
      const boardId = boardActivityMatch[1];
      const action = searchParams.get('action');
      const limit = searchParams.get('limit');
      return jsonResponse(getActivity({ boardId, action, limit }));
    }

    // Columns
    const columnMatch = pathname.match(/^\/api\/columns\/([^/]+)$/);
    if (columnMatch) {
      const columnId = columnMatch[1];
      if (method === 'PATCH') {
        const column = updateColumn(columnId, body);
        return column ? jsonResponse(column) : errorResponse('Column not found', 'NOT_FOUND', 404);
      }
      if (method === 'DELETE') {
        const success = deleteColumn(columnId);
        return success ? jsonResponse({ success: true }) : errorResponse('Column not found', 'NOT_FOUND', 404);
      }
    }

    // Tasks
    if (pathname === '/api/tasks' && method === 'POST') {
      const boardId = body.board_id;
      return jsonResponse(createTask(boardId, body));
    }

    // Task by ID
    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch) {
      const taskId = taskMatch[1];
      if (method === 'GET') {
        const task = getTaskById(taskId);
        return task ? jsonResponse(task) : errorResponse('Task not found', 'NOT_FOUND', 404);
      }
      if (method === 'PATCH') {
        const task = updateTask(taskId, body);
        return task ? jsonResponse(task) : errorResponse('Task not found', 'NOT_FOUND', 404);
      }
      if (method === 'DELETE') {
        const success = deleteTask(taskId);
        return success ? jsonResponse({ success: true }) : errorResponse('Task not found', 'NOT_FOUND', 404);
      }
    }

    // Task archive
    const taskArchiveMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/archive$/);
    if (taskArchiveMatch && method === 'POST') {
      const taskId = taskArchiveMatch[1];
      const task = archiveTask(taskId);
      return task ? jsonResponse(task) : errorResponse('Task not found', 'NOT_FOUND', 404);
    }

    // Task unarchive
    const taskUnarchiveMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/unarchive$/);
    if (taskUnarchiveMatch && method === 'POST') {
      const taskId = taskUnarchiveMatch[1];
      const task = unarchiveTask(taskId);
      return task ? jsonResponse(task) : errorResponse('Task not found', 'NOT_FOUND', 404);
    }

    // Task subtasks
    const taskSubtasksMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/subtasks$/);
    if (taskSubtasksMatch && method === 'POST') {
      const taskId = taskSubtasksMatch[1];
      return jsonResponse(createSubtask(taskId, body));
    }

    // Task comments
    const taskCommentsMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/comments$/);
    if (taskCommentsMatch) {
      const taskId = taskCommentsMatch[1];
      if (method === 'GET') {
        return jsonResponse(getComments(taskId));
      }
      if (method === 'POST') {
        return jsonResponse(createComment(taskId, body));
      }
    }

    // Task activity
    const taskActivityMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/activity$/);
    if (taskActivityMatch && method === 'GET') {
      const taskId = taskActivityMatch[1];
      const action = searchParams.get('action');
      const limit = searchParams.get('limit');
      return jsonResponse(getActivity({ entityId: taskId, action, limit }));
    }

    // Task complete-recurring
    const taskCompleteRecurringMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/complete-recurring$/);
    if (taskCompleteRecurringMatch && method === 'POST') {
      const taskId = taskCompleteRecurringMatch[1];
      const task = archiveTask(taskId);
      return task ? jsonResponse({ task, next_task: null }) : errorResponse('Task not found', 'NOT_FOUND', 404);
    }

    // Task skip-occurrence
    const taskSkipOccurrenceMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/skip-occurrence$/);
    if (taskSkipOccurrenceMatch && method === 'POST') {
      const taskId = taskSkipOccurrenceMatch[1];
      const task = deleteTask(taskId);
      return jsonResponse({ skipped: task, next_task: null });
    }

    // Subtasks
    const subtaskMatch = pathname.match(/^\/api\/subtasks\/([^/]+)$/);
    if (subtaskMatch) {
      const subtaskId = subtaskMatch[1];
      if (method === 'PATCH') {
        const subtask = updateSubtask(subtaskId, body);
        return subtask ? jsonResponse(subtask) : errorResponse('Subtask not found', 'NOT_FOUND', 404);
      }
      if (method === 'DELETE') {
        const success = deleteSubtask(subtaskId);
        return success ? jsonResponse({ success: true }) : errorResponse('Subtask not found', 'NOT_FOUND', 404);
      }
    }

    // Comments
    const commentMatch = pathname.match(/^\/api\/comments\/([^/]+)$/);
    if (commentMatch) {
      const commentId = commentMatch[1];
      if (method === 'PATCH') {
        const comment = updateComment(commentId, body);
        return comment ? jsonResponse(comment) : errorResponse('Comment not found', 'NOT_FOUND', 404);
      }
      if (method === 'DELETE') {
        const success = deleteComment(commentId);
        return success ? jsonResponse({ success: true }) : errorResponse('Comment not found', 'NOT_FOUND', 404);
      }
    }

    // Trash
    if (pathname === '/api/trash' && method === 'GET') {
      return jsonResponse(getTrash());
    }

    // Trash restore
    const trashRestoreMatch = pathname.match(/^\/api\/trash\/([^/]+)\/([^/]+)\/restore$/);
    if (trashRestoreMatch && method === 'POST') {
      const type = trashRestoreMatch[1];
      const id = trashRestoreMatch[2];
      const success = restoreFromTrash(type, id);
      return success ? jsonResponse({ success: true }) : errorResponse('Item not found', 'NOT_FOUND', 404);
    }

    // Search
    if (pathname === '/api/search' && method === 'GET') {
      const query = searchParams.get('q');
      const boardId = searchParams.get('board_id');
      return jsonResponse(searchTasks(query, boardId));
    }

    // Analytics
    if (pathname === '/api/analytics' && method === 'GET') {
      const boardId = searchParams.get('board_id');
      return jsonResponse(getAnalytics(boardId));
    }

    // Fallback - unknown route
    console.warn('DemoAPI: Unknown route', method, pathname);
    return errorResponse('Route not found', 'NOT_FOUND', 404);
  }

  // ===================
  // Fetch Interceptor
  // ===================

  const originalFetch = window.fetch;

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    
    // Only intercept /api/* routes
    if (url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/')) {
      // Initialize demo data if needed
      if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
        await initializeDemoData();
      }
      
      return handleRequest(url, init);
    }

    // Pass through to original fetch for non-API routes
    return originalFetch.apply(this, arguments);
  };

  // ===================
  // Demo Data Initialization
  // ===================

  async function initializeDemoData() {
    // Check if demo-data.js has loaded and provided data
    if (typeof window.TASKFLOW_DEMO_DATA !== 'undefined') {
      const demoData = window.TASKFLOW_DEMO_DATA;
      
      setStore('boards', demoData.boards || []);
      setStore('columns', demoData.columns || []);
      setStore('tasks', demoData.tasks || []);
      setStore('subtasks', demoData.subtasks || []);
      setStore('comments', demoData.comments || []);
      setStore('activity', demoData.activity || []);
    } else {
      // Fallback: create empty stores
      setStore('boards', []);
      setStore('columns', []);
      setStore('tasks', []);
      setStore('subtasks', []);
      setStore('comments', []);
      setStore('activity', []);
    }
    
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
    console.log('DemoAPI: Demo data initialized');
  }

  // Export for potential external use
  window.DemoAPI = {
    reset: function() {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('DemoAPI: Data reset. Refresh the page to reinitialize.');
    },
    getStore,
    setStore
  };

  console.log('DemoAPI: Fetch interceptor installed. All /api/* requests will use localStorage.');
})();
