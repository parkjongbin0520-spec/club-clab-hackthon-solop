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

// 활동명이 비어 있는지 검사하고 통과 여부를 반환한다
function validateForm(form) {
  const errorEl = document.getElementById("title-error");
  const title = form.title.value.trim();
  if (!title) {
    errorEl.textContent = "활동명을 입력해야 등록할 수 있어요.";
    form.title.focus();
    return false;
  }
  errorEl.textContent = "";
  return true;
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
}

document.getElementById("activity-form").addEventListener("submit", handleSubmit);
