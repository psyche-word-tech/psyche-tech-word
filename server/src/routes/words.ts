import express from 'express';

const router = express.Router();

// 预置单词数据
const WORDS = [
  { id: 1, word: 'eloquent', pronunciation: '/ˈeləkwənt/', meaning: '口才好的；雄辩的', example: 'She gave an eloquent speech that moved everyone.' },
  { id: 2, word: 'resilience', pronunciation: '/rɪˈzɪliəns/', meaning: '韧性；适应力', example: 'The community showed great resilience after the disaster.' },
  { id: 3, word: 'profound', pronunciation: '/prəˈfaʊnd/', meaning: '深刻的；意义深远的', example: 'The book had a profound impact on my thinking.' },
  { id: 4, word: 'meticulous', pronunciation: '/məˈtɪkjələs/', meaning: '一丝不苟的；极仔细的', example: 'She is meticulous about her work.' },
  { id: 5, word: 'ambiguous', pronunciation: '/æmˈbɪɡjuəs/', meaning: '模糊不清的；引起歧义的', example: 'The contract contains ambiguous wording.' },
  { id: 6, word: 'persistent', pronunciation: '/pəˈsɪstənt/', meaning: '坚持不懈的；持续的', example: 'Her persistent efforts finally paid off.' },
  { id: 7, word: 'innovative', pronunciation: '/ˈɪnəveɪtɪv/', meaning: '创新的；革新的', example: 'The company is known for its innovative products.' },
  { id: 8, word: 'comprehensive', pronunciation: '/ˌkɑːmprɪˈhensɪv/', meaning: '全面的；综合的', example: 'We need a comprehensive review of the policy.' },
  { id: 9, word: 'sustainable', pronunciation: '/səˈsteɪnəbl/', meaning: '可持续的', example: 'We must develop sustainable practices for the future.' },
  { id: 10, word: 'empower', pronunciation: '/ɪmˈpaʊər/', meaning: '授权；使能够', example: 'Education can empower people to change their lives.' },
  { id: 11, word: 'paradigm', pronunciation: '/ˈperədaɪm/', meaning: '范式；典范', example: 'This discovery represents a new paradigm in science.' },
  { id: 12, word: 'collaborate', pronunciation: '/kəˈlæbəreɪt/', meaning: '合作；协作', example: 'Teams need to collaborate effectively to succeed.' },
  { id: 13, word: 'subtle', pronunciation: '/ˈsʌtl/', meaning: '微妙的；细微的', example: 'There are subtle differences between the two designs.' },
  { id: 14, word: 'integrity', pronunciation: '/ɪnˈteɡrəti/', meaning: '正直；完整性', example: 'He is a person of great integrity.' },
  { id: 15, word: 'implement', pronunciation: '/ˈɪmplɪment/', meaning: '实施；执行', example: 'We need to implement the new strategy.' },
  { id: 16, word: 'dynamic', pronunciation: '/daɪˈnæmɪk/', meaning: '动态的；有活力的', example: 'The team has a dynamic working environment.' },
  { id: 17, word: 'optimize', pronunciation: '/ˈɑːptɪmaɪz/', meaning: '优化', example: 'We should optimize our workflow for better efficiency.' },
  { id: 18, word: 'endeavor', pronunciation: '/ɪnˈdevər/', meaning: '努力；尝试', example: 'Learning a new language requires great endeavor.' },
  { id: 19, word: 'allocate', pronunciation: '/ˈæləkeɪt/', meaning: '分配；拨给', example: 'The budget needs to be allocated properly.' },
  { id: 20, word: 'crucial', pronunciation: '/ˈkruːʃl/', meaning: '至关重要的', example: 'Time management is crucial for success.' },
];

// 存储用户数据（内存中）
const userProgress: {
  learnedWords: number[];
  reviewWords: number[];
  dailyGoal: number;
  streak: number;
} = {
  learnedWords: [], // 已认识的单词ID列表
  reviewWords: [], // 需要复习的单词ID列表
  dailyGoal: 10,
  streak: 5, // 连续学习天数
};

// 获取单词列表
router.get('/', (req, res) => {
  const { category } = req.query;
  let words = [...WORDS];
  
  // 如果有category参数，按类别筛选
  if (category === 'new') {
    words = words.filter(w => !userProgress.learnedWords.includes(w.id));
  } else if (category === 'review') {
    words = words.filter(w => userProgress.reviewWords.includes(w.id));
  }
  
  res.json({
    success: true,
    data: words,
    total: words.length,
  });
});

// 获取用户进度
router.get('/progress', (req, res) => {
  res.json({
    success: true,
    data: {
      learnedCount: userProgress.learnedWords.length,
      reviewCount: userProgress.reviewWords.length,
      dailyGoal: userProgress.dailyGoal,
      streak: userProgress.streak,
      totalWords: WORDS.length,
    },
  });
});

// 标记单词学习状态
router.post('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'known' | 'unknown'
  const wordId = parseInt(id);
  
  if (status === 'known') {
    if (!userProgress.learnedWords.includes(wordId)) {
      userProgress.learnedWords.push(wordId);
    }
    // 从复习列表移除
    userProgress.reviewWords = userProgress.reviewWords.filter(wid => wid !== wordId);
  } else if (status === 'unknown') {
    if (!userProgress.reviewWords.includes(wordId)) {
      userProgress.reviewWords.push(wordId);
    }
  }
  
  res.json({
    success: true,
    message: `Word ${wordId} marked as ${status}`,
  });
});

// 获取生词本
router.get('/notebook', (req, res) => {
  const notebookWords = WORDS.filter(w => userProgress.reviewWords.includes(w.id));
  res.json({
    success: true,
    data: notebookWords,
    total: notebookWords.length,
  });
});

export default router;
