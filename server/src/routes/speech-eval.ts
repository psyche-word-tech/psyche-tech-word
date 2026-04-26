import { Router } from "express";
import multer from "multer";
import { LLMClient, Config, ASRClient } from "coze-coding-dev-sdk";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 发音评分
router.post("/", upload.single("audio"), async (req, res) => {
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

    // Step 1: ASR 语音识别
    let transcription = "";
    try {
      const asrClient = new ASRClient(config);
      const audioBase64 = file.buffer.toString("base64");
      const asrResult = await asrClient.recognize({
        uid: "speech-eval",
        base64Data: audioBase64,
      });
      transcription = asrResult.text || "";
    } catch (asrError: any) {
      console.error("ASR error:", asrError.message);
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

    // Step 2: LLM 评分
    const llmClient = new LLMClient(config);
    const messages = [
      {
        role: "system",
        content: `你是一位专业的英语口语评分老师。请对比学生的朗读文本和标准原文，从以下几个维度给出评分和反馈：

评分维度（每项满分100分）：
1. 准确度（Accuracy）：学生朗读内容与原文的匹配程度
2. 流利度（Fluency）：朗读的连贯性和自然程度（从识别文本的流畅性推断）
3. 发音（Pronunciation）：发音的准确程度（从识别结果推断，如果识别准确说明发音较好）

反馈要求：
- 给出总体评价（中文）
- 指出主要问题和改进建议
- 如果准确度低于80分，指出哪些单词读错了或漏读了

请按以下JSON格式返回结果（不要包含任何其他内容）：
{
  "accuracy": 85,
  "fluency": 80,
  "pronunciation": 82,
  "overall": 82,
  "feedback": "中文评语...",
  "wordCorrect": true/false
}

overall = (accuracy + fluency + pronunciation) / 3，取整数。
wordCorrect 表示学生朗读的文本是否与原文完全一致。`,
      },
      {
        role: "user",
        content: `标准原文："${originalText}"\n学生朗读识别结果："${transcription}"`,
      },
    ];

    const response = await llmClient.invoke(messages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.3,
    });

    let result;
    try {
      result = JSON.parse(response.content);
    } catch (parseError) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI返回格式错误");
      }
    }

    res.json({
      success: true,
      transcription,
      accuracy: Math.min(100, Math.max(0, Math.round(result.accuracy || 0))),
      fluency: Math.min(100, Math.max(0, Math.round(result.fluency || 0))),
      pronunciation: Math.min(
        100,
        Math.max(0, Math.round(result.pronunciation || 0))
      ),
      overall: Math.min(100, Math.max(0, Math.round(result.overall || 0))),
      feedback: result.feedback || "朗读完成",
      wordCorrect: result.wordCorrect || false,
    });
  } catch (error: any) {
    console.error("Speech evaluation error:", error.message);
    res.status(500).json({
      error: "评分失败，请稍后重试",
      details: error.message,
    });
  }
});

export default router;
