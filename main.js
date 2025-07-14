const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const APIURL = "https://json-server-todolist-api.onrender.com/tasksData";

const taskInput = $("#task-input");
const addTaskButton = $("#add-task");
const taskList = $("#task-list");
const taskCards = $$(".task-card");
const taskTitles = $$(".task-title");
const taskTimes = $$(".task-time");
const taskDescs = $$(".task-desc");
const taskFilter = $(".task-filter");
const taskModal = $("#task-modal");
const modalContent = $(".modal-content");
const btnCancel = $(".btn-cancel");
const taskForm = $("#task-form");
const searchInput = $("#search-input");
const taskCardTemplate = $(".task-card-template");
const taskSearch = $(".task-search");
const clearBtn = taskSearch.querySelector(".clear-btn");
const taskTitleWarning = taskForm.querySelector(".task-title-warning");
const taskMassage = $(".task-massage");

function render(data, message = "Chưa có công việc nào, hãy thêm công việc mới") {
  taskList.innerHTML = "";
  if (data.length === 0) {
    taskMassage.classList.remove("hidden");
    taskMassage.querySelector("p").textContent = message;
    return;
  } else {
    data.forEach((dt) => {
      const cloneCard = taskCardTemplate.content.cloneNode(true);
      taskMassage.classList.add("hidden");
      const templateQuery = cloneCard.querySelector.bind(cloneCard);
      templateQuery(".task-card").setAttribute("data-id", dt.id);
      dt.complete && cloneCard.querySelector(".task-card").classList.add(`complete-card`);
      dt.cardColor && cloneCard.querySelector(".task-card").classList.add(`${dt.cardColor}-card`);
      templateQuery(".task-title").textContent = dt.title;
      templateQuery(".task-category").textContent = dt.category;
      templateQuery(".task-desc").textContent = dt.description;
      templateQuery(".task-due-date").textContent = dt.dueDate;
      templateQuery(".task-start-time").textContent = dt.startTime;
      templateQuery(".task-end-time").textContent = dt.endTime;
      templateQuery(".task-priority").textContent = dt.priority;
      taskList.appendChild(cloneCard);
    });
  }
}

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

getData().then((data) => render(data || []));

async function formSubmit(e, mode, id) {
  e.preventDefault();
  const task = {};
  const newTask = new FormData(taskForm);
  for (const [key, value] of newTask.entries()) {
    task[key] = value;
  }

  if (mode === "add") {
    task.id = Date.now().toString();
    await addTask(task);
  }

  if (mode === "edit") {
    await updateTask(id, task);
  }

  const data = await getData();
  render(data || []);
  taskTitleWarning.classList.add("hidden")
  taskModal.classList.add("hidden");
}

function modalOpen(mode, id) {
  taskForm.setAttribute("mode", mode);
  taskForm.reset();
  id && taskForm.setAttribute("data-id", id);
  taskModal.classList.remove("hidden");
  const firstInput = taskForm.querySelector('input:not([type=hidden]):not([disabled])');
  if (firstInput) firstInput.focus();
  modalContent.scrollTop = 0;
  switch (mode) {
    case "add":
      taskModal.querySelector("#modal-title").textContent = "Thêm công việc mới";
      taskModal.querySelector(".btn-submit").textContent = "Lưu";
      break;
    case "edit":
      taskModal.querySelector("#modal-title").textContent = "Chỉnh sửa công việc";
      taskModal.querySelector(".btn-submit").textContent = "Sửa";
      break;
  }
}

addTaskButton.onclick = () => modalOpen("add");

btnCancel.onclick = () => {
  taskTitleWarning.classList.add("hidden");
  taskModal.classList.add("hidden");
};

taskModal.onclick = (e) => {
  if (!modalContent.contains(e.target)) {
    taskTitleWarning.classList.add("hidden")
    taskModal.classList.add("hidden");
  }
};

taskList.onclick = async (e) => {
  const btnDel = e.target.closest(".btn-delete");
  const btnEdit = e.target.closest(".btn-edit");
  const btnComplete = e.target.closest(".btn-complete");

  if (btnDel) {
    const id = btnDel.closest(".task-card").getAttribute("data-id");
    await deleteTask(id);
    const data = await getData();
    render(data || []);
  }

  if (btnEdit) {
    const id = btnEdit.closest(".task-card").getAttribute("data-id");
    const data = await getData();
    const task = data.find((task) => task.id === id);
    modalOpen("edit", id);
    taskForm.querySelectorAll("[name]").forEach((item) => {
      item.value = task[item.name] || "";
    });
  }

  if (btnComplete) {
    const id = btnComplete.closest(".task-card").getAttribute("data-id");
    const data = await getData();
    const task = data.find((t) => t.id === id);
    if (task) {
      task.complete = !task.complete;
      await updateTask(id, task);
    }
    render(await getData());
    const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
    btnsFilter.forEach((btn) => {
      btn.dataset.filter === "all" ? btn.classList.add("active") : btn.classList.remove("active");
    });
  }
};

taskFilter.onclick = async (e) => {
  searchInput.value = "";
  const btnFilter = e.target.closest(".btn-filter");
  if (!btnFilter) return;
  const filterMode = btnFilter.dataset.filter;
  const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
  btnsFilter.forEach((btn) => btn.classList.remove("active"));
  btnFilter.classList.add("active");

  const data = await getData();
  switch (filterMode) {
    case "completed":
      render(data.filter((t) => t.complete), "Không có công việc nào đã hoàn thành");
      break;
    case "incomplete":
      render(data.filter((t) => !t.complete), "Không có công việc nào chưa hoàn thành");
      break;
    default:
      render(data);
  }
};

searchInput.oninput = debounce(async (e) => {
  const keysearch = e.target.value.toLowerCase();
  if (keysearch) {
    clearBtn.classList.add("active");
    const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
    btnsFilter.forEach((btn) => {
      btn.dataset.filter === "all" ? btn.classList.add("active") : btn.classList.remove("active");
    });
  } else {
    clearBtn.classList.remove("active");
  }
  const data = await getData();
  const result = data.filter(
    (t) =>
      t.title.toLowerCase().includes(keysearch) ||
      t.description.toLowerCase().includes(keysearch)
  );
  render(result, "Không tìm thấy công việc tương ứng");
}, 300);

clearBtn.onclick = async () => {
  searchInput.value = "";
  clearBtn.classList.remove("active");
  render(await getData());
};

const inputTitle = taskForm.querySelector('input[name="title"]');
inputTitle.oninput = async (e) => {
  const data = await getData();
  if (data.some((d) => d.title === e.target.value)) {
    taskTitleWarning.classList.remove("hidden");
    taskForm.onsubmit = (e) => e.preventDefault();
  } else {
    taskTitleWarning.classList.add("hidden");
    taskForm.onsubmit = function (e) {
      const id = this.getAttribute("data-id");
      const mode = this.getAttribute("mode");
      formSubmit(e, mode, id);
    };
  }
};

async function getData() {
  try {
    const res = await fetch(APIURL);
    return await res.json();
  } catch (err) {
    console.error("Error fetching data:", err);
    return [];
  }
}

async function addTask(task) {
  try {
    const res = await fetch(APIURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return await res.json();
  } catch (err) {
    console.error("Error adding task:", err);
  }
}

async function updateTask(id, task) {
  try {
    const res = await fetch(`${APIURL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return await res.json();
  } catch (err) {
    console.error("Error updating task:", err);
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`${APIURL}/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}
