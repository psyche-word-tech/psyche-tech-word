import { Router } from "express";
import { LLMClient, Config } from "coze-coding-dev-sdk";

const router = Router();

interface GrammarIssue {
  title: string;
  message: string;
  replacements: string[];
}

// ============ 规则引擎：基础语法检测 ============
function ruleBasedGrammarCheck(text: string): { isCorrect: boolean; issues: GrammarIssue[] } {
  const issues: GrammarIssue[] = [];
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  // 1. be + 动词原形（非进行时）
  const beVerbPattern = /\b(i|you|we|they)\s+(am|are|is)\s+(go|eat|play|watch|read|write|speak|learn|study|work|live|love|like|hate|want|need|see|hear|feel|know|think|believe|understand|remember|forget|help|make|take|give|tell|say|talk|walk|run|jump|swim|dance|sing|cook|clean|wash|open|close|start|stop|try|use|find|lose|win|lose|buy|sell|pay|cost|spend|send|get|become|seem|look|sound|taste|smell|appear|happen|matter)\b/g;
  let match;
  while ((match = beVerbPattern.exec(lowerText)) !== null) {
    const subject = match[1];
    const beVerb = match[2];
    const verb = match[3];
    const originalVerb = text.slice(match.index + match[0].indexOf(verb), match.index + match[0].indexOf(verb) + verb.length);
    issues.push({
      title: "主谓不一致 / 时态错误",
      message: `"${subject} ${beVerb} ${verb}" 中，be动词后面不能直接接动词原形（除非是现在进行时 ${beVerb} ${verb}ing 或被动语态 ${beVerb} ${verb}ed）。请检查时态或动词形式。`,
      replacements: [
        `${subject} ${verb}s`,
        `${subject} ${verb}ed`,
        `${subject} ${beVerb} ${originalVerb}ing`,
        `${subject} will ${verb}`
      ].filter((v, i, a) => a.indexOf(v) === i)
    });
  }

  // 2. 第三人称单数 + don't
  const thirdPersonDont = /\b(he|she|it)\s+don't\b/gi;
  while ((match = thirdPersonDont.exec(text)) !== null) {
    issues.push({
      title: "主谓不一致",
      message: `第三人称单数（he/she/it）应使用 "doesn't" 而不是 "don't"。`,
      replacements: [text.slice(match.index, match.index + match[0].length).replace(/don't/i, "doesn't")]
    });
  }

  // 3. 第一/二人称 + 动词三单
  const pluralVerbS = /\b(i|you|we|they)\s+(goes|plays|eats|watches|reads|writes|speaks|learns|studies|works|lives|loves|likes|hates|wants|needs|sees|hears|feels|knows|thinks|believes|understands|remembers|forgets|helps|makes|takes|gives|tells|says|talks|walks|runs|jumps|swims|dances|sings|cooks|cleans|washes|opens|closes|starts|stops|tries|uses|finds|loses|wins|buys|sells|pays|spends|sends|gets|becomes|seems|looks|sounds|tastes|smells|appears|happens|matters)\b/gi;
  while ((match = pluralVerbS.exec(text)) !== null) {
    const subject = match[1].toLowerCase();
    const verb = match[2].toLowerCase();
    const baseVerb = verb.replace(/es$/, "").replace(/s$/, "");
    issues.push({
      title: "主谓不一致",
      message: `主语 "${subject}" 是第一/二人称或复数，谓语动词不应加 -s/-es。`,
      replacements: [`${subject} ${baseVerb}`]
    });
  }

  // 4. yesterday + 现在时
  const yesterdayPresent = /\byesterday\b[^.!?]*\b(go|eat|play|watch|read|write|speak|learn|study|work|live|love|like|hate|want|need|see|hear|feel|know|think|believe|understand|remember|forget|help|make|take|give|tell|say|talk|walk|run|jump|swim|dance|sing|cook|clean|wash|open|close|start|stop|try|use|find|lose|win|buy|sell|pay|spend|send|get|become|seem|look|sound|taste|smell|appear|happen|matter|am|are|is|have|has|do|does)\b/gi;
  while ((match = yesterdayPresent.exec(text)) !== null) {
    const verb = match[1].toLowerCase();
    if (["am", "are", "is", "have", "has", "do", "does"].includes(verb)) {
      issues.push({
        title: "时态错误",
        message: `"yesterday" 表示过去时间，应使用过去时态。`,
        replacements: ["yesterday... was/were/had/did..."]
      });
    } else {
      issues.push({
        title: "时态错误",
        message: `"yesterday" 表示过去时间，谓语动词应使用过去式。`,
        replacements: ["yesterday... " + verb + "ed / " + verb + "（不规则变化）"]
      });
    }
  }

  // 5. tomorrow + 过去时
  const tomorrowPast = /\btomorrow\b[^.!?]*\b(went|ate|played|watched|read|wrote|spoke|learned|studied|worked|lived|loved|liked|hated|wanted|needed|saw|heard|felt|knew|thought|believed|understood|remembered|forgot|helped|made|took|gave|told|said|talked|walked|ran|jumped|swam|danced|sang|cooked|cleaned|washed|opened|closed|started|stopped|tried|used|found|lost|won|bought|sold|paid|spent|sent|got|became|seemed|looked|sounded|tasted|smelled|appeared|happened|mattered|was|were|had|did)\b/gi;
  while ((match = tomorrowPast.exec(text)) !== null) {
    issues.push({
      title: "时态错误",
      message: `"tomorrow" 表示将来时间，应使用将来时态或一般现在时。`,
      replacements: ["tomorrow... will + 动词原形 / be going to + 动词原形"]
    });
  }

  // 6. 冠词 a/an 错误：a + 元音
  const aVowel = /\ba\s+([aeiou][a-z]*)\b/gi;
  while ((match = aVowel.exec(text)) !== null) {
    const word = match[1];
    // 排除 u 发 /ju:/ 音的情况（如 a university, a user）
    if (!word.match(/^u[nlrs]/i)) {
      issues.push({
        title: "冠词错误",
        message: `元音音素开头的单词前应使用 "an" 而不是 "a"。`,
        replacements: [`an ${word}`]
      });
    }
  }

  // 7. 冠词 an + 辅音
  const anConsonant = /\ban\s+([^aeiou\s][a-z]*)\b/gi;
  while ((match = anConsonant.exec(text)) !== null) {
    const word = match[1];
    issues.push({
      title: "冠词错误",
      message: `辅音音素开头的单词前应使用 "a" 而不是 "an"。`,
      replacements: [`a ${word}`]
    });
  }

  // 8. go school / come school 缺少介词
  const goSchool = /\b(go|come)\s+(school|college|university|hospital|church|prison)\b/gi;
  while ((match = goSchool.exec(text)) !== null) {
    const verb = match[1];
    const place = match[2];
    issues.push({
      title: "介词缺失",
      message: `表示去某地时，${verb} 后应加介词 "to"。`,
      replacements: [`${verb} to ${place}`]
    });
  }

  // 9. She have / He have / It have
  const sheHave = /\b(she|he|it)\s+have\b/gi;
  while ((match = sheHave.exec(text)) !== null) {
    const subject = match[1].toLowerCase();
    issues.push({
      title: "主谓不一致",
      message: `第三人称单数 "${subject}" 应搭配 "has" 而不是 "have"。`,
      replacements: [`${subject} has`]
    });
  }

  // 10. They has / We has / You has
  const theyHas = /\b(they|we|you)\s+has\b/gi;
  while ((match = theyHas.exec(text)) !== null) {
    const subject = match[1].toLowerCase();
    issues.push({
      title: "主谓不一致",
      message: `复数主语 "${subject}" 应搭配 "have" 而不是 "has"。`,
      replacements: [`${subject} have`]
    });
  }

  // 11. very + 形容词/副词的比较级/最高级（如 very better）
  const veryCompare = /\bvery\s+(better|worse|more|most|less|least|bigger|smaller|taller|shorter|faster|slower|stronger|weaker|older|younger|newer|older|hotter|colder|warmer|cooler|cheaper|more expensive|happier|sadder|angrier|busier|easier|harder|earlier|later|closer|farther|further|deeper|higher|lower|wider|narrower|longer|shorter|heavier|lighter|thicker|thinner|cleaner|dirtier|brighter|darker|quieter|louder|safer|more dangerous|healthier|sicker|richer|poorer|prettier|uglier)\b/gi;
  while ((match = veryCompare.exec(text)) !== null) {
    issues.push({
      title: "修饰语错误",
      message: `"very" 不能修饰比较级或最高级，应使用 "much" 或 "far"。`,
      replacements: [match[0].replace(/very/i, "much")]
    });
  }

  // 12. 双重否定
  const doubleNegative = /\b(don't|doesn't|didn't|can't|couldn't|won't|wouldn't|shouldn't|mustn't|haven't|hasn't|hadn't|isn't|aren't|wasn't|weren't|nobody|nothing|nowhere|no one|neither|nor)\b[^.!?]*\b(nothing|nobody|nowhere|no one|neither|nor|never|no)\b/gi;
  while ((match = doubleNegative.exec(text)) !== null) {
    issues.push({
      title: "双重否定",
      message: `英语中双重否定会造成语义混乱，应只保留一个否定词。`,
      replacements: ["建议改为单重否定表达"]
    });
  }

  // 13. there/their/they're 混淆（简单检测）
  const thereConfusion = /\bthere\s+(is|are|was|were)\b/gi;
  // 这个通常是正确的，不需要检测

  // 14. its/it's 混淆
  const itsIts = /\bits\s+(is|was|has|not|going|coming|done|been|being)\b/gi;
  while ((match = itsIts.exec(text)) !== null) {
    issues.push({
      title: "拼写/用法错误",
      message: `"its" 是所有格代词，表示"它的"。如果是 "it is" 的缩写，应使用 "it's"。`,
      replacements: [match[0].replace(/its/i, "it's")]
    });
  }

  return {
    isCorrect: issues.length === 0,
    issues: issues.slice(0, 5) // 最多返回5个问题
  };
}

// ============ OpenAI API 调用 ============
async function callOpenAI(text: string): Promise<{ isCorrect: boolean; issues: GrammarIssue[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY");
  }

  const systemPrompt = `你是一位专业的英语老师。请全面检测用户输入的英文句子，包括语法和逻辑两个方面。

检测要求：
1. **语法检测**：检查主谓一致、时态、冠词、介词、词序等语法问题
2. **逻辑检测**：检查语义是否合理、表达是否通顺、是否符合英语表达习惯
3. 给出中文解释（问题类型 + 详细说明）
4. 提供修正建议

请按以下JSON格式返回结果（不要包含任何其他内容）：
{
  "isCorrect": true/false,
  "issues": [
    {
      "title": "问题类型",
      "message": "详细的中文解释",
      "replacements": ["建议的修正"]
    }
  ]
}

只返回JSON，不要有其他解释文字。`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请检测以下英文句子的语法：\n${text}` }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content || "";

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("OpenAI返回格式错误");
    }
  }

  return result;
}

// ============ 主路由 ============
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "缺少文本内容" });
    }

    let result: { isCorrect: boolean; issues: GrammarIssue[] } | null = null;
    let usedMethod = "";
    let errorLog = "";

    // 1. 尝试 LLMClient（沙箱环境）
    try {
      const config = new Config();
      const client = new LLMClient(config);

      const messages = [
        {
          role: "system" as const,
          content: `你是一位专业的英语老师。请全面检测用户输入的英文句子，包括语法和逻辑两个方面。

检测要求：
1. **语法检测**：检查主谓一致、时态、冠词、介词、词序等语法问题
2. **逻辑检测**：检查语义是否合理、表达是否通顺、是否符合英语表达习惯
3. 给出中文解释（问题类型 + 详细说明）
4. 提供修正建议

请按以下JSON格式返回结果（不要包含任何其他内容）：
{
  "isCorrect": true/false,
  "issues": [
    {
      "title": "问题类型（如：主谓不一致、时态错误、逻辑错误、表达不当等）",
      "message": "详细的中文解释",
      "replacements": ["建议的修正单词、短语或完整句子"]
    }
  ]
}

只返回JSON，不要有其他解释文字。`
        },
        {
          role: "user" as const,
          content: `请检测以下英文句子的语法：\n${text}`
        }
      ];

      const response = await client.invoke(messages, {
        model: "doubao-seed-2-0-lite-260215",
        temperature: 0.3
      });

      try {
        result = JSON.parse(response.content);
      } catch {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("AI返回格式错误");
        }
      }
      usedMethod = "llm";
    } catch (llmError: any) {
      errorLog = `LLMClient failed: ${llmError.message}; `;

      // 2. 尝试 OpenAI API
      try {
        result = await callOpenAI(text);
        usedMethod = "openai";
      } catch (openaiError: any) {
        errorLog += `OpenAI failed: ${openaiError.message}; `;

        // 3. 回退到规则引擎
        result = ruleBasedGrammarCheck(text);
        usedMethod = "rule";
      }
    }

    res.json({
      success: true,
      text,
      ...result,
      _method: usedMethod,
      ...(usedMethod === "rule" ? { _note: "当前使用基础规则检测，结果可能不够全面。如需更精确的 AI 检测，请在 Railway 后台配置 OPENAI_API_KEY 环境变量。" } : {})
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
