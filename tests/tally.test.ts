import { describe, it, expect } from "vitest";
import { tallyVotes } from "../src/lib/tally";

const players = [
  { id: "p1", name: "Amir" },
  { id: "p2", name: "Sara" },
  { id: "p3", name: "Lee" },
];
const questions = [
  { id: "q1", position: 1, text: "Who is the coolest?" },
  { id: "q2", position: 2, text: "Who does the worst karaoke?" },
];

describe("tallyVotes", () => {
  it("counts votes per question sorted by count desc then name", () => {
    const votes = [
      { question_id: "q1", voter_id: "p1", target_id: "p2" },
      { question_id: "q1", voter_id: "p3", target_id: "p2" },
      { question_id: "q1", voter_id: "p2", target_id: "p1" },
      { question_id: "q2", voter_id: "p1", target_id: "p3" },
    ];
    const result = tallyVotes(questions, players, votes);
    expect(result).toHaveLength(2);
    expect(result[0].question.id).toBe("q1");
    expect(result[0].totalVotes).toBe(3);
    expect(result[0].rows).toEqual([
      { playerId: "p2", name: "Sara", count: 2 },
      { playerId: "p1", name: "Amir", count: 1 },
    ]);
    expect(result[1].rows).toEqual([{ playerId: "p3", name: "Lee", count: 1 }]);
  });

  it("returns empty rows for a question with no votes", () => {
    const result = tallyVotes(questions, players, []);
    expect(result[0].rows).toEqual([]);
    expect(result[0].totalVotes).toBe(0);
  });

  it("orders questions by position", () => {
    const result = tallyVotes([questions[1], questions[0]], players, []);
    expect(result.map((r) => r.question.id)).toEqual(["q1", "q2"]);
  });
});
