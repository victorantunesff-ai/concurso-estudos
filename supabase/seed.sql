-- Catálogo inicial de conquistas. Executar após schema.sql.

insert into public.achievements (type, threshold, name, description, icon, tier) values
  ('hours', 10, 'Primeiros Passos', 'Estude 10 horas líquidas no total.', '🥉', 1),
  ('hours', 50, 'Ritmo de Estudo', 'Estude 50 horas líquidas no total.', '🥈', 2),
  ('hours', 100, 'Maratonista', 'Estude 100 horas líquidas no total.', '🥇', 3),
  ('hours', 300, 'Guerreiro do Edital', 'Estude 300 horas líquidas no total.', '🏆', 4),
  ('hours', 1000, 'Lenda dos Concursos', 'Estude 1000 horas líquidas no total.', '👑', 5),
  ('subjects', 1, 'Primeira Matéria', 'Complete todos os assuntos de 1 matéria.', '📘', 1),
  ('subjects', 5, 'Multidisciplinar', 'Complete todos os assuntos de 5 matérias.', '📚', 2),
  ('subjects', 10, 'Edital Dominado', 'Complete todos os assuntos de 10 matérias.', '🎓', 3),
  ('questions', 100, 'Aquecendo', 'Responda 100 questões.', '✏️', 1),
  ('questions', 1000, 'Treino Pesado', 'Responda 1.000 questões.', '📝', 2),
  ('questions', 5000, 'Máquina de Questões', 'Responda 5.000 questões.', '🤖', 3);
