import { describe, it, expect } from "vitest";
import { scoreGuesses, pickGuessers, pointsFor, ordinal } from "../src/lib/scoring";
import type { QuestionTally } from "../src/lib/tally";

const q1: QuestionTally = {
  question: { id: "q1", position: 1, text: "A" },
  totalVotes: 6,
  rows: [
    { playerId: "p2", name: "Sara", count: 3 },
    { playerId: "p1", name: "Amir", count: 2 },
    { playerId: "p3", name: "Lee", count: 1 },
  ],
};
const tie: QuestionTally = {
  question: { id: "q2", position: 2, text: "B" },
  totalVotes: 4,
  rows: [
    { playerId: "p1", name: "Amir", count: 2 },
    { playerId: "p2", name: "Sara", count: 2 },
  ],
};

describe("pointsFor", () => {
  it("pays the votes for the right name at the right rank, and flags it exact", () => expect(pointsFor(q1, "p1", 2)).toEqual({ points: 2, exact: true }));
  it("pays the same for the right name at the wrong rank", () => expect(pointsFor(q1, "p1", 1)).toEqual({ points: 2, exact: false }));
  it("pays face value when no rank was given", () => expect(pointsFor(q1, "p2", null)).toEqual({ points: 3, exact: false }));
  it("pays nothing off the board or for a pass", () => {
    expect(pointsFor(q1, "p9", 1)).toEqual({ points: 0, exact: false });
    expect(pointsFor(q1, null, 1)).toEqual({ points: 0, exact: false });
  });
  it("treats tied vote counts as the same rank", () => {
    expect(pointsFor(tie, "p2", 1)).toEqual({ points: 2, exact: true });
    expect(pointsFor(tie, "p2", 2)).toEqual({ points: 2, exact: true });
  });
});

describe("scoreGuesses", () => {
  it("sums per question and overall", () => {
    const s = scoreGuesses([q1, tie], [
      { question_id: "q1", guesser_id: "p1", guessed_id: "p2", guessed_rank: 1 }, // 3
      { question_id: "q1", guesser_id: "p3", guessed_id: "p3", guessed_rank: 1 }, // wrong rank, still 1
      { question_id: "q2", guesser_id: "p1", guessed_id: null, guessed_rank: null }, // 0
    ]);
    expect(s.byQuestion.q1).toEqual({ p1: 3, p3: 1 });
    expect(s.totals).toEqual({ p1: 3, p3: 1 });
  });
});

describe("pickGuessers", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  it("takes half the room rounded up, rotating so turns even out", () => {
    expect(pickGuessers(ids, 0)).toEqual(["a", "b", "c", "d"]);
    expect(pickGuessers(ids, 1)).toEqual(["e", "f", "g", "a"]);
  });
  it("respects an explicit count and never exceeds the room", () => {
    expect(pickGuessers(ids, 0, 2)).toEqual(["a", "b"]);
    expect(pickGuessers(ids, 0, 99)).toEqual(ids);
    expect(pickGuessers([], 0)).toEqual([]);
  });
});

describe("ordinal", () => {
  it("formats English ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
  });
});
