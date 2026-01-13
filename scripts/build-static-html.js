/**
 * Build script to generate static index.html for demo mode
 * This creates the HTML file that would normally be served by the worker
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

function normalizeBasePath(input) {
  const raw = String(input ?? '/').trim();
  if (raw === '' || raw === '.') return '/';
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const withTrailingSlash = withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  return withTrailingSlash;
}

const base = normalizeBasePath(process.env.BASE_PATH);

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// Generate the HTML content (same as renderIndexHTML but as a static file)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow - Demo</title>
  <base href="${base}">
  <link rel="icon" type="image/svg+xml" href="${base}logo.svg">
  <link rel="stylesheet" href="${base}static/main.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
  <!-- App Container -->
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <a href="${base}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="${base}logo.svg" alt="Task Manager" class="w-9 h-9" />
          <span class="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:inline">TaskFlow</span>
        </a>
        
        <!-- Project Switcher -->
        <div class="project-switcher" id="project-switcher">
          <button class="project-switcher-btn" id="project-switcher-btn" onclick="toggleProjectSwitcher()">
            <span class="project-name" id="current-project-name">My Tasks</span>
            <i class="fas fa-chevron-down text-xs text-gray-400"></i>
          </button>
          
          <!-- Dropdown (hidden by default) -->
          <div class="project-switcher-dropdown hidden" id="project-switcher-dropdown">
            <div class="project-search">
              <input type="text" placeholder="Search projects..." id="project-search-input" oninput="filterProjects(this.value)">
            </div>
            <div class="project-list" id="project-list">
              <!-- Projects will be rendered here -->
            </div>
            <div class="project-actions">
              <button class="project-action-btn primary" onclick="openNewProjectModal()">
                <i class="fas fa-plus"></i>
                <span>New Project</span>
              </button>
              <button class="project-action-btn" onclick="openManageProjectsModal()">
                <i class="fas fa-cog"></i>
                <span>Manage Projects</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 view-toggle-container">
          <button id="btn-board-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm" onclick="setView('board')">
            <i class="fas fa-columns mr-1"></i>
            <span class="hidden sm:inline">Board</span>
          </button>
          <button id="btn-list-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setView('list')">
            <i class="fas fa-list mr-1"></i>
            <span class="hidden sm:inline">List</span>
          </button>
          <button id="btn-calendar-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setView('calendar')">
            <i class="fas fa-calendar-alt mr-1"></i>
            <span class="hidden sm:inline">Calendar</span>
          </button>
        </div>
        
        <!-- Undo/Redo Buttons -->
        <div class="flex items-center gap-1">
          <button id="undo-btn" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 opacity-50" onclick="UndoManager.undo()" title="Nothing to undo (Ctrl+Z)" disabled>
            <i class="fas fa-undo text-lg"></i>
          </button>
          <button id="redo-btn" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 opacity-50" onclick="UndoManager.redo()" title="Nothing to redo (Ctrl+Shift+Z)" disabled>
            <i class="fas fa-redo text-lg"></i>
          </button>
        </div>
        
        <!-- Global Search -->
        <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="openGlobalSearch()" title="Search (/ or Cmd+F)">
          <i class="fas fa-search text-lg"></i>
        </button>
        
        <!-- Dashboard -->
        <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="openDashboard()" title="Dashboard Analytics">
          <i class="fas fa-chart-pie text-lg"></i>
        </button>
        
        <!-- Overdue Tasks Indicator -->
        <div class="relative" id="overdue-indicator" title="Overdue tasks">
          <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400" onclick="showOverdueTasks()">
            <i class="fas fa-bell text-lg"></i>
          </button>
          <span id="overdue-count-badge" class="overdue-badge hidden">0</span>
        </div>
        
        <!-- Add Task Button -->
        <button class="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2" onclick="openNewTaskModal()">
          <i class="fas fa-plus"></i>
          <span class="hidden sm:inline">Add Task</span>
        </button>
        
        <!-- User Profile Menu -->
        <div class="relative" id="user-menu-container">
          <button id="user-menu-btn" class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onclick="toggleUserMenu()">
            <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
              <i class="fas fa-user"></i>
            </div>
            <i class="fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400 hidden sm:inline"></i>
          </button>
          
          <!-- Dropdown Menu -->
          <div id="user-menu-dropdown" class="hidden absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <!-- User Info -->
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                  <i class="fas fa-user"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-gray-100 truncate" id="user-display-name">Demo User</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate" id="user-email">Demo Mode</p>
                </div>
              </div>
            </div>
            
            <!-- Menu Items -->
            <div class="py-1">
              <!-- Theme Selector -->
              <div class="theme-selector-container px-3 py-2.5">
                <div class="flex items-center gap-2.5 mb-2">
                  <i class="fas fa-palette text-gray-500 dark:text-gray-400 w-4 text-center text-xs"></i>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                </div>
                <div class="theme-toggle-group">
                  <button id="theme-light" onclick="setTheme('light')" class="theme-toggle-btn" title="Light mode">
                    <i class="fas fa-sun"></i>
                    <span>Light</span>
                  </button>
                  <button id="theme-dark" onclick="setTheme('dark')" class="theme-toggle-btn" title="Dark mode">
                    <i class="fas fa-moon"></i>
                    <span>Dark</span>
                  </button>
                  <button id="theme-system" onclick="setTheme('system')" class="theme-toggle-btn" title="System preference">
                    <i class="fas fa-laptop"></i>
                    <span>Auto</span>
                  </button>
                </div>
              </div>
              
              <!-- Archive -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group" onclick="openArchive(); toggleUserMenu();">
                <div class="flex items-center gap-3">
                  <i class="fas fa-archive text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                  <span>Archive</span>
                </div>
                <span id="archive-count-menu" class="hidden text-xs bg-accent text-white px-2 py-0.5 rounded-full">0</span>
              </button>
              
              <!-- Trash -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group" onclick="openTrash(); toggleUserMenu();">
                <div class="flex items-center gap-3">
                  <i class="fas fa-trash text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                  <span>Trash</span>
                </div>
                <span id="trash-count-menu" class="hidden text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">0</span>
              </button>
              
              <!-- Activity Feed -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openActivityFeed(); toggleUserMenu();">
                <i class="fas fa-history text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Activity Feed</span>
              </button>
              
              <!-- Dashboard -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openDashboard(); toggleUserMenu();">
                <i class="fas fa-chart-pie text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Dashboard</span>
              </button>
              
              <!-- Change Background -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="openBackgroundPicker(); toggleUserMenu();">
                <i class="fas fa-image text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Change Background</span>
              </button>
              
              <!-- Keyboard Shortcuts -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="showKeyboardShortcuts(); toggleUserMenu();">
                <i class="fas fa-keyboard text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Keyboard Shortcuts</span>
              </button>
              
              <!-- Edit Project -->
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group" onclick="editCurrentProject(); toggleUserMenu();">
                <i class="fas fa-cog text-gray-500 dark:text-gray-400 group-hover:text-accent w-5 text-center"></i>
                <span>Project Settings</span>
              </button>
            </div>
            
            <!-- Divider -->
            <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            
            <!-- Reset Demo Data -->
            <div class="py-1">
              <button class="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 group text-orange-500" onclick="if(confirm('Reset all demo data?')){DemoAPI.reset();location.reload();}; toggleUserMenu();">
                <i class="fas fa-sync-alt w-5 text-center"></i>
                <span>Reset Demo Data</span>
              </button>
            </div>
            
            <!-- Network Status (subtle indicator at bottom) -->
            <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <p class="text-xs text-gray-400 dark:text-gray-500">TaskFlow Demo v1.0.0</p>
                <div id="user-menu-network-status" class="flex items-center gap-1.5 text-xs">
                  <i class="fas fa-flask text-purple-500"></i>
                  <span class="text-purple-500">Demo Mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Offline Banner -->
    <div id="offline-banner" class="hidden bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium offline-banner">
      <i class="fas fa-wifi-slash mr-2"></i>
      You're offline. Changes will sync when you're back online.
      <button onclick="syncPendingOperations()" class="ml-2 px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors">
        <i class="fas fa-sync mr-1"></i>Retry Now
      </button>
    </div>
    
    <!-- Error Boundary Container (used by ErrorHandler) -->
    <div id="error-boundary"></div>
    
    <!-- Main Content -->
    <main id="main-content" class="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <!-- Board View -->
      <div id="board-view" class="h-full p-4 pb-6 overflow-x-auto overflow-y-hidden">
        <div id="columns-container" class="flex gap-4 h-full">
          <!-- Columns will be rendered here -->
        </div>
      </div>
      
      <!-- Horizontal Scroll Indicators -->
      <div id="scroll-indicator-left" class="scroll-indicator scroll-indicator-left"></div>
      <div id="scroll-indicator-right" class="scroll-indicator scroll-indicator-right"></div>
      
      <!-- Custom Bottom Scrollbar (Trello-style) -->
      <div id="board-scrollbar" class="board-scrollbar">
        <div class="board-scrollbar-track">
          <div id="board-scrollbar-thumb" class="board-scrollbar-thumb"></div>
        </div>
      </div>
      
      <!-- List View -->
      <div id="list-view" class="hidden h-full p-4 overflow-auto">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <!-- Filters -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Status:</label>
              <select id="filter-status" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="">All</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Priority:</label>
              <select id="filter-priority" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Sort:</label>
              <select id="sort-by" class="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700" onchange="applyFilters()">
                <option value="position">Position</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="updated_at">Last Updated</option>
              </select>
            </div>
          </div>
          
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                </tr>
              </thead>
              <tbody id="tasks-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
                <!-- Tasks will be rendered here -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Calendar View -->
      <div id="calendar-view" class="hidden h-full p-4 overflow-auto">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <!-- Calendar Header -->
          <div class="calendar-header p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button onclick="calendarPrevious()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Previous">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button onclick="calendarToday()" class="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Today</button>
              <button onclick="calendarNext()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Next">
                <i class="fas fa-chevron-right"></i>
              </button>
              <h2 id="calendar-title" class="text-xl font-semibold ml-2">January 2026</h2>
            </div>
            <div class="flex items-center gap-3">
              <!-- Color Mode Toggle -->
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Color by:</span>
                <select id="calendar-color-mode" onchange="renderCalendar()" class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent">
                  <option value="priority">Priority</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <!-- View Mode Toggle -->
              <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button id="btn-month-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm" onclick="setCalendarView('month')">Month</button>
                <button id="btn-week-view" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400" onclick="setCalendarView('week')">Week</button>
              </div>
            </div>
          </div>
          
          <!-- Calendar Grid -->
          <div id="calendar-grid" class="calendar-grid">
            <!-- Calendar content will be rendered here -->
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <!-- Task Modal -->
  <div id="task-modal" class="hidden fixed inset-0 z-50">
    <div class="modal-backdrop absolute inset-0 bg-black/50" onclick="closeTaskModal()"></div>
    <div class="modal-content absolute inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div id="task-modal-content">
        <!-- Modal content will be rendered here -->
      </div>
    </div>
  </div>
  
  <!-- Trash Modal -->
  <div id="trash-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-6">
    <div class="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeTrashModal()"></div>
    <div class="modal-content utility-modal relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-h-[80vh]" style="max-width: 400px;">
      <div class="utility-modal-header px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <i class="fas fa-trash text-red-500 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Trash</h2>
          </div>
        </div>
        <button onclick="closeTrashModal()" class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      <div id="trash-content" class="utility-modal-body px-5 py-4 overflow-y-auto flex-1">
        <!-- Trash items will be rendered here -->
      </div>
    </div>
  </div>
  
  <!-- Toast Container -->
  <div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <!-- Toasts will be rendered here -->
  </div>
  
  <!-- Loading Overlay -->
  <div id="loading-overlay" class="hidden fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center">
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
      <p class="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>

  <!-- Demo Mode Banner -->
  <div id="demo-banner" class="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
    <div class="flex-shrink-0">
      <i class="fas fa-flask text-lg"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium">Demo Mode</p>
      <p class="text-xs text-white/80">Data is stored locally in your browser</p>
    </div>
    <button onclick="document.getElementById('demo-banner').style.display='none'" class="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors" title="Dismiss">
      <i class="fas fa-times text-sm"></i>
    </button>
  </div>

  <!-- Demo API Scripts (must load before app.js) -->
  <script src="${base}static/demo-data.js"></script>
  <script src="${base}static/demo-api.js"></script>
  <script src="${base}static/app.js"></script>
</body>
</html>`;

// Write index.html to dist folder
writeFileSync(join(distDir, 'index.html'), html);

// GitHub Pages: disable Jekyll processing
writeFileSync(join(distDir, '.nojekyll'), '');

console.log(`✓ Generated dist/index.html for demo mode (BASE_PATH=${base})`);
