import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    const { text } = req.query;
    console.log(`[TTS] Request received, text=${text}`);

    if (!text || typeof text !== "string") {
      console.log("[TTS] Missing text parameter");
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
    console.log(`[TTS] Fetching from: ${audioUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(audioUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "audio/mpeg,*/*",
        "Referer": "https://dict.youdao.com/",
      },
    });
    clearTimeout(timeout);

    console.log(`[TTS] Upstream response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.log(`[TTS] Upstream failed with status ${response.status}`);
      return res.status(502).json({ error: `Upstream failed: ${response.status}` });
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");

    const arrayBuffer = await response.arrayBuffer();
    console.log(`[TTS] Audio size: ${arrayBuffer.byteLength} bytes, time: ${Date.now() - startTime}ms`);
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error(`[TTS] Error after ${Date.now() - startTime}ms:`, error.message || error);
    res.status(500).json({ error: "Failed to fetch TTS audio", detail: error.message });
  }
});

export default router;
