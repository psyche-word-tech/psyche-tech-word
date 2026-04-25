import { Router } from "express";
import axios from "axios";

const router = Router();

// POST /api/v1/grammar-check - 语法检测
router.post("/", async (req, res) => {
  try {
    const { text, language = "en-US" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "缺少文本内容" });
    }

    // 使用 LanguageTool 公共 API 进行语法检测
    const response = await axios.post(
      "https://api.languagetool.org/v2/check",
      new URLSearchParams({
        text: text,
        language: language,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    const { matches } = response.data;

    // 格式化检测结果
    const issues = matches.map((match: any) => ({
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      offset: match.offset,
      length: match.length,
      rule: {
        id: match.rule?.id,
        description: match.rule?.description,
      },
      replacements: match.replacements?.slice(0, 3) || [],
      context: {
        text: match.context?.text,
        offset: match.context?.offset,
        length: match.context?.length,
      },
    }));

    res.json({
      success: true,
      text,
      language,
      totalIssues: issues.length,
      issues,
      isCorrect: issues.length === 0,
    });
  } catch (error: any) {
    console.error("Grammar check error:", error.message);
    res.status(500).json({
      error: "语法检测失败，请稍后重试",
      details: error.message,
    });
  }
});

export default router;
