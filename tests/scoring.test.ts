import { describe, it, expect } from "vitest";
import { scoreGuesses, pickGuessers } from "../src/lib/scoring";
import type { QuestionTally } from "../src/lib/tally";

const tallies: QuestionTally[] = [
  { question: { id: "q1", position: 1, text: "A" }, totalVotes: 3, rows: [{ playerId: "p2", name: "Sara", count: 2 }, { playerId: "p1", name: "Amir", count: 1 }] },
  { question: { id: "q2", position: 2, text: "B" }, totalVotes: 3, rows: [{ playerId: "p3", name: "Lee", count: 3 }] },
];

describe("scoreGuesses", () => {
  it("awards the vote count of the guessed player, 0 if not on the board or passed", () => {
    const guesses = [
      { question_id: "q1", guesser_id: "p1", guessed_id: "p2" }, // 2 pts
      { question_id: "q1", guesser_id: "p3", guessed_id: "p3" }, // not on board -> 0
      { question_id: "q2", guesser_id: "p2", guessed_id: "p3" }, // 3 pts
      { question_id: "q2", guesser_id: "p1", guessed_id: null }, // passed -> 0
    ];
    const s = scoreGuesses(tallies, guesses);
    expect(s.byQuestion.q1).toEqual({ p1: 2, p3: 0 });
    expect(s.byQuestion.q2).toEqual({ p2: 3, p1: 0 });
    expect(s.totals).toEqual({ p1: 2, p3: 0, p2: 3 });
  });
});

describe("pickGuessers", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  it("takes half the room rounded up, rotating so turns even out", () => {
    expect(pickGuessers(ids, 0)).toEqual(["a", "b", "c", "d"]);
    expect(pickGuessers(ids, 1)).toEqual(["e", "f", "g", "a"]);
    expect(pickGuessers(ids, 2)).toEqual(["b", "c", "d", "e"]);
  });
  it("respects an explicit count and never exceeds the room", () => {
    expect(pickGuessers(ids, 0, 2)).toEqual(["a", "b"]);
    expect(pickGuessers(ids, 0, 99)).toEqual(ids);
    expect(pickGuessers([], 0)).toEqual([]);
  });
});
