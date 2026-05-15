import { Router } from "express";
import multer from "multer";
import { LLMClient, Config, ASRClient } from "coze-coding-dev-sdk";
import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 使用 ffmpeg 内存管道转换音频为 WAV (16kHz, 单声道, 16bit PCM)
// 避免磁盘 I/O，直接 stdin -> stdout
function convertToWavBuffer(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = ffmpegStatic || "ffmpeg";
    const chunks: Buffer[] = [];

    const proc = spawn(ffmpegPath, [
      "-i", "pipe:0",      // 从 stdin 读取
      "-ar", "16000",      // 采样率 16kHz
      "-ac", "1",          // 单声道
      "-sample_fmt", "s16", // 16bit PCM
      "-f", "wav",         // 输出格式 WAV
      "pipe:1"            // 输出到 stdout
    ], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    proc.stdin.write(inputBuffer);
    proc.stdin.end();

    proc.stdout.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });

    proc.stderr.on("data", () => {
      // ffmpeg 的进度信息输出到 stderr，忽略
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(chunks as any));
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// 发音评分
router.post("/", upload.single("audio"), async (req, res) => {
  const startTime = Date.now();
  try {
    const file = req.file;
    const originalText = req.body.originalText;

    if (!file) {
      return res.status(400).json({ error: "缺少音频文件" });
    }

    if (!originalText || typeof originalText !== "string") {
      return res.status(400).json({ error: "缺少原文文本" });
    }

    const config = new Config();

    // Step 1: 转换音频为 WAV 格式 (ASR 只支持 WAV)
    // 使用内存管道，避免磁盘 I/O
    let wavBuffer: Buffer;
    try {
      wavBuffer = await convertToWavBuffer(file.buffer);
      console.log(`[SpeechEval] Audio converted in ${Date.now() - startTime}ms: ${file.buffer.length} bytes -> ${wavBuffer.length} bytes WAV`);
    } catch (convErr: any) {
      console.error("[SpeechEval] Audio conversion failed:", convErr.message);
      // 转换失败时尝试直接使用原文件（可能已经是 WAV）
      wavBuffer = file.buffer;
    }

    // Step 2: ASR 语音识别
    let transcription = "";
    const asrStart = Date.now();
    try {
      const asrClient = new ASRClient(config);
      const audioBase64 = wavBuffer.toString("base64");
      const asrResult = await asrClient.recognize({
        uid: "speech-eval",
        base64Data: audioBase64,
      });
      transcription = asrResult.text || "";
      console.log(`[SpeechEval] ASR done in ${Date.now() - asrStart}ms, text="${transcription}"`);
    } catch (asrError: any) {
      console.error("[SpeechEval] ASR error:", asrError.message);
      return res.status(500).json({
        error: "语音识别失败",
        details: asrError.message,
      });
    }

    if (!transcription) {
      return res.status(400).json({
        error: "未能识别到语音内容，请重新录音",
      });
    }

    // Step 3: LLM 评分
    const llmStart = Date.now();
    const llmClient = new LLMClient(config);
    const messages = [
      {
        role: "system" as const,
        content: `你是一位专业的英语口语评分老师。请对比学生的朗读文本和标准原文，从以下几个维度给出评分和反馈：

评分维度（每项满分100分）：
1. 准确度（Accuracy）：学生朗读内容与原文的匹配程度
2. 流利度（Fluency）：朗读的流畅程度（通过ASR识别结果的完整性判断）
3. 发音（Pronunciation）：根据识别准确率推断发音质量

请按以下JSON格式返回结果（不要包含任何其他内容）：
{
  "accuracy": 0-100,
  "fluency": 0-100,
  "pronunciation": 0-100,
  "overall": 0-100,
  "wordCorrect": true/false,
  "feedback": "中文评价反馈，指出优点和需要改进的地方"
}

只返回JSON，不要有其他解释文字。`
      },
      {
        role: "user" as const,
        content: `标准原文：${originalText}\n学生朗读（ASR识别结果）：${transcription}\n\n请给出评分。`
      }
    ];

    const llmResponse = await llmClient.invoke(messages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.3
    });

    let result;
    try {
      result = JSON.parse(llmResponse.content);
    } catch (parseError) {
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI返回格式错误");
      }
    }

    console.log(`[SpeechEval] LLM scoring done in ${Date.now() - llmStart}ms, total=${Date.now() - startTime}ms`);

    res.json({
      success: true,
      transcription,
      ...result
    });
  } catch (error: any) {
    console.error(`[SpeechEval] Error after ${Date.now() - startTime}ms:`, error.message);
    res.status(500).json({
      error: "评分失败",
      details: error.message
    });
  }
});

export default router;
