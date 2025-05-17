-- Cria a tabela de vídeos
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    video_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT,
    description TEXT,
    thumbnail TEXT,
    duration TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER,
    like_count INTEGER,
    downloaded BOOLEAN DEFAULT FALSE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    filepath TEXT,
    filesize BIGINT,
    format TEXT,
    quality TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de coleções
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de relacionamento entre vídeos e coleções
CREATE TABLE video_collections (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, collection_id)
);

-- Cria a tabela de downloads
CREATE TABLE downloads (
    id SERIAL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    error TEXT,
    format TEXT,
    total_size BIGINT,
    downloaded_size BIGINT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de configurações da API
CREATE TABLE api_config (
    id SERIAL PRIMARY KEY,
    youtube_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de presets de qualidade
CREATE TABLE quality_presets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    video_quality TEXT,
    audio_quality TEXT,
    audio_only BOOLEAN DEFAULT FALSE,
    video_only BOOLEAN DEFAULT FALSE,
    extract_subtitles BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de downloads em lote
CREATE TABLE batch_downloads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    quality_preset_id INTEGER REFERENCES quality_presets(id),
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela de itens de download em lote
CREATE TABLE batch_download_items (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batch_downloads(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL,
    download_id INTEGER REFERENCES downloads(id),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria índices para melhor performance
CREATE INDEX idx_videos_video_id ON videos(video_id);
CREATE INDEX idx_videos_downloaded ON videos(downloaded);
CREATE INDEX idx_videos_deleted ON videos(deleted);
CREATE INDEX idx_video_collections_video_id ON video_collections(video_id);
CREATE INDEX idx_video_collections_collection_id ON video_collections(collection_id);
CREATE INDEX idx_downloads_video_id ON downloads(video_id);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_batch_download_items_batch_id ON batch_download_items(batch_id);
CREATE INDEX idx_batch_download_items_video_id ON batch_download_items(video_id);
CREATE INDEX idx_batch_download_items_status ON batch_download_items(status);

-- Adiciona trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplica o trigger em todas as tabelas
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_collections_updated_at
    BEFORE UPDATE ON video_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_downloads_updated_at
    BEFORE UPDATE ON downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_config_updated_at
    BEFORE UPDATE ON api_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_presets_updated_at
    BEFORE UPDATE ON quality_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_downloads_updated_at
    BEFORE UPDATE ON batch_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_download_items_updated_at
    BEFORE UPDATE ON batch_download_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 