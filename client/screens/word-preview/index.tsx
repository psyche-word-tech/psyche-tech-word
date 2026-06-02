import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchWithRetry } from '@/utils/apiClient';

interface Word {
	id: string;
	word: string;
	phonetic: string;
	definition: string;
	example_image_url?: string;
}

interface CategoryCounts {
	x: number;
	y: number;
	z: number;
}

export default function WordPreviewScreen() {
	const [words, setWords] = useState<Word[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({ x: 0, y: 0, z: 0 });
	const [currentIndex, setCurrentIndex] = useState(0);

	// 获取 words_a 的单词
	const fetchWords = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetchWithRetry(`/api/v1/user-words/category/a?page=1&limit=200`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			setWords(data);
			setCurrentIndex(0);
		} catch (err: any) {
			console.error('Failed to fetch words:', err);
			setError(err.message || '获取单词列表失败');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// 获取分类计数
	const fetchCategoryCounts = useCallback(async () => {
		try {
			const [xRes, yRes, zRes] = await Promise.all([
				fetchWithRetry(`/api/v1/user-words/category/x/count`),
				fetchWithRetry(`/api/v1/user-words/category/y/count`),
				fetchWithRetry(`/api/v1/user-words/category/z/count`),
			]);

			const [xData, yData, zData] = await Promise.all([
				xRes.json(),
				yRes.json(),
				zRes.json(),
			]);

			setCategoryCounts({
				x: xData.count || 0,
				y: yData.count || 0,
				z: zData.count || 0,
			});
		} catch (err) {
			console.error('Failed to fetch category counts:', err);
		}
	}, []);

	// 页面加载时获取数据
	useFocusEffect(
		useCallback(() => {
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts])
	);

	// 移动单词到分类
	const handleMoveWord = useCallback(async (word: Word, targetTable: string) => {
		try {
			const response = await fetchWithRetry(`/api/v1/user-words/classify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					wordId: word.id,
					targetTable: targetTable
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || '移动失败');
			}

			// 从列表中移除当前单词
			const newWords = words.filter(w => w.id !== word.id);
			setWords(newWords);

			// 更新索引
			if (currentIndex >= newWords.length && newWords.length > 0) {
				setCurrentIndex(newWords.length - 1);
			}

			// 更新分类数量
			fetchCategoryCounts();
		} catch (err: any) {
			console.error('Failed to move word:', err);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [words, currentIndex, fetchCategoryCounts]);

	// 计算显示的单词
	const currentWord = words[currentIndex];

	if (isLoading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
				</View>
				<View style={styles.centerContent}>
					<Text style={styles.loadingText}>加载中...</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
				</View>
				<View style={styles.centerContent}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>词汇预览</Text>
			</View>

			<View style={styles.content}>
				{words.length === 0 ? (
					<View style={styles.completedContainer}>
						<Text style={styles.completedText}>所有单词已分类完成！</Text>
					</View>
				) : (
					<>
						<Text style={styles.remainingText}>剩余{words.length}个单词</Text>
						
						{/* 单词卡片区域 */}
						<View style={styles.wordsContainer}>
							{[0, 1, 2].map(offset => {
								const word = words[currentIndex + offset];
								if (!word) return null;
								
								return (
									<View
										key={word.id}
										style={styles.wordCard}
									>
										<Text style={styles.wordText}>{word.word}</Text>
										<Text style={styles.definitionText}>{word.definition}</Text>
									</View>
								);
							})}
						</View>

						{/* 分类按钮 */}
						<View style={styles.buttonsContainer}>
							<TouchableOpacity
								style={[styles.categoryButton, styles.buttonX]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'x')}
							>
								<Text style={styles.buttonText}>已会 ({categoryCounts.x})</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.categoryButton, styles.buttonY]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'y')}
							>
								<Text style={styles.buttonText}>模糊 ({categoryCounts.y})</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.categoryButton, styles.buttonZ]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'z')}
							>
								<Text style={styles.buttonText}>不会 ({categoryCounts.z})</Text>
							</TouchableOpacity>
						</View>

						{/* 提示文字 */}
						<Text style={styles.hintText}>点击按钮对当前单词分类</Text>

						{/* 翻页控制 */}
						<View style={styles.paginationContainer}>
							<TouchableOpacity
								style={[styles.pageButton, currentIndex === 0 && styles.pageButtonDisabled]}
								onPress={() => setCurrentIndex(Math.max(0, currentIndex - 3))}
								disabled={currentIndex === 0}
							>
								<Text style={styles.pageButtonText}>上一组</Text>
							</TouchableOpacity>

							<Text style={styles.pageInfo}>
								{Math.floor(currentIndex / 3) + 1} / {Math.ceil(words.length / 3)}
							</Text>

							<TouchableOpacity
								style={[styles.pageButton, currentIndex >= words.length - 3 && styles.pageButtonDisabled]}
								onPress={() => setCurrentIndex(Math.min(words.length - 3, currentIndex + 3))}
								disabled={currentIndex >= words.length - 3}
							>
								<Text style={styles.pageButtonText}>下一组</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		paddingTop: 50,
		paddingBottom: 16,
		paddingHorizontal: 20,
		backgroundColor: '#f5f5f5',
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	content: {
		flex: 1,
		padding: 20,
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#666',
	},
	errorText: {
		fontSize: 16,
		color: 'red',
		textAlign: 'center',
	},
	completedContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	completedText: {
		fontSize: 18,
		color: '#4CAF50',
		fontWeight: 'bold',
	},
	remainingText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 20,
	},
	wordsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 30,
	},
	wordCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		width: '30%',
		minHeight: 120,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		justifyContent: 'center',
		alignItems: 'center',
	},
	wordText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
		textAlign: 'center',
	},
	definitionText: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	categoryButton: {
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 8,
		minWidth: 100,
		alignItems: 'center',
	},
	buttonX: {
		backgroundColor: '#4CAF50',
	},
	buttonY: {
		backgroundColor: '#FF9800',
	},
	buttonZ: {
		backgroundColor: '#F44336',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	hintText: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginBottom: 20,
	},
	paginationContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 20,
	},
	pageButton: {
		backgroundColor: '#2196F3',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	pageButtonDisabled: {
		backgroundColor: '#ccc',
	},
	pageButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	pageInfo: {
		fontSize: 14,
		color: '#666',
	},
});
