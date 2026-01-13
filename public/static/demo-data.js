/**
 * TaskFlow Demo Data
 * ==================
 * Pre-seeded demo content for the TaskFlow demo app.
 * This data showcases all the features of the app.
 */

(function() {
  'use strict';

  // Helper to generate consistent IDs
  const ids = {
    board1: 'board_demo-product-launch',
    col1: 'col_demo-backlog',
    col2: 'col_demo-todo',
    col3: 'col_demo-in-progress',
    col4: 'col_demo-review',
    col5: 'col_demo-done',
    task1: 'task_demo-1',
    task2: 'task_demo-2',
    task3: 'task_demo-3',
    task4: 'task_demo-4',
    task5: 'task_demo-5',
    task6: 'task_demo-6',
    task7: 'task_demo-7',
    task8: 'task_demo-8',
    task9: 'task_demo-9',
    task10: 'task_demo-10',
    sub1: 'sub_demo-1',
    sub2: 'sub_demo-2',
    sub3: 'sub_demo-3',
    sub4: 'sub_demo-4',
    sub5: 'sub_demo-5',
    sub6: 'sub_demo-6',
    comment1: 'comment_demo-1',
    comment2: 'comment_demo-2',
    comment3: 'comment_demo-3'
  };

  // Get relative dates
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const daysAgo3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const daysAgo5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const daysAgo7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const hoursAgo2 = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const hoursAgo5 = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();

  // Demo Board
  const boards = [
    {
      id: ids.board1,
      name: 'Product Launch',
      description: 'Q1 product launch planning and execution',
      icon: '🚀',
      color: '#6366F1',
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      created_at: daysAgo7,
      updated_at: hoursAgo2,
      archived_at: null,
      deleted_at: null
    }
  ];

  // Demo Columns
  const columns = [
    {
      id: ids.col1,
      board_id: ids.board1,
      name: 'Backlog',
      position: 0,
      auto_archive: false,
      auto_archive_days: 7,
      created_at: daysAgo7,
      updated_at: daysAgo7,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.col2,
      board_id: ids.board1,
      name: 'To Do',
      position: 1,
      auto_archive: false,
      auto_archive_days: 7,
      created_at: daysAgo7,
      updated_at: daysAgo7,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.col3,
      board_id: ids.board1,
      name: 'In Progress',
      position: 2,
      auto_archive: false,
      auto_archive_days: 7,
      created_at: daysAgo7,
      updated_at: daysAgo7,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.col4,
      board_id: ids.board1,
      name: 'Review',
      position: 3,
      auto_archive: false,
      auto_archive_days: 7,
      created_at: daysAgo7,
      updated_at: daysAgo7,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.col5,
      board_id: ids.board1,
      name: 'Done',
      position: 4,
      auto_archive: true,
      auto_archive_days: 3,
      created_at: daysAgo7,
      updated_at: daysAgo7,
      archived_at: null,
      deleted_at: null
    }
  ];

  // Demo Tasks
  const tasks = [
    // Backlog
    {
      id: ids.task1,
      board_id: ids.board1,
      column_id: ids.col1,
      title: 'Research competitor pricing',
      description: 'Analyze pricing strategies of top 5 competitors in the market. Document findings in the shared drive.',
      priority: 'low',
      due_date: in7Days,
      tags: ['research', 'market-analysis'],
      position: 0,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo5,
      updated_at: daysAgo5,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.task2,
      board_id: ids.board1,
      column_id: ids.col1,
      title: 'Define MVP feature set',
      description: 'Work with product team to finalize the minimum viable product features for the initial launch.',
      priority: 'medium',
      due_date: in3Days,
      tags: ['planning', 'product'],
      position: 1,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo5,
      updated_at: daysAgo3,
      archived_at: null,
      deleted_at: null
    },
    // To Do
    {
      id: ids.task3,
      board_id: ids.board1,
      column_id: ids.col2,
      title: 'Create email campaign templates',
      description: 'Design and develop email templates for the launch announcement, follow-ups, and promotional campaigns.',
      priority: 'medium',
      due_date: tomorrow,
      tags: ['marketing', 'email'],
      position: 0,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo3,
      updated_at: daysAgo3,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.task4,
      board_id: ids.board1,
      column_id: ids.col2,
      title: 'Prepare press release',
      description: 'Draft the official press release for the product launch. Include key features, pricing, and availability dates.',
      priority: 'high',
      due_date: today,
      tags: ['marketing', 'PR'],
      position: 1,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo3,
      updated_at: hoursAgo5,
      archived_at: null,
      deleted_at: null
    },
    // In Progress
    {
      id: ids.task5,
      board_id: ids.board1,
      column_id: ids.col3,
      title: 'Design landing page',
      description: 'Create a high-converting landing page design for the product launch. Include hero section, features, testimonials, and CTA.',
      priority: 'high',
      due_date: tomorrow,
      tags: ['design', 'frontend'],
      position: 0,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo5,
      updated_at: hoursAgo2,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.task6,
      board_id: ids.board1,
      column_id: ids.col3,
      title: 'Set up analytics tracking',
      description: 'Implement Google Analytics 4, conversion tracking, and custom events for the launch campaign.',
      priority: 'medium',
      due_date: in3Days,
      tags: ['analytics', 'tech'],
      position: 1,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo3,
      updated_at: hoursAgo5,
      archived_at: null,
      deleted_at: null
    },
    // Review
    {
      id: ids.task7,
      board_id: ids.board1,
      column_id: ids.col4,
      title: 'Write product documentation',
      description: 'Create comprehensive user documentation including getting started guide, API reference, and troubleshooting section.',
      priority: 'high',
      due_date: today,
      tags: ['documentation', 'content'],
      position: 0,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo5,
      updated_at: hoursAgo2,
      archived_at: null,
      deleted_at: null
    },
    // Done
    {
      id: ids.task8,
      board_id: ids.board1,
      column_id: ids.col5,
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated testing and deployment pipeline using GitHub Actions.',
      priority: 'high',
      due_date: yesterday,
      tags: ['devops', 'automation'],
      position: 0,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo7,
      updated_at: daysAgo3,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.task9,
      board_id: ids.board1,
      column_id: ids.col5,
      title: 'Create brand logo',
      description: 'Design the official product logo with variations for different use cases (dark/light backgrounds, icon-only, etc.)',
      priority: 'medium',
      due_date: yesterday,
      tags: ['design', 'branding'],
      position: 1,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo7,
      updated_at: daysAgo5,
      archived_at: null,
      deleted_at: null
    },
    {
      id: ids.task10,
      board_id: ids.board1,
      column_id: ids.col5,
      title: 'Configure domain and SSL',
      description: 'Set up the production domain, configure DNS records, and install SSL certificate.',
      priority: 'high',
      due_date: yesterday,
      tags: ['devops', 'infrastructure'],
      position: 2,
      recurrence_rule: null,
      recurrence_end_date: null,
      recurrence_count: null,
      recurrence_completed_count: 0,
      original_task_id: null,
      is_recurrence_instance: false,
      created_at: daysAgo7,
      updated_at: daysAgo5,
      archived_at: null,
      deleted_at: null
    }
  ];

  // Demo Subtasks
  const subtasks = [
    // Subtasks for "Design landing page"
    {
      id: ids.sub1,
      task_id: ids.task5,
      title: 'Create wireframes',
      is_completed: true,
      position: 0,
      created_at: daysAgo5,
      updated_at: daysAgo3
    },
    {
      id: ids.sub2,
      task_id: ids.task5,
      title: 'Design hero section',
      is_completed: true,
      position: 1,
      created_at: daysAgo5,
      updated_at: hoursAgo5
    },
    {
      id: ids.sub3,
      task_id: ids.task5,
      title: 'Design features section',
      is_completed: false,
      position: 2,
      created_at: daysAgo5,
      updated_at: daysAgo5
    },
    {
      id: ids.sub4,
      task_id: ids.task5,
      title: 'Design pricing section',
      is_completed: false,
      position: 3,
      created_at: daysAgo5,
      updated_at: daysAgo5
    },
    // Subtasks for "Write product documentation"
    {
      id: ids.sub5,
      task_id: ids.task7,
      title: 'Write getting started guide',
      is_completed: true,
      position: 0,
      created_at: daysAgo5,
      updated_at: daysAgo3
    },
    {
      id: ids.sub6,
      task_id: ids.task7,
      title: 'Document API endpoints',
      is_completed: true,
      position: 1,
      created_at: daysAgo5,
      updated_at: hoursAgo2
    }
  ];

  // Demo Comments
  const comments = [
    {
      id: ids.comment1,
      task_id: ids.task7,
      content: 'The documentation structure looks great! I\'ve added a few suggestions for the troubleshooting section.',
      created_at: daysAgo3,
      updated_at: daysAgo3
    },
    {
      id: ids.comment2,
      task_id: ids.task7,
      content: 'Thanks! I\'ve incorporated your feedback. Ready for final review.',
      created_at: hoursAgo5,
      updated_at: hoursAgo5
    },
    {
      id: ids.comment3,
      task_id: ids.task5,
      content: 'The hero section design is approved. Great work on the animations!',
      created_at: hoursAgo2,
      updated_at: hoursAgo2
    }
  ];

  // Demo Activity Log
  const activity = [
    {
      id: 'activity_demo-1',
      entity_type: 'task',
      entity_id: ids.task5,
      action: 'subtask_completed',
      details: { task_id: ids.task5, title: 'Design hero section', completed: true },
      created_at: hoursAgo5
    },
    {
      id: 'activity_demo-2',
      entity_type: 'task',
      entity_id: ids.task7,
      action: 'moved',
      details: { from_column: 'In Progress', to_column: 'Review' },
      created_at: hoursAgo2
    },
    {
      id: 'activity_demo-3',
      entity_type: 'task',
      entity_id: ids.task7,
      action: 'comment_added',
      details: { comment_id: ids.comment2, content_preview: 'Thanks! I\'ve incorporated your feedback...' },
      created_at: hoursAgo5
    },
    {
      id: 'activity_demo-4',
      entity_type: 'task',
      entity_id: ids.task4,
      action: 'priority_changed',
      details: { old_priority: 'medium', new_priority: 'high' },
      created_at: hoursAgo5
    },
    {
      id: 'activity_demo-5',
      entity_type: 'task',
      entity_id: ids.task8,
      action: 'moved',
      details: { from_column: 'In Progress', to_column: 'Done' },
      created_at: daysAgo3
    },
    {
      id: 'activity_demo-6',
      entity_type: 'task',
      entity_id: ids.task9,
      action: 'moved',
      details: { from_column: 'Review', to_column: 'Done' },
      created_at: daysAgo5
    },
    {
      id: 'activity_demo-7',
      entity_type: 'task',
      entity_id: ids.task1,
      action: 'created',
      details: { title: 'Research competitor pricing', column_name: 'Backlog' },
      created_at: daysAgo5
    },
    {
      id: 'activity_demo-8',
      entity_type: 'task',
      entity_id: ids.task5,
      action: 'created',
      details: { title: 'Design landing page', column_name: 'In Progress' },
      created_at: daysAgo5
    }
  ];

  // Export demo data globally
  window.TASKFLOW_DEMO_DATA = {
    boards,
    columns,
    tasks,
    subtasks,
    comments,
    activity
  };

  console.log('DemoData: Demo data loaded with', {
    boards: boards.length,
    columns: columns.length,
    tasks: tasks.length,
    subtasks: subtasks.length,
    comments: comments.length,
    activity: activity.length
  });
})();
