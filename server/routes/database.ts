import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Obter estatísticas do banco de dados
router.get("/stats", async (req, res) => {
  try {
    const [
      videos,
      downloads,
      collections,
      batchDownloads,
      videoCollections,
      qualityPresets,
      batchDownloadItems,
      apiConfigs
    ] = await Promise.all([
      storage.listVideos(10000, 0),
      storage.listDownloads(10000, 0),
      storage.listCollections(),
      storage.listBatchDownloads(10000, 0),
      storage.getVideoCollections(),
      storage.getQualityPresets(),
      storage.getBatchDownloadItems(),
      storage.getApiConfigs()
    ]);

    res.json({
      totalVideos: videos.length,
      totalDownloads: downloads.length,
      totalCollections: collections.length,
      totalBatchDownloads: batchDownloads.length,
      totalVideoCollections: videoCollections.length,
      totalQualityPresets: qualityPresets.length,
      totalBatchDownloadItems: batchDownloadItems.length,
      totalApiConfigs: apiConfigs.length
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do banco de dados" });
  }
});

// Obter dados de uma tabela específica
router.get("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    let data;

    switch (tableName) {
      case "videos":
        data = await storage.listVideos(10000, 0);
        break;
      case "downloads":
        data = await storage.listDownloads(10000, 0);
        break;
      case "collections":
        data = await storage.listCollections();
        break;
      case "batchDownloads":
        data = await storage.listBatchDownloads(10000, 0);
        break;
      case "videoCollections":
        data = await storage.getVideoCollections();
        break;
      case "qualityPresets":
        data = await storage.getQualityPresets();
        break;
      case "batchDownloadItems":
        // Buscar todos os itens de todos os batches
        const batches = await storage.listBatchDownloads(10000, 0);
        const allItems = await Promise.all(
          batches.map(batch => storage.getBatchDownloadItems(batch.id))
        );
        data = allItems.flat();
        break;
      case "apiConfigs":
        data = await storage.getApiConfigs();
        break;
      default:
        return res.status(400).json({ error: "Tabela inválida" });
    }

    res.json(data);
  } catch (error) {
    console.error(`Erro ao buscar dados da tabela ${req.params.tableName}:`, error);
    res.status(500).json({ error: "Erro ao buscar dados da tabela" });
  }
});

// Limpar vídeos
router.delete("/clear/videos", async (req, res) => {
  try {
    await storage.deleteDownloadedVideos();
    res.json({ message: "Vídeos apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar vídeos:", error);
    res.status(500).json({ error: "Erro ao apagar vídeos" });
  }
});

// Limpar downloads
router.delete("/clear/downloads", async (req, res) => {
  try {
    await storage.deleteAllDownloads();
    res.json({ message: "Downloads apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar downloads:", error);
    res.status(500).json({ error: "Erro ao apagar downloads" });
  }
});

// Limpar coleções
router.delete("/clear/collections", async (req, res) => {
  try {
    const collections = await storage.listCollections();
    await Promise.all(collections.map(collection => storage.deleteCollection(collection.id)));
    res.json({ message: "Coleções apagadas com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar coleções:", error);
    res.status(500).json({ error: "Erro ao apagar coleções" });
  }
});

// Limpar downloads em lote
router.delete("/clear/batchDownloads", async (req, res) => {
  try {
    const batches = await storage.listBatchDownloads();
    await Promise.all(batches.map(batch => storage.deleteBatchDownload(batch.id)));
    res.json({ message: "Downloads em lote apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar downloads em lote:", error);
    res.status(500).json({ error: "Erro ao apagar downloads em lote" });
  }
});

// Limpar vídeos em coleções
router.delete("/clear/videoCollections", async (req, res) => {
  try {
    await storage.deleteAllVideoCollections();
    res.json({ message: "Vídeos em coleções apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar vídeos em coleções:", error);
    res.status(500).json({ error: "Erro ao apagar vídeos em coleções" });
  }
});

// Limpar presets de qualidade
router.delete("/clear/qualityPresets", async (req, res) => {
  try {
    const presets = await storage.listQualityPresets();
    await Promise.all(presets.map(preset => storage.deleteQualityPreset(preset.id)));
    res.json({ message: "Presets de qualidade apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar presets de qualidade:", error);
    res.status(500).json({ error: "Erro ao apagar presets de qualidade" });
  }
});

// Limpar itens de download em lote
router.delete("/clear/batchDownloadItems", async (req, res) => {
  try {
    await storage.deleteAllBatchDownloadItems();
    res.json({ message: "Itens de download em lote apagados com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar itens de download em lote:", error);
    res.status(500).json({ error: "Erro ao apagar itens de download em lote" });
  }
});

// Limpar configurações da API
router.delete("/clear/apiConfigs", async (req, res) => {
  try {
    await storage.deleteAllApiConfigs();
    res.json({ message: "Configurações da API apagadas com sucesso" });
  } catch (error) {
    console.error("Erro ao apagar configurações da API:", error);
    res.status(500).json({ error: "Erro ao apagar configurações da API" });
  }
});

export default router; 