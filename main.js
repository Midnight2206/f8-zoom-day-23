const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

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
function render(
  data,
  message = "Chưa có công việc nào, hãy thêm công việc mới"
) {
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
      dt.complete &&
        cloneCard.querySelector(".task-card").classList.add(`complete-card`);
      dt.cardColor &&
        cloneCard
          .querySelector(".task-card")
          .classList.add(`${dt.cardColor}-card`);
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
render(JSON.parse(localStorage.getItem("tasksData")) || []);
function formSubmit(e, mode, id) {
  const task = {};
  const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];
  e.preventDefault();
  const newTask = new FormData(taskForm);
  for (const [key, value] of newTask.entries()) {
    task[key] = value;
  }
  if (mode === "add") {
    task.id = Date.now().toString();
    tasksData.unshift(task);
  }
  if (mode === "edit") {
    const index = tasksData.findIndex((t) => t.id === id);
    task.id = Date.now().toString();
    if (index !== -1) {
      tasksData[index] = { ...tasksData[index], ...task };
    }
  }
  localStorage.setItem("tasksData", JSON.stringify(tasksData));
  const data = JSON.parse(localStorage.getItem("tasksData")) || [];
  render(data);
  taskModal.classList.add("hidden");
}
function modalOpen(mode, id) {
  taskForm.setAttribute("mode", mode);
  taskForm.reset();
  id && taskForm.setAttribute("data-id", id);
  taskModal.classList.remove("hidden");
  modalContent.scrollTop = 0;
  switch (mode) {
    case "add":
      taskModal.querySelector("#modal-title").textContent =
        "Thêm công việc mới";
      taskModal.querySelector(".btn-submit").textContent = "Lưu";
      break;
    case "edit":
      taskModal.querySelector("#modal-title").textContent =
        "Chỉnh sửa công việc";
      taskModal.querySelector(".btn-submit").textContent = "Sửa";
      break;
  }
}
addTaskButton.onclick = () => {
  modalOpen("add");
};

btnCancel.onclick = () => {
  taskTitleWarning.classList.add("hidden");
  taskModal.classList.add("hidden");
};
taskModal.onclick = (e) => {
  if (!modalContent.contains(e.target)) {
    taskModal.classList.add("hidden");
  }
};
taskList.onclick = (e) => {
  const btnDel = e.target.closest(".btn-delete");
  const btnEdit = e.target.closest(".btn-edit");
  const btnComplete = e.target.closest(".btn-complete");
  if (btnDel) {
    const card = btnDel.closest(".task-card");
    const id = card.getAttribute("data-id");
    const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];
    const updatedTasks = tasksData.filter((task) => task.id !== id);
    localStorage.setItem("tasksData", JSON.stringify(updatedTasks));
    render(updatedTasks);
  }
  if (btnEdit) {
    const card = btnEdit.closest(".task-card");
    const id = card.getAttribute("data-id");
    const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];
    const task = tasksData.find((task) => task.id === id);
    modalOpen("edit", id);
    taskForm.querySelectorAll("[name]").forEach((item) => {
      item.value = task[item.name] || "";
    });
  }
  if (btnComplete) {
    const card = btnComplete.closest(".task-card");
    const id = card.getAttribute("data-id");
    const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];
    const index = tasksData.findIndex((task) => task.id === id);
    if (index !== -1) tasksData[index].complete = !tasksData[index].complete;
    localStorage.setItem("tasksData", JSON.stringify(tasksData));
    const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
    btnsFilter.forEach((btn) => {
      if (btn.dataset.filter === "all") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    render(tasksData);
  }
};
taskFilter.onclick = (e) => {
  const btnFilter = e.target.closest(".btn-filter");
  filterMode = btnFilter.dataset.filter;
  if (!btnFilter) return;
  const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
  btnsFilter.forEach((btn) => btn.classList.remove("active"));
  btnFilter.classList.add("active");
  const tasksData = JSON.parse(localStorage.getItem("tasksData"));
  switch (filterMode) {
    case "completed":
      render(
        tasksData.filter((data) => data.complete),
        "Không có công việc nào đã hoàn thành"
      );
      break;
    case "incomplete":
      render(
        tasksData.filter((data) => !data.complete),
        "Không có công việc nào chưa hoàn thành"
      );
      break;
    case "all":
      render(tasksData);
      break;
    default:
      return;
  }
};
searchInput.oninput = debounce((e) => {
  keysearch = e.target.value.toLowerCase();
  if (keysearch) {
    clearBtn.classList.add("active");
    const btnsFilter = taskFilter.querySelectorAll(".btn-filter");
    btnsFilter.forEach((btn) => {
      if (btn.dataset.filter === "all") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  } else {
    clearBtn.classList.remove("active");
  }
  const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];
  const filterTasks = tasksData.filter(
    (data) =>
      data.title.toLowerCase().includes(keysearch) ||
      data.description.toLowerCase().includes(keysearch)
  );
  render(filterTasks, "Không tìm thấy công việc tương ứng");
}, 300);
clearBtn.onclick = () => {
  searchInput.value = "";
  render(JSON.parse(localStorage.getItem("tasksData")) || []);
  clearBtn.classList.remove("active");
};
const inputTitle = taskForm.querySelector('input[name="title"]');
inputTitle.oninput = (e) => {
  const tasksData = JSON.parse(localStorage.getItem("tasksData")) || [];

  if (tasksData.some((data) => data.title === e.target.value)) {
    taskTitleWarning.classList.remove("hidden");
    taskForm.onsubmit = (e) => {
      e.preventDefault();
    };
  } else {
    taskTitleWarning.classList.add("hidden");
    taskForm.onsubmit = function (e) {
      id = this.getAttribute("data-id");
      mode = this.getAttribute("mode");
      formSubmit(e, mode, id);
    };
  }
};
