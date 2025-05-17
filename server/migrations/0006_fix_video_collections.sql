-- Drop a tabela existente se ela existir
DROP TABLE IF EXISTS video_collections;

-- Recria a tabela com a estrutura correta
CREATE TABLE video_collections (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, collection_id)
);

-- Cria índices para melhor performance
CREATE INDEX idx_video_collections_video_id ON video_collections(video_id);
CREATE INDEX idx_video_collections_collection_id ON video_collections(collection_id);

-- Adiciona trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_collections_updated_at
    BEFORE UPDATE ON video_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 