const STORAGE_KEY = "activities";
let editingId = null;
let dialogRating = 0;
let selectMode = false;
let selectedIds = new Set();

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

// 콤마로 구분된 입력을 태그 배열로 변환한다 (빈 항목 제거)
function parseTagsInput(raw) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
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

// 활동 1건의 필드를 수정해 저장한다
function updateActivity(id, fields) {
  const activities = loadActivities();
  const target = activities.find((activity) => activity.id === id);
  if (!target) {
    return;
  }
  Object.assign(target, fields);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

// 모달의 별점 버튼 표시를 dialogRating 값에 맞게 갱신한다
function updateDialogStars() {
  document.querySelectorAll("#dialog-stars .star-button").forEach((button) => {
    button.textContent = Number(button.dataset.value) <= dialogRating ? "★" : "☆";
  });
}

// 등록/수정 폼과 모달을 초기 상태로 되돌린다
function resetDialogState() {
  editingId = null;
  dialogRating = 0;
  document.getElementById("activity-form").reset();
  updateDialogStars();
  document.querySelector(".stamp-button").textContent = "기록하기";
}

// 새 활동을 기록하기 위해 모달을 연다
function openCreateDialog() {
  resetDialogState();
  document.getElementById("activity-dialog").showModal();
}

// 활동 카드의 값을 등록 폼으로 불러와 수정 모드로 모달을 연다
function startEditing(activity) {
  const form = document.getElementById("activity-form");
  form.title.value = activity.title;
  form.date.value = activity.date;
  form.place.value = activity.place;
  form.tags.value = (activity.tags || []).join(", ");
  form.memberCount.value = activity.memberCount;
  form.memo.value = activity.memo;
  form.review.value = activity.review || "";
  dialogRating = activity.rating || 0;
  updateDialogStars();

  editingId = activity.id;
  document.querySelector(".stamp-button").textContent = "수정 완료";
  document.getElementById("activity-dialog").showModal();
}

// 저장된 활동을 최신순으로 정렬해서 불러온다
function loadActivities() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const activities = raw ? JSON.parse(raw) : [];
  return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 평가(별점, 한줄평)를 읽기 전용으로 보여주는 줄을 만든다. 수정은 모달에서 한다.
function createRatingDisplay(activity) {
  const displayLine = document.createElement("p");
  displayLine.className = "rating-display";
  displayLine.textContent = activity.rating
    ? `평가: ${"★".repeat(activity.rating)}${"☆".repeat(5 - activity.rating)} · ${activity.review || "한줄평 없음"}`
    : "평가: 평가 없음";
  return displayLine;
}

// 활동 1건을 카드 요소로 만든다
function createActivityCard(activity) {
  const card = document.createElement("details");
  card.className = "activity-card";
  card.dataset.id = activity.id;
  if (selectMode) {
    card.classList.add("selectable");
  }
  if (selectedIds.has(activity.id)) {
    card.classList.add("selected");
  }

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

  if (activity.tags && activity.tags.length > 0) {
    const tagsWrap = document.createElement("span");
    tagsWrap.className = "tag-badges";
    activity.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.className = "tag-badge";
      badge.textContent = tag;
      tagsWrap.appendChild(badge);
    });
    summaryMain.appendChild(tagsWrap);
  }

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

  detail.appendChild(createRatingDisplay(activity));

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-button";
  editButton.textContent = "수정";
  editButton.addEventListener("click", () => startEditing(activity));

  const actionRow = document.createElement("div");
  actionRow.className = "action-row";
  actionRow.appendChild(editButton);
  detail.appendChild(actionRow);

  card.appendChild(detail);
  return card;
}

// 선택 삭제 버튼의 문구와 강조 상태를 갱신한다
function updateSelectButtonLabel() {
  const button = document.getElementById("toggle-select-button");
  button.classList.toggle("active", selectMode);
  if (!selectMode) {
    button.textContent = "삭제";
    return;
  }
  button.textContent = selectedIds.size > 0 ? `선택 삭제 (${selectedIds.size})` : "선택 취소";
}

// 카드 1건의 선택 상태를 토글한다 (일괄 삭제용)
function toggleCardSelection(card) {
  const id = card.dataset.id;
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
    card.classList.remove("selected");
  } else {
    selectedIds.add(id);
    card.classList.add("selected");
  }
  updateSelectButtonLabel();
}

// 삭제 선택 모드를 켜고 끄거나, 선택된 항목을 한꺼번에 삭제한다
function toggleSelectMode() {
  if (!selectMode) {
    selectMode = true;
    selectedIds.clear();
    document.querySelectorAll(".activity-card[open]").forEach((el) => {
      el.open = false;
    });
    updateSelectButtonLabel();
    renderList();
    return;
  }

  if (selectedIds.size === 0) {
    selectMode = false;
    updateSelectButtonLabel();
    renderList();
    return;
  }

  if (confirm(`선택한 ${selectedIds.size}개 활동을 삭제할까요?`)) {
    const remaining = loadActivities().filter((activity) => !selectedIds.has(activity.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    selectMode = false;
    selectedIds.clear();
    updateSelectButtonLabel();
    renderList();
  }
}

// 선택 모드에서 카드(summary) 클릭을 감지해 확장 대신 선택을 토글한다
function handleListClick(event) {
  const summary = event.target.closest("summary");
  if (!selectMode || !summary) {
    return;
  }
  event.preventDefault();
  toggleCardSelection(summary.closest(".activity-card"));
}

// 검색창 입력을 "tag:태그1,태그2" 토큰과 나머지 키워드로 분리한다
function parseSearchQuery(rawQuery) {
  const tags = [];
  const keyword = rawQuery
    .replace(/tag:(\S+)/g, (_, tagList) => {
      tagList.split(",").forEach((tag) => {
        if (tag) {
          tags.push(tag.toLowerCase());
        }
      });
      return "";
    })
    .trim()
    .toLowerCase();
  return { tags, keyword };
}

// 검색어(키워드+태그)·기간 필터를 적용한 활동 목록을 반환한다
function filterActivities(activities) {
  const { tags: tagQueries, keyword } = parseSearchQuery(
    document.getElementById("search-input").value.trim()
  );
  const start = document.getElementById("filter-start").value;
  const end = document.getElementById("filter-end").value;

  return activities.filter((activity) => {
    const activityTags = (activity.tags || []).map((tag) => tag.toLowerCase());
    const matchesTags = tagQueries.every((tag) => activityTags.includes(tag));
    const matchesKeyword =
      !keyword ||
      activity.title.toLowerCase().includes(keyword) ||
      (activity.place || "").toLowerCase().includes(keyword);
    const matchesStart = !start || (activity.date && activity.date >= start);
    const matchesEnd = !end || (activity.date && activity.date <= end);
    return matchesTags && matchesKeyword && matchesStart && matchesEnd;
  });
}

// 검색창의 마지막 입력 토큰이 "tag:"로 시작하면, 남은 부분을 완성할 태그
// 후보로 datalist를 채운다. 이미 검색어에 쓰인 태그는 후보에서 뺀다.
function updateTagSuggestions() {
  const input = document.getElementById("search-input");
  const value = input.value;
  const lastSpaceIndex = value.lastIndexOf(" ");
  const prefix = lastSpaceIndex === -1 ? "" : value.slice(0, lastSpaceIndex + 1);
  const lastToken = lastSpaceIndex === -1 ? value : value.slice(lastSpaceIndex + 1);

  const datalist = document.getElementById("tag-options");
  datalist.innerHTML = "";

  if (!lastToken.startsWith("tag:")) {
    return;
  }

  const segments = lastToken.slice(4).split(",");
  const partial = segments.pop().toLowerCase();
  const committed = segments.filter((tag) => tag.length > 0);
  const usedTags = new Set(committed.map((tag) => tag.toLowerCase()));

  const allTags = new Set();
  loadActivities().forEach((activity) => {
    (activity.tags || []).forEach((tag) => allTags.add(tag));
  });

  allTags.forEach((tag) => {
    const tagLower = tag.toLowerCase();
    if (usedTags.has(tagLower) || !tagLower.startsWith(partial)) {
      return;
    }
    const option = document.createElement("option");
    option.value = `${prefix}tag:${[...committed, tag].join(",")}`;
    datalist.appendChild(option);
  });
}

// 활동 목록 영역을 다시 그린다
function renderList() {
  const listEl = document.getElementById("activity-list");
  const openIds = Array.from(listEl.querySelectorAll(".activity-card[open]")).map(
    (el) => el.dataset.id
  );
  listEl.innerHTML = "";

  const allActivities = loadActivities();
  const activities = filterActivities(allActivities);
  if (activities.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent =
      allActivities.length === 0
        ? "아직 등록된 활동이 없어요. '+ 새 활동 기록' 버튼을 눌러보세요."
        : "조건에 맞는 활동이 없어요.";
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

  const fields = {
    title: form.title.value,
    date: form.date.value,
    place: form.place.value,
    tags: parseTagsInput(form.tags.value),
    memberCount: Number(form.memberCount.value),
    memo: form.memo.value,
    rating: dialogRating,
    review: form.review.value.trim(),
  };

  if (editingId) {
    updateActivity(editingId, fields);
  } else {
    saveActivity({ id: generateId(), createdAt: new Date().toISOString(), ...fields });
  }

  document.getElementById("activity-dialog").close();
  renderList();
}

// 모달 바깥(백드롭) 클릭을 감지해 모달을 닫는다
function handleDialogBackdropClick(event) {
  const dialog = event.currentTarget;
  const rect = dialog.getBoundingClientRect();
  const clickedInside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!clickedInside) {
    dialog.close();
  }
}

const activityDialog = document.getElementById("activity-dialog");
activityDialog.addEventListener("close", resetDialogState);
activityDialog.addEventListener("click", handleDialogBackdropClick);

document.getElementById("activity-form").addEventListener("submit", handleSubmit);
document.getElementById("activity-list").addEventListener("click", handleListClick);
document.getElementById("open-create-button").addEventListener("click", openCreateDialog);
document.getElementById("cancel-dialog-button").addEventListener("click", () => {
  activityDialog.close();
});
document.getElementById("search-input").addEventListener("input", renderList);
document.getElementById("search-input").addEventListener("input", updateTagSuggestions);
document.getElementById("filter-start").addEventListener("change", renderList);
document.getElementById("filter-end").addEventListener("change", renderList);
document.getElementById("toggle-select-button").addEventListener("click", toggleSelectMode);
document.getElementById("dialog-stars").addEventListener("click", (event) => {
  if (!event.target.classList.contains("star-button")) {
    return;
  }
  dialogRating = Number(event.target.dataset.value);
  updateDialogStars();
});
renderList();
