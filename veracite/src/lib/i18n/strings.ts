/**
 * Arabic / English (K43, covers A08). Menus, page titles, trust labels and verdict badges. Verification
 * results, reasons and references stay in English, as the registries return them; the toggle says so.
 * Registry and product names (Crossref, OpenAlex, arXiv, DOI, Veracite) stay in Latin script.
 */
export type Lang = "en" | "ar";

const en = {
  "nav.research": "Research", "nav.research.hint": "Agents + checkpoints",
  "nav.xray": "Reference X-ray", "nav.xray.hint": "Paste any bibliography",
  "nav.draft": "Draft Checker", "nav.draft.hint": "Check claims in your text",
  "nav.library": "Library", "nav.library.hint": "Organise · export",
  "nav.trust": "Trust Center", "nav.trust.hint": "Governance · model card",
  "nav.certificate": "Certificate", "nav.certificate.hint": "For your professor",
  "autonomy.title": "AI autonomy", "autonomy.off": "Off", "autonomy.assist": "Assist", "autonomy.copilot": "Co-pilot",
  "autonomy.off.hint": "Pure reference manager. Checks still run, with no AI.",
  "autonomy.assist.hint": "AI plans and checks. You write.",
  "autonomy.copilot.hint": "AI also drafts a labelled brief.",
  "autonomy.recorded": "Recorded in your AI-use statement.",
  "label.verified": "Verified", "label.reported": "Reported, not checked", "label.ai": "AI reasoning", "label.notfound": "Not found",
  "status.verified": "Verified", "status.partial": "Partial", "status.mismatch": "Mismatch", "status.chimera": "Chimera", "status.retracted": "Retracted", "status.notfound": "Not found",
  "lang.switch": "العربية",
  "lang.note": "",
  "side.foot": "Sources come only from Crossref, OpenAlex and arXiv",
};
export type StringKey = keyof typeof en;

const ar: Record<StringKey, string> = {
  "nav.research": "البحث", "nav.research.hint": "وكلاء ونقاط موافقة",
  "nav.xray": "فحص المراجع", "nav.xray.hint": "الصق أي قائمة مراجع",
  "nav.draft": "مدقق المسودة", "nav.draft.hint": "تحقّق من الادعاءات في نصك",
  "nav.library": "المكتبة", "nav.library.hint": "التنظيم · التصدير",
  "nav.trust": "مركز الثقة", "nav.trust.hint": "الحوكمة · بطاقة النموذج",
  "nav.certificate": "الشهادة", "nav.certificate.hint": "لأستاذك",
  "autonomy.title": "استقلالية الذكاء الاصطناعي", "autonomy.off": "إيقاف", "autonomy.assist": "مساعدة", "autonomy.copilot": "شريك",
  "autonomy.off.hint": "مدير مراجع فقط. تستمر عمليات التحقق دون ذكاء اصطناعي.",
  "autonomy.assist.hint": "الذكاء الاصطناعي يخطط ويتحقق، وأنت تكتب.",
  "autonomy.copilot.hint": "ويكتب الذكاء الاصطناعي أيضاً ملخصاً موسوماً.",
  "autonomy.recorded": "يُسجَّل في بيان استخدامك للذكاء الاصطناعي.",
  "label.verified": "مُتحقَّق منه", "label.reported": "مذكور، لم يُتحقَّق منه", "label.ai": "استنتاج الذكاء الاصطناعي", "label.notfound": "غير موجود",
  "status.verified": "مُتحقَّق منه", "status.partial": "جزئي", "status.mismatch": "غير مطابق", "status.chimera": "ملفَّق من أجزاء", "status.retracted": "مسحوب", "status.notfound": "غير موجود",
  "lang.switch": "English",
  "lang.note": "واجهة عربية تجريبية: القوائم والعناوين والوسوم بالعربية، أما نتائج التحقق والمراجع فبالإنجليزية كما تردّ من السجلات.",
  "side.foot": "المصادر من Crossref وOpenAlex وarXiv فقط",
};

export const STRINGS: Record<Lang, Record<StringKey, string>> = { en, ar };

/** Arabic page titles and subtitles, by path. English pages keep the titles they pass to the shell. */
export const PAGE_TEXT: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "كل مرجع حقيقي", subtitle: "مدير مراجع ومساعد بحث لا يمكنه اختلاق مصدر. أنت صاحب القرار." },
  "/research": { title: "البحث", subtitle: "اطرح سؤالاً. الذكاء الاصطناعي يخطط ويقرأ ويعترض؛ المصادر من السجلات العامة فقط؛ وأنت توافق ثلاث مرات." },
  "/xray": { title: "فحص المراجع", subtitle: "الصق المراجع، وتحقّق منها في Crossref وOpenAlex وarXiv، واعتمد الصحيح منها. دون ذكاء اصطناعي." },
  "/draft": { title: "مدقق المسودة", subtitle: "الصق فقرتك. تُطابَق كل إحالة مع قائمتك، وتُفحص الاقتباسات والنقل الحرفي." },
  "/library": { title: "المكتبة", subtitle: "مصادرك المعتمدة، محفوظة على هذا الجهاز. نظّمها واقرأها ثم صدّرها." },
  "/trust": { title: "مركز الثقة", subtitle: "ما يقيسه Veracite عن نفسه، وكيف يُستخدم الذكاء الاصطناعي ويُفصَح عنه." },
  "/certificate": { title: "شهادة التحقق", subtitle: "رابط ورمز QR يحملان قائمة مراجعك؛ يفتحه أستاذك ويعيد التحقق من كل مرجع مباشرة." },
  "/save": { title: "حفظ مصدر", subtitle: "يتحقق Veracite من رقم DOI أو الرابط في Crossref وOpenAlex وarXiv قبل الحفظ. دون ذكاء اصطناعي." },
};
