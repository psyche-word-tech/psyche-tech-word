import { Router } from "express";
import { LLMClient, Config } from "coze-coding-dev-sdk";

const router = Router();

// AI 语法检测
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "缺少文本内容" });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      {
        role: "system",
        content: `你是一位专业的英语语法老师。请检测用户输入的英文句子的语法错误。

检测要求：
1. 分析句子的语法结构
2. 找出所有语法错误
3. 给出中文解释（问题类型 + 详细说明）
4. 提供修正建议

请按以下JSON格式返回结果（不要包含任何其他内容）：
{
  "isCorrect": true/false,  // 是否有语法错误
  "issues": [  // 错误列表，如果isCorrect为true则为空数组
    {
      "title": "错误类型（如：主谓不一致、时态错误、冠词错误等）",
      "message": "详细的中文解释",
      "replacements": ["建议的修正单词或短语"]
    }
  ]
}

只返回JSON，不要有其他解释文字。`
      },
      {
        role: "user",
        content: `请检测以下英文句子的语法：\n${text}`
      }
    ];

    // 调用 AI 进行语法检测
    const response = await client.invoke(messages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.3
    });

    // 解析 AI 返回的 JSON
    let result;
    try {
      result = JSON.parse(response.content);
    } catch (parseError) {
      // 如果解析失败，尝试提取 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI返回格式错误");
      }
    }

    res.json({
      success: true,
      text,
      ...result
    });
  } catch (error: any) {
    console.error("Grammar check error:", error.message);
    res.status(500).json({
      error: "语法检测失败，请稍后重试",
      details: error.message
    });
  }
});

export default router;
