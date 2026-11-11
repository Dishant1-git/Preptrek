// Exams shown on the register page, grouped by category
export const EXAMS = {
  Medical: ["NEET UG", "NEET PG", "INI-CET", "FMGE", "NEET MDS", "NEET SS", "AIIMS Nursing", "NExT"],
  Engineering: ["JEE Main", "JEE Advanced", "BITSAT", "GATE", "UPSC ESE (IES)", "VITEEE", "MHT CET"],
  "Civil Services & Defence": ["UPSC CSE", "State PSC", "UPSC CAPF", "CDS", "NDA", "AFCAT"],
  Management: ["CAT", "XAT", "MAT", "CMAT", "SNAP", "GMAT"],
  Law: ["CLAT", "AILET", "Judiciary"],
  "Banking & Insurance": ["IBPS PO", "IBPS Clerk", "SBI PO", "SBI Clerk", "RBI Grade B", "LIC AAO"],
  SSC: ["SSC CGL", "SSC CHSL", "SSC GD", "SSC MTS", "SSC CPO"],
  Railways: ["RRB NTPC", "RRB Group D", "RRB JE"],
  "Teaching & Research": ["CTET", "UGC NET", "CSIR NET", "State TET"],
  "Commerce & Finance": ["CA", "CS", "CMA"],
  "Study Abroad & Others": ["CUET", "GRE", "IELTS", "TOEFL", "Board Exams"],
  Skills: ["Web Development", "Data Science", "Other"],
};

// Marking schemes for MCQ tests. `wrong` is the marks lost for a wrong answer.
export const MARKING = [
  { name: "+4 / -1 (NEET UG, NEET PG, JEE Main)", correct: 4, wrong: -1 },
  { name: "+1 / -1/3 (INI-CET)", correct: 1, wrong: -1 / 3 },
  { name: "+2 / -0.66 (UPSC Prelims)", correct: 2, wrong: -0.66 },
  { name: "+3 / -1 (CAT)", correct: 3, wrong: -1 },
  { name: "+2 / -0.5 (SSC CGL)", correct: 2, wrong: -0.5 },
  { name: "+1 / -0.25 (Banking, GATE 1-mark)", correct: 1, wrong: -0.25 },
  { name: "+1 / 0 (No negative marking)", correct: 1, wrong: 0 },
];

// Pick a sensible default marking scheme for the user's exam
export function defaultMarking(domain = "") {
  if (domain === "INI-CET") return 1;
  if (domain === "UPSC CSE") return 2;
  if (domain === "CAT") return 3;
  if (domain.startsWith("SSC")) return 4;
  if (/IBPS|SBI|RBI|LIC|GATE/.test(domain)) return 5;
  if (/NEET|JEE/.test(domain)) return 0;
  return 6;
}
