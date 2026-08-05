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

const FUTURE_DATE_MESSAGES = [
  "아직 하지 않은 활동은 등록할 수 없어요.",
  "미래의 활동은 아직 기록할 수 없어요.",
  "날짜가 미래예요. 지난 활동만 기록할 수 있어요.",
];

// 미래 날짜 오류 문구를 무작위로 하나 고른다
function pickFutureDateMessage() {
  const index = Math.floor(Math.random() * FUTURE_DATE_MESSAGES.length);
  return FUTURE_DATE_MESSAGES[index];
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
    dateError.textContent = pickFutureDateMessage();
    firstInvalidField = firstInvalidField || form.date;
    isValid = false;
  } else {
    dateError.textContent = "";
  }

  const memberError = document.getElementById("memberCount-error");
  const memberNumber = Number(form.memberCount.value);
  if (!form.memberCount.value || !Number.isInteger(memberNumber) || memberNumber < 1) {
    memberError.textContent = "참여 인원은 1명 이상으로 설정해야해요.";
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

// 특정 활동의 평가(별점, 한줄평)를 저장한다
function saveRating(id, rating, review) {
  const activities = loadActivities();
  const target = activities.find((activity) => activity.id === id);
  if (!target) {
    return;
  }
  target.rating = rating;
  target.review = review;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
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

// 평가 표시 줄과 (평소엔 숨겨진) 별점·한줄평 입력 폼을 만든다.
// 입력 폼을 여닫는 토글 버튼은 따로 반환해 삭제 버튼 옆에 배치한다.
function createRatingSection(activity) {
  const section = document.createElement("div");
  section.className = "rating-section";

  const displayLine = document.createElement("p");
  displayLine.className = "rating-display";
  displayLine.textContent = activity.rating
    ? `평가: ${"★".repeat(activity.rating)}${"☆".repeat(5 - activity.rating)} · ${activity.review || "한줄평 없음"}`
    : "평가: 평가 없음";
  section.appendChild(displayLine);

  const form = document.createElement("div");
  form.className = "rating-form";
  form.hidden = true;
  section.appendChild(form);

  const starRow = document.createElement("div");
  starRow.className = "star-input";
  let selectedRating = activity.rating || 0;
  for (let i = 1; i <= 5; i++) {
    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.className = "star-button";
    starButton.textContent = i <= selectedRating ? "★" : "☆";
    starButton.dataset.value = String(i);
    starRow.appendChild(starButton);
  }
  form.appendChild(starRow);

  const reviewInput = document.createElement("input");
  reviewInput.type = "text";
  reviewInput.className = "review-input";
  reviewInput.placeholder = "한줄평을 입력하세요";
  reviewInput.value = activity.review || "";
  form.appendChild(reviewInput);

  starRow.addEventListener("click", (event) => {
    if (!event.target.classList.contains("star-button")) {
      return;
    }
    selectedRating = Number(event.target.dataset.value);
    Array.from(starRow.children).forEach((btn, index) => {
      btn.textContent = index < selectedRating ? "★" : "☆";
    });
  });

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "rating-toggle-button";
  toggleButton.textContent = "평가";
  toggleButton.addEventListener("click", () => {
    if (form.hidden) {
      form.hidden = false;
      toggleButton.textContent = "평가 저장";
      return;
    }
    saveRating(activity.id, selectedRating, reviewInput.value.trim());
    renderList();
  });

  return { section, toggleButton };
}

// 활동 1건을 카드 요소로 만든다
function createActivityCard(activity) {
  const card = document.createElement("details");
  card.className = "activity-card";
  card.dataset.id = activity.id;

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

  const { section: ratingSection, toggleButton: ratingButton } = createRatingSection(activity);
  detail.appendChild(ratingSection);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "삭제";
  deleteButton.dataset.id = activity.id;

  const actionRow = document.createElement("div");
  actionRow.className = "action-row";
  actionRow.appendChild(ratingButton);
  actionRow.appendChild(deleteButton);
  detail.appendChild(actionRow);

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
  const openIds = Array.from(listEl.querySelectorAll(".activity-card[open]")).map(
    (el) => el.dataset.id
  );
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
    const card = createActivityCard(activity);
    if (openIds.includes(activity.id)) {
      card.open = true;
    }
    listEl.appendChild(card);
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
