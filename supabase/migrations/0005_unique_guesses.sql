-- Within a question, each name and each board spot can be claimed by only one guesser.
-- Clean up any duplicates from before the rule existed (keep the earliest guess).
delete from guesses g using guesses older
  where g.question_id = older.question_id and g.guessed_id = older.guessed_id
    and g.guessed_id is not null and older.created_at < g.created_at;
delete from guesses g using guesses older
  where g.question_id = older.question_id and g.guessed_rank = older.guessed_rank
    and g.guessed_rank is not null and older.created_at < g.created_at;

create unique index guesses_unique_name_per_question on guesses (question_id, guessed_id) where guessed_id is not null;
create unique index guesses_unique_rank_per_question on guesses (question_id, guessed_rank) where guessed_rank is not null;
