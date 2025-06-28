// for Application state
let tasks = []
let currentUser = null
let currentFilters = {
  search: "",
  category: "all",
  priority: "all",
}

// for adding Category and priority configurations
const CATEGORIES = {
  personal: { icon: "🏠", label: "Personal" },
  work: { icon: "💼", label: "Work" },
  shopping: { icon: "🛒", label: "Shopping" },
  health: { icon: "🏥", label: "Health" },
  learning: { icon: "📚", label: "Learning" },
  finance: { icon: "💰", label: "Finance" },
  other: { icon: "📝", label: "Other" },
}

const PRIORITIES = {
  high: { icon: "🔴", label: "High", color: "#ef4444" },
  medium: { icon: "🟡", label: "Medium", color: "#f59e0b" },
  low: { icon: "🟢", label: "Low", color: "#10b981" },
}

// for Initializing  the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

async function initializeApp() {
  // for Check if user is logged in or not 
  const userData = localStorage.getItem("taskflowUser")
  if (!userData) {
    window.location.href = "index.html"
    return
  }

  try {
    currentUser = JSON.parse(userData)
    setupUserInterface()
    await loadTasks()
    setupEventListeners()
    updateAllCounts()
  } catch (error) {
    console.error("Error initializing app:", error)
    localStorage.removeItem("taskflowUser")
    window.location.href = "index.html"
  }
}

function setupUserInterface() {
  // for Setting the  user name and avatar
  document.getElementById("userName").textContent = `Welcome back, ${currentUser.name}!`

  // for  Generate avatar URL as said in pdf
  const avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(currentUser.name)}`
  document.getElementById("userAvatar").src = avatarUrl
}

async function loadTasks() {
  //for  Loading  tasks from localStorage 
  const savedTasks = localStorage.getItem("taskflowTasks")

  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks)
      // it will Migrate old tasks to new format
      tasks = tasks.map((task) => ({
        ...task,
        category: task.category || "other",
        priority: task.priority || "medium",
      }))
    } catch (error) {
      console.error("Error parsing saved tasks:", error)
      tasks = []
    }
  }

  // Basically it check ,If no tasks exist, load dummy data from API and it will return it
  if (tasks.length === 0) {
    await loadDummyTasks()
  }

  renderTasks()
  updateAllCounts()
}

async function loadDummyTasks() {
  try {
    const response = await fetch("https://dummyjson.com/todos")
    const data = await response.json()

    // for Transforming  API data to our task structure with categories and priorities
    tasks = data.todos.slice(0, 10).map((todo, index) => ({
      id: generateId(),
      title: todo.todo,
      stage: "todo",
      category: getRandomCategory(),
      priority: getRandomPriority(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }))

    saveTasks()
  } catch (error) {
    console.error("Error loading dummy tasks:", error)
    // for  Creating some default tasks only  if API fails and not return data
    tasks = [
      {
        id: generateId(),
        title: "🎉 Welcome to TaskFlow! This is your first task.",
        stage: "todo",
        category: "personal",
        priority: "high",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: "✨ Try moving tasks between different stages.",
        stage: "todo",
        category: "other",
        priority: "medium",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: "🔍 Explore the new search and filter features.",
        stage: "todo",
        category: "learning",
        priority: "low",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    ]
    saveTasks()
  }
}

function setupEventListeners() {
  // for  Task form submission
  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault()
    addNewTask()
  })

  // adding Search functionality in it
  const searchInput = document.getElementById("searchInput")
  const clearSearchBtn = document.getElementById("clearSearch")

  searchInput.addEventListener("input", (e) => {
    currentFilters.search = e.target.value
    clearSearchBtn.style.display = e.target.value ? "block" : "none"
    renderTasks()
  })

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = ""
    currentFilters.search = ""
    clearSearchBtn.style.display = "none"
    renderTasks()
  })

  //for adding  Filter functionality to it
  document.getElementById("filterCategory").addEventListener("change", (e) => {
    currentFilters.category = e.target.value
    renderTasks()
  })

  document.getElementById("filterPriority").addEventListener("change", (e) => {
    currentFilters.priority = e.target.value
    renderTasks()
  })

  // Clearing all  filters if needed
  document.getElementById("clearFilters").addEventListener("click", () => {
    currentFilters = { search: "", category: "all", priority: "all" }
    document.getElementById("searchInput").value = ""
    document.getElementById("filterCategory").value = "all"
    document.getElementById("filterPriority").value = "all"
    document.getElementById("clearSearch").style.display = "none"
    renderTasks()
  })

  // Sign out button
  document.getElementById("signOutBtn").addEventListener("click", () => {
    signOut()
  })
}

function addNewTask() {
  const taskInput = document.getElementById("taskInput")
  const categorySelect = document.getElementById("taskCategory")
  const prioritySelect = document.getElementById("taskPriority")

  const taskTitle = taskInput.value.trim()
  const category = categorySelect.value
  const priority = prioritySelect.value

  if (!taskTitle) {
    return
  }

  if (taskTitle.length > 500) {
    alert("Task title is too long. Please keep it under 500 characters.")
    return
  }

  const newTask = {
    id: generateId(),
    title: taskTitle,
    stage: "todo",
    category: category,
    priority: priority,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  }

  tasks.push(newTask)
  taskInput.value = ""

  // celebration effect
  const addButton = document.querySelector(".btn-add")
  addButton.style.transform = "scale(0.95)"
  setTimeout(() => {
    addButton.style.transform = "scale(1)"
  }, 150)

  saveTasks()
  renderTasks()
  updateAllCounts()
}

function moveTask(taskId, newStage) {
  if (!taskId || !newStage) {
    console.error("Invalid task ID or stage")
    return
  }

  const validStages = ["todo", "completed", "archived"]
  if (!validStages.includes(newStage)) {
    console.error("Invalid stage:", newStage)
    return
  }

  const taskIndex = tasks.findIndex((task) => task.id === taskId)
  if (taskIndex !== -1) {
    tasks[taskIndex].stage = newStage
    tasks[taskIndex].lastModified = new Date().toISOString()

    saveTasks()
    renderTasks()
    updateAllCounts()
  } else {
    console.error("Task not found:", taskId)
  }
}

function filterTasks(stageTasks) {
  return stageTasks.filter((task) => {
    // Search filter
    const matchesSearch =
      currentFilters.search === "" || task.title.toLowerCase().includes(currentFilters.search.toLowerCase())

    // Category filter
    const matchesCategory = currentFilters.category === "all" || task.category === currentFilters.category

    // Priority filter
    const matchesPriority = currentFilters.priority === "all" || task.priority === currentFilters.priority

    return matchesSearch && matchesCategory && matchesPriority
  })
}

function renderTasks() {
  const todoList = document.getElementById("todoList")
  const completedList = document.getElementById("completedList")
  const archivedList = document.getElementById("archivedList")

  //for  Clearing existing tasks
  todoList.innerHTML = ""
  completedList.innerHTML = ""
  archivedList.innerHTML = ""

  // Grouping tasks by stage
  const todoTasks = tasks.filter((task) => task.stage === "todo")
  const completedTasks = tasks.filter((task) => task.stage === "completed")
  const archivedTasks = tasks.filter((task) => task.stage === "archived")

  // Apply filters
  const filteredTodoTasks = filterTasks(todoTasks)
  const filteredCompletedTasks = filterTasks(completedTasks)
  const filteredArchivedTasks = filterTasks(archivedTasks)

  // Render tasks for each stage
  renderTasksInStage(filteredTodoTasks, todoList, "todo", todoTasks.length)
  renderTasksInStage(filteredCompletedTasks, completedList, "completed", completedTasks.length)
  renderTasksInStage(filteredArchivedTasks, archivedList, "archived", archivedTasks.length)

  // Update stage counts with filtered numbers
  document.getElementById("todoCount").textContent = filteredTodoTasks.length
  document.getElementById("completedCount").textContent = filteredCompletedTasks.length
  document.getElementById("archivedCount").textContent = filteredArchivedTasks.length
}

function renderTasksInStage(stageTasks, container, stage, totalCount) {
  if (stageTasks.length === 0) {
    const isFiltered = currentFilters.search || currentFilters.category !== "all" || currentFilters.priority !== "all"

    if (isFiltered && totalCount > 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="empty-state-text">No matching tasks</div>
          <div class="empty-state-subtext">Try adjusting your filters</div>
        </div>
      `
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${getStageEmptyIcon(stage)}</div>
          <div class="empty-state-text">No ${stage} tasks</div>
          <div class="empty-state-subtext">${getStageEmptyMessage(stage)}</div>
        </div>
      `
    }
    return
  }

  // Sorting tasks by priority (high -> medium -> low) and then by last modified
  stageTasks.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.lastModified) - new Date(a.lastModified)
  })

  stageTasks.forEach((task) => {
    const taskCard = createTaskCard(task)
    container.appendChild(taskCard)
  })
}

function createTaskCard(task) {
  const card = document.createElement("div")
  card.className = `task-card priority-${task.priority}`

  const highlightedTitle = highlightSearchTerm(task.title, currentFilters.search)

  card.innerHTML = `
    <div class="task-header">
      <div class="task-meta">
        <span class="task-category">${CATEGORIES[task.category]?.icon || "📝"} ${CATEGORIES[task.category]?.label || "Other"}</span>
        <span class="task-priority ${task.priority}">${PRIORITIES[task.priority]?.icon || "🟡"} ${PRIORITIES[task.priority]?.label || "Medium"}</span>
      </div>
    </div>
    <div class="task-content">
      <div class="task-title">${highlightedTitle}</div>
      <div class="task-timestamp">Last modified: ${formatTimestamp(task.lastModified)}</div>
    </div>
    <div class="task-actions">
      ${getTaskActions(task)}
    </div>
  `

  return card
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return escapeHtml(text)

  const escapedText = escapeHtml(text)
  const escapedSearchTerm = escapeHtml(searchTerm)
  const regex = new RegExp(`(${escapedSearchTerm})`, "gi")

  return escapedText.replace(regex, '<span class="search-highlight">$1</span>')
}

function getTaskActions(task) {
  const actions = []

  switch (task.stage) {
    case "todo":
      actions.push(
        `<button class="btn-action complete" onclick="moveTask('${task.id}', 'completed')">✅ Complete</button>`,
      )
      actions.push(
        `<button class="btn-action archive" onclick="moveTask('${task.id}', 'archived')">📦 Archive</button>`,
      )
      break
    case "completed":
      actions.push(`<button class="btn-action todo" onclick="moveTask('${task.id}', 'todo')">📋 Reopen</button>`)
      actions.push(
        `<button class="btn-action archive" onclick="moveTask('${task.id}', 'archived')">📦 Archive</button>`,
      )
      break
    case "archived":
      actions.push(`<button class="btn-action todo" onclick="moveTask('${task.id}', 'todo')">📋 Restore</button>`)
      actions.push(
        `<button class="btn-action complete" onclick="moveTask('${task.id}', 'completed')">✅ Complete</button>`,
      )
      break
  }

  return actions.join("")
}

function updateAllCounts() {
  updateTaskCounts()
  updateTaskStats()
}

function updateTaskCounts() {
  const todoCount = tasks.filter((task) => task.stage === "todo").length
  const completedCount = tasks.filter((task) => task.stage === "completed").length
  const archivedCount = tasks.filter((task) => task.stage === "archived").length

  document.getElementById("todoCount").textContent = todoCount
  document.getElementById("completedCount").textContent = completedCount
  document.getElementById("archivedCount").textContent = archivedCount
}

function updateTaskStats() {
  const totalTasks = tasks.length
  const highPriorityTasks = tasks.filter((task) => task.priority === "high").length
  const completedToday = getCompletedToday()
  const progressPercentage = calculateProgress()

  document.getElementById("totalTasks").textContent = totalTasks
  document.getElementById("highPriorityTasks").textContent = highPriorityTasks
  document.getElementById("completedToday").textContent = completedToday
  document.getElementById("progressPercentage").textContent = progressPercentage + "%"
}

function calculateProgress() {
  const totalTasks = tasks.length
  if (totalTasks === 0) return 0

  const completedTasks = tasks.filter((task) => task.stage === "completed").length
  return Math.round((completedTasks / totalTasks) * 100)
}

function getCompletedToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return tasks.filter((task) => {
    if (task.stage !== "completed") return false
    const taskDate = new Date(task.lastModified)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() === today.getTime()
  }).length
}

function saveTasks() {
  try {
    localStorage.setItem("taskflowTasks", JSON.stringify(tasks))
  } catch (error) {
    console.error("Error saving tasks:", error)
    alert("Unable to save tasks. Please check your browser storage settings.")
  }
}

function signOut() {
  if (confirm("Are you sure you want to sign out? 👋")) {
    localStorage.removeItem("taskflowUser")
    localStorage.removeItem("taskflowTasks")
    window.location.href = "index.html"
  }
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function getStageEmptyIcon(stage) {
  switch (stage) {
    case "todo":
      return "📝"
    case "completed":
      return "🎉"
    case "archived":
      return "📦"
    default:
      return "📋"
  }
}

function getStageEmptyMessage(stage) {
  switch (stage) {
    case "todo":
      return "Add a new task to get started! ✨"
    case "completed":
      return "Complete some tasks to see them here! 🎯"
    case "archived":
      return "Archived tasks will appear here! 📚"
    default:
      return ""
  }
}

function getRandomCategory() {
  const categories = Object.keys(CATEGORIES)
  return categories[Math.floor(Math.random() * categories.length)]
}
//randomly generating priorty
function getRandomPriority() {
  const priorities = ["high", "medium", "low"]
  const weights = [0.2, 0.5, 0.3] // 20% high, 50% medium, 30% low
  const random = Math.random()

  if (random < weights[0]) return "high"
  if (random < weights[0] + weights[1]) return "medium"
  return "low"
}

// Making moveTask function globally available
window.moveTask = moveTask
