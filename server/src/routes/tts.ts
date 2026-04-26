import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { text } = req.query;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
    const response = await fetch(audioUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch TTS audio from upstream" });
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    res.set("Content-Type", contentType);

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("TTS proxy error:", error);
    res.status(500).json({ error: "Failed to fetch TTS audio" });
  }
});

export default router;
