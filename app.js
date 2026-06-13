(function () {
  const form = document.querySelector("#voteForm");
  const slotGrid = document.querySelector("#slotGrid");
  const responseCount = document.querySelector("#responseCount");
  const topSlot = document.querySelector("#topSlot");
  const formMessage = document.querySelector("#formMessage");
  const nameInput = document.querySelector("#name");
  const phoneInput = document.querySelector("#phone");
  const topicsInput = document.querySelector("#topics");
  const memoInput = document.querySelector("#memo");
  const publicTotalResponses = document.querySelector("#publicTotalResponses");
  const publicTotalSelections = document.querySelector("#publicTotalSelections");
  const publicBestSlot = document.querySelector("#publicBestSlot");
  const publicSlotResults = document.querySelector("#publicSlotResults");
  const publicActivityResults = document.querySelector("#publicActivityResults");
  const publicResponseRows = document.querySelector("#publicResponseRows");

  const activityOptions = [
    "상반기 성과 공유",
    "재도약 전략 토론",
    "식사와 네트워킹",
    "사업 아이디어 브레인스토밍",
  ];

  function renderSlots() {
    slotGrid.innerHTML = window.PollData.slots
      .map(
        (slot) => `
          <label class="slot-option">
            <input type="checkbox" name="slots" value="${slot.id}" data-group="${slot.group}" />
            <span>
              <strong>${slot.date}</strong>
              <em>${slot.meal}</em>
            </span>
          </label>
        `,
      )
      .join("");
  }

  function renderAll() {
    const responses = window.PollData.readResponses();
    const selections = responses.flatMap((response) => response.slots || []);
    const best = window.PollData.getTopSlot(responses);

    responseCount.textContent = `${responses.length}명`;
    topSlot.textContent = best ? `${best.label} (${best.count}표)` : "아직 없음";
    publicTotalResponses.textContent = `${responses.length}명`;
    publicTotalSelections.textContent = `${selections.length}개`;
    publicBestSlot.textContent = best ? `${best.label} (${best.count}표)` : "아직 없음";

    const slotCounts = window.PollData
      .countBy(
        selections,
        window.PollData.slots.map((slot) => slot.id),
      )
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

    renderBarList(publicSlotResults, slotCounts, window.PollData.getSlotLabel, "아직 선택된 일정이 없습니다.");

    const activityCounts = window.PollData
      .countBy(
        responses.flatMap((response) => response.activities || []),
        activityOptions,
      )
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

    renderBarList(publicActivityResults, activityCounts, (id) => id, "아직 선택된 활동이 없습니다.");
    renderPublicRows(responses);
  }

  function renderBarList(container, items, labelGetter, emptyText) {
    const max = Math.max(...items.map((item) => item.count), 1);
    const visibleItems = items.filter((item) => item.count > 0);

    if (visibleItems.length === 0) {
      container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
      return;
    }

    container.innerHTML = visibleItems
      .map((item, index) => {
        const percent = Math.max(5, Math.round((item.count / max) * 100));

        return `
          <div class="bar-row">
            <div class="bar-label">
              <span>${index + 1}. ${escapeHtml(labelGetter(item.id))}</span>
              <strong>${item.count}표</strong>
            </div>
            <div class="bar-track" aria-hidden="true">
              <span style="width: ${percent}%"></span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderPublicRows(responses) {
    publicResponseRows.innerHTML =
      responses.length > 0
        ? responses
            .map((response) => {
              const notes = [response.topics, response.memo].filter(Boolean).join("\n");

              return `
                <tr>
                  <td>${escapeHtml(response.name)}</td>
                  <td>${(response.slots || []).map(window.PollData.getSlotLabel).map(escapeHtml).join("<br>")}</td>
                  <td>${(response.activities || []).map(escapeHtml).join("<br>") || "-"}</td>
                  <td>${notes ? escapeHtmlMultiline(notes) : "-"}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="4">아직 제출된 응답이 없습니다.</td></tr>`;
  }

  function setGroupChecked(group, checked) {
    document
      .querySelectorAll(`input[name="slots"][data-group="${group}"]`)
      .forEach((input) => {
        input.checked = checked;
      });
  }

  function clearCheckedDates() {
    document.querySelectorAll('input[name="slots"]').forEach((input) => {
      input.checked = false;
    });
  }

  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
      (input) => input.value,
    );
  }

  function saveVote(event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const slots = getCheckedValues("slots");

    if (!name) {
      formMessage.textContent = "성함을 입력해 주세요.";
      nameInput.focus();
      return;
    }

    if (slots.length === 0) {
      formMessage.textContent = "참석 가능한 일정을 1개 이상 선택해 주세요.";
      return;
    }

    const responses = window.PollData.readResponses();
    const existingIndex = responses.findIndex((response) => response.name === name);
    const nextResponse = {
      id: existingIndex >= 0 ? responses[existingIndex].id : createId(),
      name,
      phone: phoneInput.value.trim(),
      slots,
      activities: getCheckedValues("activities"),
      topics: topicsInput.value.trim(),
      memo: memoInput.value.trim(),
      submittedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      responses[existingIndex] = nextResponse;
      formMessage.textContent = `${name}님의 응답을 최신 내용으로 갱신했습니다.`;
    } else {
      responses.push(nextResponse);
      formMessage.textContent = `${name}님의 투표가 제출되었습니다.`;
    }

    window.PollData.writeResponses(responses);
    form.reset();
    renderAll();
    document.querySelector("#publicResults").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `vote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeHtmlMultiline(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  renderSlots();
  renderAll();

  document.querySelector("#selectAllLunch").addEventListener("click", () => setGroupChecked("lunch", true));
  document.querySelector("#selectAllDinner").addEventListener("click", () => setGroupChecked("dinner", true));
  document.querySelector("#clearDates").addEventListener("click", clearCheckedDates);
  form.addEventListener("submit", saveVote);
})();
