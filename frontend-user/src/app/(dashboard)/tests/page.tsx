"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  Loader2,
  ChevronLeft,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  questionText: string;
  questionType: "MCQ" | "SAQ" | "IMAGE_BASED" | "TRUE_FALSE";
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  options: { id: string; optionText: string; isCorrect: boolean }[];
  explanation?: string;
}

interface TestData {
  id: string;
  title?: string;
  testType: string;
  totalQuestions: number;
  duration?: number;
  questions: { order: number; question: Question }[];
}

interface AttemptState {
  attemptId: string;
  answers: Record<string, string>; // questionId -> selectedOptionId
  flagged: Set<string>;
  currentIndex: number;
  timeLeft: number;
}

interface TestResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeTaken: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
    selectedOptionId?: string;
    answerText?: string;
    question: Question;
  }[];
}

// ─── Config Form ───────────────────────────────────────────────────────────────

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology",
  "Pharmacology", "Microbiology", "Forensic Medicine",
  "Community Medicine", "Medicine", "Surgery",
  "Obstetrics & Gynecology", "Pediatrics",
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
type Difficulty = typeof DIFFICULTIES[number];

interface ConfigFormProps {
  onStart: (test: TestData, attemptId: string) => void;
}

function ConfigForm({ onStart }: ConfigFormProps) {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [format, setFormat] = useState<"MIXED" | "MCQ_ONLY" | "SAQ_ONLY">("MIXED");
  const [testType, setTestType] = useState<"PRACTICE" | "MOCK">("PRACTICE");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/subjects")
      .then(res => setSubjects(res.data?.data || []))
      .catch(err => console.error("Failed to fetch subjects:", err));
  }, []);

  const handleGenerate = async () => {
    setError("");
    setIsGenerating(true);
    try {
      const body: any = {
        testType,
        totalQuestions: count,
        difficultyLevel: difficulty,
        ...(subject && { subjectIds: [subject] }),
      };

      if (format === "MCQ_ONLY") {
        body.questionTypes = ["MCQ", "TRUE_FALSE"];
      } else if (format === "SAQ_ONLY") {
        body.questionTypes = ["SAQ"];
      }

      console.log("Generating test with payload:", body);

      const res = await apiClient.post("/tests/generate", body);
      const test: TestData = res.data.data;

      // Auto-start attempt
      const attemptRes = await apiClient.post(`/tests/${test.id}/start`);
      const attemptId: string = attemptRes.data.data.id;

      onStart(test, attemptId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate test. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tests & Quizzes</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Generate custom quizzes from your MBBS curriculum. Test your knowledge and track your progress.
          </p>
        </div>

        {/* Config Card */}
        <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-white w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">Generate Your Test</h2>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* Test Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Test Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(["PRACTICE", "MOCK"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTestType(t)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${testType === t
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300 text-gray-600"
                      }`}
                  >
                    <div className="font-semibold capitalize">{t.toLowerCase()}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {t === "PRACTICE" ? "No timer, learn at your pace" : "Timed exam simulation"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
              <div className="flex gap-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${difficulty === d
                      ? d === "EASY" ? "border-green-500 bg-green-50 text-green-700"
                        : d === "MEDIUM" ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                  >
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Format */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Question Format</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "MIXED", label: "Mixed", desc: "All types" },
                  { id: "MCQ_ONLY", label: "MCQs", desc: "Bubbles" },
                  { id: "SAQ_ONLY", label: "Text", desc: "Written" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${format === f.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300 text-gray-600"
                      }`}
                  >
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-[10px] opacity-60">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Number of Questions: <span className="text-blue-600">{count}</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5</span><span>25</span><span>50</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Test...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate & Start Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { icon: BookOpen, label: "Practice Mode", desc: "Immediate feedback" },
            { icon: Target, label: "Mock Exam", desc: "Real exam simulation" },
            { icon: Trophy, label: "Track Progress", desc: "See your improvement" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <Icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-800">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Active Quiz ───────────────────────────────────────────────────────────────

interface ActiveQuizProps {
  test: TestData;
  attempt: AttemptState;
  setAttempt: React.Dispatch<React.SetStateAction<AttemptState | null>>;
  onFinish: (results: TestResult) => void;
}

function ActiveQuiz({ test, attempt, setAttempt, onFinish }: ActiveQuizProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questions = (test.questions || [])
    .sort((a, b) => a.order - b.order)
    .map((tq) => tq.question);
  const current = questions[attempt.currentIndex];
  const total = questions.length;
  const answered = Object.keys(attempt.answers).length;

  const select = (value: string, isText = false) => {
    setAttempt((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [current.id]: value },
      };
    });
    // Auto-submit answer
    apiClient.post(`/tests/attempts/${attempt.attemptId}/answer`, {
      questionId: current.id,
      [isText ? "answerText" : "selectedOptionId"]: value,
    }).catch(() => { });
  };

  const toggleFlag = () => {
    setAttempt((prev) => {
      if (!prev) return null;
      const next = new Set(prev.flagged);
      next.has(current.id) ? next.delete(current.id) : next.add(current.id);
      return { ...prev, flagged: next };
    });
  };

  const go = (dir: -1 | 1) => {
    setAttempt((prev) => {
      if (!prev) return null;
      return { ...prev, currentIndex: prev.currentIndex + dir };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/tests/attempts/${attempt.attemptId}/submit`);
      const resultsRes = await apiClient.get(`/tests/attempts/${attempt.attemptId}/results`);
      const data = resultsRes.data.data;

      // Map results with question data for review
      const answers = (data.answers || []).map((a: any) => ({
        ...a,
        question: questions.find((q) => q.id === a.questionId),
      }));

      onFinish({
        totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
        maxScore: typeof data.maxScore === 'number' ? data.maxScore : total,
        percentage: typeof data.percentage === 'number' ? data.percentage : 0,
        timeTaken: data.timeTaken || 0,
        answers,
      });
    } catch (err) {
      console.error("Submission failed, calculating local results:", err);
      // Fallback: show local results safely
      const localAnswers = questions.map((q) => {
        const selectedId = attempt.answers[q.id];
        const questionObj = questions.find((qu) => qu.id === q.id);

        // For local grading, we can only really grade MCQ/TRUE_FALSE
        let isCorrect = false;
        if (q.questionType === "MCQ" || q.questionType === "TRUE_FALSE") {
          const correctOption = questionObj?.options.find((o) => o.isCorrect);
          isCorrect = selectedId === correctOption?.id;
        }

        return {
          questionId: q.id,
          isCorrect: isCorrect,
          selectedOptionId: q.questionType !== "SAQ" ? selectedId : undefined,
          answerText: q.questionType === "SAQ" ? selectedId : undefined,
          question: q,
        };
      });

      const correctCount = localAnswers.filter(a => a.isCorrect).length;

      onFinish({
        totalScore: correctCount,
        maxScore: total,
        percentage: Math.round((correctCount / total) * 100),
        timeTaken: 0,
        answers: localAnswers,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyColor = {
    EASY: "text-green-600 bg-green-50 border-green-200",
    MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
    HARD: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-700">
            Question {attempt.currentIndex + 1}/{total}
          </div>
          <div className="w-48 bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${((attempt.currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {answered}/{total} answered
          </Badge>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs h-8"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit Test"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Question Card */}
        <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-5">
              <Badge className={`text-xs border ${difficultyColor[current.difficultyLevel] || ""}`} variant="outline">
                {current.difficultyLevel}
              </Badge>
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${attempt.flagged.has(current.id)
                  ? "border-orange-400 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-400 hover:text-orange-500"
                  }`}
              >
                <Flag className="w-3 h-3" />
                {attempt.flagged.has(current.id) ? "Flagged" : "Flag"}
              </button>
            </div>

            <p className="text-lg font-semibold text-gray-900 leading-relaxed mb-8">
              {current.questionText}
            </p>

            {current.questionType === "SAQ" ? (
              <div className="space-y-4">
                <textarea
                  value={attempt.answers[current.id] || ""}
                  onChange={(e) => select(e.target.value, true)}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[200px] p-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 leading-relaxed"
                />
                <p className="text-xs text-gray-400 italic">
                  Note: Short answer questions are currently recorded but require manual verification or detailed review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {current.options.map((opt, i) => {
                  const selected = attempt.answers[current.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => select(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${selected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500 group-hover:border-blue-400"
                          }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className={`text-sm leading-relaxed ${selected ? "text-blue-800 font-medium" : "text-gray-700"}`}>
                          {opt.optionText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => go(-1)}
            disabled={attempt.currentIndex === 0}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          {/* Question grid */}
          <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setAttempt((p) => p ? { ...p, currentIndex: i } : null)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${i === attempt.currentIndex
                  ? "bg-blue-600 text-white"
                  : attempt.answers[q.id]
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : attempt.flagged.has(q.id)
                      ? "bg-orange-100 text-orange-600 border border-orange-300"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant={attempt.currentIndex === total - 1 ? "default" : "outline"}
            onClick={() => attempt.currentIndex === total - 1 ? handleSubmit() : go(1)}
            disabled={isSubmitting}
            className={`rounded-xl ${attempt.currentIndex === total - 1 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : ""}`}
          >
            {attempt.currentIndex === total - 1 ? "Submit" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Results ───────────────────────────────────────────────────────────────────

interface ResultsProps {
  results: TestResult;
  test: TestData;
  onRestart: () => void;
}

function Results({ results, test, onRestart }: ResultsProps) {
  const [showReview, setShowReview] = useState(false);
  const pct = Math.round(results.percentage);
  const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Needs Work";
  const gradeColor = pct >= 80 ? "text-green-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-600" : "text-red-600";
  const correct = results.answers.filter((a) => a.isCorrect).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Card */}
        <Card className="shadow-xl border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <CardContent className="p-10 text-center">
            <Trophy className="w-14 h-14 mx-auto mb-4 opacity-90" />
            <div className="text-6xl font-bold mb-2">{pct}%</div>
            <div className={`text-2xl font-semibold mb-4 ${gradeColor === "text-green-600" ? "text-green-300" : "text-white/80"}`}>{grade}</div>
            <div className="text-white/70 text-sm">{test.title || "Custom Quiz"}</div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Correct", value: correct, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
            { label: "Incorrect", value: results.answers.filter(a => a.isCorrect === false).length, icon: XCircle, color: "text-red-500 bg-red-50" },
            { label: "Skipped", value: test.totalQuestions - results.answers.length, icon: RotateCcw, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 text-center">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onRestart} variant="outline" className="flex-1 rounded-xl h-11">
            <RotateCcw className="w-4 h-4 mr-2" /> New Test
          </Button>
          <Button
            onClick={() => setShowReview(!showReview)}
            className="flex-1 rounded-xl h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {showReview ? "Hide" : "Review"} Answers
          </Button>
        </div>

        {/* Review Section */}
        {showReview && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg">Answer Review</h3>
            {test.questions.sort((a, b) => a.order - b.order).map((tq, i) => {
              const q = tq.question;
              const a = results.answers.find(ans => ans.questionId === q.id);
              const isAnswered = !!a;

              return (
                <Card key={q.id} className={`border-2 rounded-2xl shadow-sm ${!isAnswered ? "border-amber-200" : a.isCorrect ? "border-green-200" : "border-red-200"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      {!isAnswered ? (
                        <RotateCcw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      ) : a.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm leading-relaxed">
                          <span className="text-gray-400 mr-1">Q{i + 1}.</span> {q.questionText}
                        </p>
                        {!isAnswered && <Badge variant="secondary" className="mt-2 text-[10px] bg-amber-50 text-amber-700 border-amber-200">Not Answered</Badge>}
                      </div>
                    </div>

                    {q.questionType === "SAQ" ? (
                      <div className="ml-8 space-y-3">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 italic text-sm text-gray-600">
                          <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Your Answer:</div>
                          {isAnswered ? a.answerText || "(Empty)" : "No answer provided"}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 ml-8">
                        {q.options?.map((opt) => {
                          const isCorrect = opt.isCorrect;
                          const isSelected = isAnswered && a.selectedOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl text-sm ${isCorrect
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : isSelected && !isCorrect
                                  ? "bg-red-50 border border-red-200 text-red-700"
                                  : "bg-gray-50 border border-gray-100 text-gray-600"
                                }`}
                            >
                              {opt.optionText}
                              {isCorrect && <span className="ml-2 text-xs font-semibold text-green-600">✓ Correct</span>}
                              {isSelected && !isCorrect && <span className="ml-2 text-xs font-semibold text-red-500">Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="mt-3 ml-8 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
                        <span className="font-semibold">Explanation: </span>{q.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type View = "config" | "quiz" | "results";

export default function TestsPage() {
  const [view, setView] = useState<View>("config");
  const [test, setTest] = useState<TestData | null>(null);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [results, setResults] = useState<TestResult | null>(null);

  const handleStart = (testData: TestData, attemptId: string) => {
    setTest(testData);
    setAttempt({
      attemptId,
      answers: {},
      flagged: new Set(),
      currentIndex: 0,
      timeLeft: (testData.duration || 0) * 60,
    });
    setView("quiz");
  };

  const handleFinish = (r: TestResult) => {
    setResults(r);
    setView("results");
  };

  const handleRestart = () => {
    setTest(null);
    setAttempt(null);
    setResults(null);
    setView("config");
  };

  if (view === "quiz" && test && attempt) {
    return <ActiveQuiz test={test} attempt={attempt} setAttempt={setAttempt} onFinish={handleFinish} />;
  }

  if (view === "results" && results && test) {
    return <Results results={results} test={test} onRestart={handleRestart} />;
  }

  return <ConfigForm onStart={handleStart} />;
}
