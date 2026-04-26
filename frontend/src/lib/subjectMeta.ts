import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BrainCircuit,
  Calculator,
  Cpu,
  Dna,
  FlaskConical,
  Languages,
  Landmark,
  ScrollText,
  Wrench,
} from "lucide-react";

type SubjectMeta = {
  icon: LucideIcon;
  practiceClassName: string;
};

const DEFAULT_SUBJECT_META: SubjectMeta = {
  icon: BookOpen,
  practiceClassName: "border-slate-200 bg-slate-50 text-slate-600",
};

const SUBJECT_META_MAP: Record<string, SubjectMeta> = {
  toán: {
    icon: Calculator,
    practiceClassName: "border-primary/15 bg-primary/10 text-primary",
  },
  văn: {
    icon: ScrollText,
    practiceClassName: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600",
  },
  "ngữ văn": {
    icon: ScrollText,
    practiceClassName: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600",
  },
  anh: {
    icon: Languages,
    practiceClassName: "border-sky-100 bg-sky-50 text-sky-600",
  },
  "tiếng anh": {
    icon: Languages,
    practiceClassName: "border-sky-100 bg-sky-50 text-sky-600",
  },
  lý: {
    icon: BrainCircuit,
    practiceClassName: "border-violet-100 bg-violet-50 text-violet-600",
  },
  "vật lý": {
    icon: BrainCircuit,
    practiceClassName: "border-violet-100 bg-violet-50 text-violet-600",
  },
  hóa: {
    icon: FlaskConical,
    practiceClassName: "border-orange-100 bg-orange-50 text-orange-600",
  },
  "hóa học": {
    icon: FlaskConical,
    practiceClassName: "border-orange-100 bg-orange-50 text-orange-600",
  },
  "công nghệ": {
    icon: Wrench,
    practiceClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  "công nghệ công nghiệp": {
    icon: Wrench,
    practiceClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  "công nghệ nông nghiệp": {
    icon: Wrench,
    practiceClassName: "border-lime-100 bg-lime-50 text-lime-700",
  },
  sinh: {
    icon: Dna,
    practiceClassName: "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
  "sinh học": {
    icon: Dna,
    practiceClassName: "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
  sử: {
    icon: Landmark,
    practiceClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  "lịch sử": {
    icon: Landmark,
    practiceClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  tin: {
    icon: Cpu,
    practiceClassName: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
  "tin học": {
    icon: Cpu,
    practiceClassName: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
};

export const normalizeSubjectKey = (subject: string) =>
  subject.trim().toLowerCase();

export const getSubjectMeta = (subject: string): SubjectMeta =>
  SUBJECT_META_MAP[normalizeSubjectKey(subject)] ?? DEFAULT_SUBJECT_META;

export const getSubjectIcon = (subject: string): LucideIcon =>
  getSubjectMeta(subject).icon;

export const getPracticeSubjectClassName = (subject: string) =>
  getSubjectMeta(subject).practiceClassName;
