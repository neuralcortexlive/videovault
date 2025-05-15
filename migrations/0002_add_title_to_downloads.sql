-- Adiciona o campo title na tabela downloads
ALTER TABLE downloads ADD COLUMN title text NOT NULL DEFAULT '';

-- Atualiza os registros existentes com o título do vídeo correspondente
UPDATE downloads d
SET title = v.title
FROM videos v
WHERE d.video_id = v.video_id;

-- Remove o valor padrão após a migração
ALTER TABLE downloads ALTER COLUMN title DROP DEFAULT; 