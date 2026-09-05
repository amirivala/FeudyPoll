-- Guessers can also call the position on the board ("Amir would be second").
alter table guesses add column guessed_rank int check (guessed_rank >= 1);
