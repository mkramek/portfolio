export type CaseRow = { label: string; text: string };
export type Metric = { value: string; label: string };

export type DerivedRole = {
  id: string;
  company: string;
  title: string;
  kind: string;
  oneLiner: string;
  dates: string;
  depth: "simple" | "extended" | "advanced";
  depthLabel: string;
  extended: boolean;
  advanced: boolean;
  metrics: Metric[];
  stack: string[];
  bullets: string[];
  caseRows: CaseRow[];
};
