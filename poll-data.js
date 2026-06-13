(function () {
  const pollYear = 2026;
  const pollMonthIndex = 6;
  const storageKey = "theMarkWorldShareholderPoll";
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  function buildSlots() {
    const slots = [];

    for (let day = 1; day <= 19; day += 1) {
      const date = new Date(pollYear, pollMonthIndex, day);
      const dateLabel = `7/${day}(${weekdays[date.getDay()]})`;

      slots.push({
        id: `2026-07-${String(day).padStart(2, "0")}-lunch`,
        date: dateLabel,
        meal: "점심",
        label: `${dateLabel} 점심`,
        group: "lunch",
      });

      slots.push({
        id: `2026-07-${String(day).padStart(2, "0")}-dinner`,
        date: dateLabel,
        meal: "저녁",
        label: `${dateLabel} 저녁`,
        group: "dinner",
      });
    }

    return slots;
  }

  function readResponses() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn("투표 데이터를 읽을 수 없습니다.", error);
      return [];
    }
  }

  function writeResponses(responses) {
    localStorage.setItem(storageKey, JSON.stringify(responses));
  }

  function getSlotLabel(slotId) {
    const slot = window.PollData.slots.find((item) => item.id === slotId);
    return slot ? slot.label : slotId;
  }

  function countBy(values, allowedValues) {
    const counts = new Map(allowedValues.map((value) => [value, 0]));

    values.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts, ([id, count]) => ({ id, count }));
  }

  function getTopSlot(responses) {
    const selections = responses.flatMap((response) => response.slots || []);
    const counts = countBy(
      selections,
      window.PollData.slots.map((slot) => slot.id),
    );
    const best = counts.sort((a, b) => b.count - a.count)[0];

    if (!best || best.count === 0) {
      return null;
    }

    return {
      ...best,
      label: getSlotLabel(best.id),
    };
  }

  window.PollData = {
    storageKey,
    slots: buildSlots(),
    readResponses,
    writeResponses,
    getSlotLabel,
    getTopSlot,
    countBy,
  };
})();
