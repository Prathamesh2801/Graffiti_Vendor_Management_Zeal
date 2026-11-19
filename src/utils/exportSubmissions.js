import { imageUrl } from "./imageUrl";

// Excel export of vendor submissions — exactly the rows the user is looking at.
// Sheet 1 "Submissions": one row per submission. Sheet 2 "Photos": one row per photo.
// Both start with a header block (campaign, exported on/by, filters) so a forwarded
// file explains itself. `includeStatus: false` (client role) drops every status column.

const fmtDate = (s) => (s ? s.slice(0, 16) : ""); // "YYYY-MM-DD HH:MM" — sorts correctly as text

function parseLatLng(location) {
  const [lat, lng] = (location || "").replace(" (cached)", "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [null, null];
}

const mapsUrl = (lat, lng) => (lat == null ? "" : `https://maps.google.com/?q=${lat},${lng}`);

/** Pure: builds the rows for both sheets. Kept separate so it can be checked without a browser. */
export function buildSubmissionSheets(records, { includeStatus }) {
  const subHeader = [
    "Sr No", "Submission ID", "Vendor",
    ...(includeStatus ? ["Status"] : []),
    "Photos", "Latitude", "Longitude", "Google Maps", "Submitted On", "Last Updated", "Updated By",
  ];
  const submissions = records.map((r, i) => {
    const [lat, lng] = parseLatLng(r.Location);
    return [
      i + 1, r.ID, r.User_ID,
      ...(includeStatus ? [r.Status] : []),
      (r.Campaign_Images || []).length, lat, lng, mapsUrl(lat, lng),
      fmtDate(r.Created_AT), fmtDate(r.Updated_AT), r.Updated_BY || "",
    ];
  });

  const photoHeader = [
    "Sr No", "Submission ID", "Vendor", "Photo ID",
    ...(includeStatus ? ["Photo Status"] : []),
    "Latitude", "Longitude", "Google Maps", "Placed By", "Photo Link",
  ];
  const photos = records.flatMap((r) =>
    (r.Campaign_Images || []).map((img) => {
      const [lat, lng] = parseLatLng(img.Geo_Location || r.Location);
      return [
        r.ID, r.User_ID, img.ID,
        ...(includeStatus ? [img.Status] : []),
        lat, lng, mapsUrl(lat, lng), img.Placed_BY || "", imageUrl(img.Wall_Image),
      ];
    }),
  ).map((row, i) => [i + 1, ...row]);

  return { subHeader, submissions, photoHeader, photos };
}

/** Builds the workbook and triggers the download. `xlsx` is loaded on first click only. */
export async function exportSubmissionsToExcel({ campaign, records, includeStatus, exportedBy, filterSummary }) {
  const [XLSX, { saveAs }] = await Promise.all([import("xlsx"), import("file-saver")]);
  const { subHeader, submissions, photoHeader, photos } = buildSubmissionSheets(records, { includeStatus });

  const now = new Date();
  const stamp = now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const infoBlock = (title, count, noun) => [
    [title],
    ["Campaign", `${campaign.name} (${campaign.id})`],
    ["Exported On", stamp],
    ["Exported By", exportedBy],
    ["Filters", filterSummary || "None (all submissions)"],
    [noun, count],
    [],
  ];

  const makeSheet = (title, header, rows, noun, linkCols) => {
    const info = infoBlock(title, rows.length, noun);
    const ws = XLSX.utils.aoa_to_sheet([...info, header, ...rows]);
    // Turn URL cells into short clickable links.
    const firstDataRow = info.length + 1;
    rows.forEach((row, r) => {
      for (const [c, label] of linkCols) {
        const url = row[c];
        if (!url) continue;
        const ref = XLSX.utils.encode_cell({ r: firstDataRow + r, c });
        ws[ref] = { t: "s", v: label, l: { Target: url, Tooltip: url } };
      }
    });
    // Column width from header + first 200 values, capped; link columns only show a short label.
    const isLink = new Set(linkCols.map(([c]) => c));
    ws["!cols"] = header.map((h, c) => ({
      wch: isLink.has(c)
        ? 14
        : Math.min(45, Math.max(10, h.length + 2, ...rows.slice(0, 200).map((row) => String(row[c] ?? "").length + 2))),
    }));
    return ws;
  };

  const subLinks = [[subHeader.indexOf("Google Maps"), "Open map"]];
  const photoLinks = [
    [photoHeader.indexOf("Google Maps"), "Open map"],
    [photoHeader.indexOf("Photo Link"), "Open photo"],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet("Vendor Submissions", subHeader, submissions, "Submissions", subLinks), "Submissions");
  XLSX.utils.book_append_sheet(wb, makeSheet("Submission Photos", photoHeader, photos, "Photos", photoLinks), "Photos");

  const safeName = campaign.name.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || campaign.id;
  // Same download path as the Campaigns/Users exports (file-saver), proven across browsers.
  saveAs(
    new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${safeName}_Submissions_${now.toISOString().slice(0, 10)}.xlsx`,
  );
  return { submissions: submissions.length, photos: photos.length };
}
