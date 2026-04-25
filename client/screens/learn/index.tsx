import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useApiConfig } from '@/contexts/ApiConfigContext';

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
	example?: string;
	example_translation?: string;
	example_image_url?: string;
}

interface Category {
	id: number;
	name: string;
	letter: string;
	count: number;
}

export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const { apiBaseUrl } = useApiConfig();
	const table = params.table || 'words_b';
	
	const [allWords, setAllWords] = useState<Word[]>([]);
	const [categories, setCategories] = useState<Category[]>([
		{ id: 1, name: '已会', letter: 'x', count: 0 },
		{ id: 2, name: '模糊', letter: 'y', count: 0 },
		{ id: 3, name: '不会', letter: 'z', count: 0 },
	]);
	const [selectedWord, setSelectedWord] = useState<Word | null>(null);
	
	// 分类颜色配置
	const categoryColors = {
		1: '#4CAF50',
		2: '#FF9800',
		3: '#F44336',
	};

	// 显示的单词（最多3个）
	const displayWords = allWords.slice(0, 3);
	const remainingCount = allWords.length;

	const fetchData = useCallback(async () => {
		try {
			const [wordsRes, xRes, yRes, zRes] = await Promise.all([
				fetch(`${apiBaseUrl}/api/v1/wordbooks/${table}`),
				fetch(`${apiBaseUrl}/api/v1/wordbooks/words_x`),
				fetch(`${apiBaseUrl}/api/v1/wordbooks/words_y`),
				fetch(`${apiBaseUrl}/api/v1/wordbooks/words_z`)
			]);

			const wordsData = await wordsRes.json();
			const xResult = await xRes.json();
			const yResult = await yRes.json();
			const zResult = await zRes.json();

			setAllWords(Array.isArray(wordsData) ? wordsData : []);
				
			setCategories([
				{ id: 1, name: '已会', letter: 'x', count: Array.isArray(xResult) ? xResult.length : 0 },
				{ id: 2, name: '模糊', letter: 'y', count: Array.isArray(yResult) ? yResult.length : 0 },
				{ id: 3, name: '不会', letter: 'z', count: Array.isArray(zResult) ? zResult.length : 0 },
			]);
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	}, [table, apiBaseUrl]);

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [fetchData])
	);

	const handleWordPress = (word: Word) => {
		// 切换选中状态
		if (selectedWord?.id === word.id) {
			setSelectedWord(null);
		} else {
			setSelectedWord(word);
		}
	};

	const handleCategoryPress = async (categoryId: number) => {
		if (!selectedWord) return;
		
		const targetTableMap: Record<number, string> = {
			1: 'words_x',
			2: 'words_y',
			3: 'words_z'
		};
		const targetTable = targetTableMap[categoryId];

		try {
			await fetch(`${apiBaseUrl}/api/v1/wordbooks/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceTable: table,
					targetTable: targetTable,
					wordId: selectedWord.id
				}),
			});
		} catch (error) {
			console.error('Failed to move word:', error);
		}

		// 从allWords中移除被分类的单词
		setAllWords(prev => prev.filter(w => w.id !== selectedWord.id));
		setSelectedWord(null);
		
		// 更新分类数量
		setCategories(cats =>
			cats.map(cat =>
				cat.id === categoryId ? { ...cat, count: cat.count + 1 } : cat
			)
		);
	};

	const handleViewDetail = () => {
		if (selectedWord) {
			router.push('/word-detail', { 
				word: JSON.stringify({
					id: selectedWord.id,
					word: selectedWord.word,
					phonetic: selectedWord.phonetic || '',
					meaning: selectedWord.meaning,
					example: selectedWord.example || '',
					example_translation: selectedWord.example_translation || '',
					example_image_url: selectedWord.example_image_url || ''
				}),
				table: table
			});
		}
	};

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>词汇预览</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Selected Word Info */}
				{selectedWord && (
					<View style={styles.selectedInfo}>
						<Text style={styles.selectedWord}>{selectedWord.word}</Text>
						<Text style={styles.selectedHint}>已选中，点击下方按钮分类</Text>
					</View>
				)}

				{/* Word Cards - 3 words in a row */}
				<View style={styles.wordCardsContainer}>
					<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>
					{displayWords.length > 0 ? (
						<View style={styles.wordRow}>
							{displayWords.map((word) => (
								<TouchableOpacity
									key={word.id}
									style={[
										styles.wordItemContainer,
										selectedWord?.id === word.id && styles.wordItemSelected
									]}
									onPress={() => handleWordPress(word)}
								>
									<View style={[
										styles.wordCard,
										selectedWord?.id === word.id && styles.wordCardSelected
									]}>
										<Text style={[
											styles.wordCardText,
											selectedWord?.id === word.id && styles.wordCardTextSelected
										]}>
											{word.word}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					) : (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>所有单词已分类完成！</Text>
						</View>
					)}
				</View>

				{/* Category Buttons */}
				<View style={styles.categoryContainer}>
					<Text style={styles.categoryTitle}>
						{selectedWord ? '选择分类' : '先点击选择一个单词'}
					</Text>
					<View style={styles.categoryRow}>
						{categories.map((cat) => (
							<TouchableOpacity
								key={cat.id}
								style={[
									styles.categoryItem,
									{ backgroundColor: categoryColors[cat.id] },
									!selectedWord && styles.categoryDisabled
								]}
								onPress={() => handleCategoryPress(cat.id)}
								disabled={!selectedWord}
							>
								<Text style={styles.categoryNameText}>{cat.name}</Text>
								<Text style={styles.categoryCountText}>({cat.count})</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* View Detail Button */}
				{selectedWord && (
					<View style={styles.detailContainer}>
						<TouchableOpacity style={styles.detailButton} onPress={handleViewDetail}>
							<Text style={styles.detailButtonText}>查看详情</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* Instruction */}
				<View style={styles.instructionContainer}>
					<Text style={styles.instructionText}>
						点击单词选中，再点击下方按钮分类
					</Text>
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#E5E5E5',
	},
	backText: {
		fontSize: 14,
		color: '#000000',
		fontFamily: 'serif',
	},
	title: {
		fontSize: 16,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	placeholder: {
		width: 50,
	},
	selectedInfo: {
		backgroundColor: '#4F46E5',
		padding: 12,
		alignItems: 'center',
	},
	selectedWord: {
		fontSize: 18,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	selectedHint: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.8)',
		marginTop: 4,
	},
	wordCardsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 40,
		alignItems: 'center',
	},
	remainingText: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 20,
	},
	wordRow: {
		flexDirection: 'row',
		gap: 10,
		justifyContent: 'center',
	},
	wordItemContainer: {
		width: 80,
	},
	wordItemSelected: {
		transform: [{ scale: 1.1 }],
	},
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 8,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		minHeight: 60,
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: 'transparent',
	},
	wordCardSelected: {
		backgroundColor: '#4F46E5',
		borderColor: '#4F46E5',
	},
	wordCardText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	wordCardTextSelected: {
		color: '#FFFFFF',
	},
	categoryContainer: {
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	categoryTitle: {
		fontSize: 14,
		color: '#666666',
		textAlign: 'center',
		marginBottom: 16,
	},
	categoryRow: {
		flexDirection: 'row',
		gap: 12,
	},
	categoryItem: {
		flex: 1,
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
	},
	categoryDisabled: {
		opacity: 0.5,
	},
	categoryNameText: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	categoryCountText: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.8)',
		marginTop: 4,
	},
	detailContainer: {
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	detailButton: {
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#4F46E5',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	detailButtonText: {
		fontSize: 14,
		color: '#4F46E5',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	instructionContainer: {
		position: 'absolute',
		bottom: 40,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	instructionText: {
		fontSize: 12,
		color: '#999999',
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
	},
});
