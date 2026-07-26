/* QMES module: oqc — extracted from index.html without logic changes. */

function OqcTab() {
  return (
    <InspectionTab
      docName="출하검사 성적서"
      itemKeys={OQC_KEYS}
      initial={OQC_INIT}
      lotOptions={["CBG0802", "CBG0701"]}
      idPrefix="OQC-" idStart={1} storeKey="OQC" traceStage="출하"
      notice=""
    />
  );
}

/* ──────────────────────────── 품질 인터락 (차단) 탭 ──────────────────────────── */

