const STORAGE_KEY = "activities";

// 활동 고유 id를 생성한다
function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

// 활동 1건을 localStorage에 추가 저장한다
function saveActivity(activity) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const activities = raw ? JSON.parse(raw) : [];
  activities.push(activity);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

// 오늘 날짜를 YYYY-MM-DD 형식 문자열로 반환한다
function getTodayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

// 등록 폼 입력값을 검사하고 통과 여부를 반환한다
function validateForm(form) {
  let isValid = true;
  let firstInvalidField = null;

  const titleError = document.getElementById("title-error");
  const title = form.title.value.trim();
  if (!title) {
    titleError.textContent = "활동명을 입력해야 등록할 수 있어요.";
    firstInvalidField = firstInvalidField || form.title;
    isValid = false;
  } else {
    titleError.textContent = "";
  }

  const dateError = document.getElementById("date-error");
  if (form.date.value && form.date.value > getTodayString()) {
    dateError.textContent = "미래 날짜는 입력할 수 없어요.";
    firstInvalidField = firstInvalidField || form.date;
    isValid = false;
  } else {
    dateError.textContent = "";
  }

  const memberError = document.getElementById("memberCount-error");
  const memberNumber = Number(form.memberCount.value);
  if (!form.memberCount.value || !Number.isInteger(memberNumber) || memberNumber < 1) {
    memberError.textContent = "참여 인원은 1 이상의 정수로 입력해주세요.";
    firstInvalidField = firstInvalidField || form.memberCount;
    isValid = false;
  } else {
    memberError.textContent = "";
  }

  if (firstInvalidField) {
    firstInvalidField.focus();
  }
  return isValid;
}

// 활동 1건을 id로 찾아 삭제한다
function deleteActivityById(id) {
  const remaining = loadActivities().filter((activity) => activity.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

// 저장된 활동을 최신순으로 정렬해서 불러온다
function loadActivities() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const activities = raw ? JSON.parse(raw) : [];
  return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 활동 1건을 카드 요소로 만든다
function createActivityCard(activity) {
  const card = document.createElement("details");
  card.className = "activity-card";

  const summary = document.createElement("summary");
  const summaryMain = document.createElement("span");
  summaryMain.className = "summary-main";

  const nameEl = document.createElement("span");
  nameEl.className = "activity-name";
  nameEl.textContent = activity.title;
  summaryMain.appendChild(nameEl);

  const metaEl = document.createElement("span");
  metaEl.className = "activity-meta";
  metaEl.textContent = `${activity.date || "날짜 미정"} · ${activity.place || "장소 미정"}`;
  summaryMain.appendChild(metaEl);

  summary.appendChild(summaryMain);
  card.appendChild(summary);

  const detail = document.createElement("div");
  detail.className = "activity-detail";

  const memberLine = document.createElement("p");
  memberLine.textContent = `참여 인원: ${activity.memberCount}명`;
  detail.appendChild(memberLine);

  const memoLine = document.createElement("p");
  memoLine.textContent = `메모: ${activity.memo || "없음"}`;
  detail.appendChild(memoLine);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "삭제";
  deleteButton.dataset.id = activity.id;
  detail.appendChild(deleteButton);

  card.appendChild(detail);
  return card;
}

// 목록 영역 클릭을 감지해 삭제 버튼 클릭을 처리한다
function handleListClick(event) {
  if (!event.target.classList.contains("delete-button")) {
    return;
  }
  if (!confirm("이 활동 기록을 삭제할까요?")) {
    return;
  }
  deleteActivityById(event.target.dataset.id);
  renderList();
}

// 활동 목록 영역을 다시 그린다
function renderList() {
  const listEl = document.getElementById("activity-list");
  listEl.innerHTML = "";

  const activities = loadActivities();
  if (activities.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "아직 등록된 활동이 없어요. 위 양식에서 첫 활동을 기록해보세요.";
    listEl.appendChild(empty);
    return;
  }

  activities.forEach((activity) => {
    listEl.appendChild(createActivityCard(activity));
  });
}

// 등록 폼 제출을 처리한다
function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  if (!validateForm(form)) {
    return;
  }

  const activity = {
    id: generateId(),
    title: form.title.value,
    date: form.date.value,
    place: form.place.value,
    memberCount: Number(form.memberCount.value) || 0,
    memo: form.memo.value,
    createdAt: new Date().toISOString(),
  };

  saveActivity(activity);
  form.reset();
  renderList();
}

document.getElementById("activity-form").addEventListener("submit", handleSubmit);
document.getElementById("activity-list").addEventListener("click", handleListClick);
renderList();
