const SHEET_NAME = "Responses";
const HEADERS = [
  "id",
  "name",
  "phone",
  "slots",
  "activities",
  "topics",
  "memo",
  "submittedAt",
];

function doGet(event) {
  const action = event.parameter.action || "list";

  if (action !== "list") {
    return jsonOutput({ ok: false, error: "Unsupported action" });
  }

  return jsonOutput({
    ok: true,
    responses: readResponses(),
  });
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");

    if (payload.action !== "upsert") {
      return jsonOutput({ ok: false, error: "Unsupported action" });
    }

    const response = payload.response || {};
    upsertResponse(response);

    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function upsertResponse(response) {
  const sheet = getResponseSheet();
  const values = sheet.getDataRange().getValues();
  const id = String(response.id || response.name || "").trim().toLowerCase();

  if (!id) {
    throw new Error("성함이 필요합니다.");
  }

  const row = [
    id,
    response.name || "",
    response.phone || "",
    JSON.stringify(response.slots || []),
    JSON.stringify(response.activities || []),
    response.topics || "",
    response.memo || "",
    response.submittedAt || new Date().toISOString(),
  ];

  const existingRowIndex = values.findIndex((currentRow, index) => {
    return index > 0 && String(currentRow[0]).trim().toLowerCase() === id;
  });

  if (existingRowIndex >= 0) {
    sheet.getRange(existingRowIndex + 1, 1, 1, HEADERS.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function readResponses() {
  const sheet = getResponseSheet();
  const values = sheet.getDataRange().getValues();

  return values.slice(1).filter((row) => row[0]).map((row) => ({
    id: row[0],
    name: row[1],
    phone: row[2],
    slots: parseArray(row[3]),
    activities: parseArray(row[4]),
    topics: row[5],
    memo: row[6],
    submittedAt: row[7],
  }));
}

function getResponseSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parseArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
