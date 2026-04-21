import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH / 3;

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
}

interface Category {
	id: number;
	name: string;
	letter: string;
	count: number;
}

interface DraggableWordProps {
	word: Word;
	onDrop: (categoryId: number) => void;
	onPress: () => void;
	isUsed: boolean;
}

function DraggableWord({ word, onDrop, onPress, isUsed }: DraggableWordProps) {
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(1);
	const zIndex = useSharedValue(1);
	const hasDragged = useSharedValue(false);

	// 拖动手势
	const panGesture = Gesture.Pan()
		.onStart(() => {
			hasDragged.value = false;
			scale.value = withSpring(1.1);
			zIndex.value = 100;
		})
		.onUpdate((event) => {
			hasDragged.value = true;
			translateX.value = event.translationX;
			translateY.value = event.translationY;
		})
		.onEnd((event) => {
			const dropY = event.absoluteY;
			let targetCategory: number | null = null;
			if (dropY > 150 && dropY < 700) {
				const relativeX = event.absoluteX;
				if (relativeX < ITEM_WIDTH) {
					targetCategory = 1;
				} else if (relativeX < ITEM_WIDTH * 2) {
					targetCategory = 2;
				} else {
					targetCategory = 3;
				}
			}

			if (targetCategory !== null) {
				runOnJS(onDrop)(targetCategory);
			}

			translateX.value = withSpring(0);
			translateY.value = withSpring(0);
			scale.value = withSpring(1);
			zIndex.value = 1;
			hasDragged.value = false;
		});

	// 点击手势
	const tapGesture = Gesture.Tap()
		.onEnd(() => {
			if (!hasDragged.value) {
				runOnJS(onPress)();
			}
		});

	// 同时支持拖动和点击
	const composedGesture = Gesture.Race(panGesture, tapGesture);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ scale: scale.value },
		],
		zIndex: zIndex.value,
	}));

	return (
		<GestureDetector gesture={composedGesture}>
			<Animated.View style={[styles.wordItemContainer, animatedStyle]}>
				<View style={[styles.wordCard, isUsed && styles.wordCardUsed]}>
					<Text style={[styles.wordCardText, isUsed && styles.wordCardTextUsed]}>
						{word.word}
					</Text>
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const table = params.table || 'words_b'; // 默认从 words_b 获取
	
	const [words, setWords] = useState<Word[]>([]);
	const [categories, setCategories] = useState<Category[]>([
		{ id: 1, name: '已会', letter: 'x', count: 0 },
		{ id: 2, name: '模糊', letter: 'y', count: 0 },
		{ id: 3, name: '不会', letter: 'z', count: 0 },
	]);
	const [usedWords, setUsedWords] = useState<Set<number>>(new Set());

	// 页面返回时自动刷新数据
	useFocusEffect(
		useCallback(() => {
			fetchData();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [table])
	);

	const fetchData = async () => {
		try {
			// 从指定的词汇表获取单词
			const wordsRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}`);
			const wordsResult = await wordsRes.json();

			if (Array.isArray(wordsResult)) {
				setWords(wordsResult);

				// 重置已用单词状态
				setUsedWords(new Set());
				setCategories(cats => cats.map(cat => ({ ...cat, count: 0 })));
			}
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	};

	const handleDrop = async (wordId: number, categoryId: number) => {
		// 获取状态字母
		const statusMap: Record<number, string> = { 1: 'x', 2: 'y', 3: 'z' };
		const status = statusMap[categoryId];

		// 保存到数据库
		try {
			/**
			 * 服务端文件：server/src/routes/words.ts
			 * 接口：PUT /api/v1/words/:id/status
			 * Body 参数：status: string -- x=已会, y=模糊, z=不会
			 */
			await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${wordId}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			});
		} catch (error) {
			console.error('Failed to save word status:', error);
		}

		setUsedWords(prev => new Set([...prev, wordId]));
		setCategories(cats =>
			cats.map(cat =>
				cat.id === categoryId ? { ...cat, count: cat.count + 1 } : cat
			)
		);

		// 检查是否所有单词都用完了，如果是则重新获取新单词
		const newUsedWords = new Set([...usedWords, wordId]);
		const remainingWords = words.filter(w => !newUsedWords.has(w.id));
		if (remainingWords.length === 0 && words.length > 0) {
			await fetchData();
		}
	};

	const availableWords = words.filter(w => !usedWords.has(w.id));

	const handleCategoryPress = (categoryId: number) => {
		if (categoryId === 1) {
			router.push('/known-words');
		} else if (categoryId === 2) {
			router.push('/vague-words');
		} else if (categoryId === 3) {
			router.push('/unknown-words');
		}
	};

	const handleWordPress = (word: Word) => {
		router.push('/word-detail', { 
			word: JSON.stringify({
				id: word.id,
				word: word.word,
				phonetic: word.phonetic || '',
				meaning: word.meaning
			})
		});
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Screen>
				<ScrollView style={styles.container}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.back()}>
							<Text style={styles.backText}>← back</Text>
						</TouchableOpacity>
						<Text style={styles.title}>词汇预览</Text>
						<View style={styles.placeholder} />
					</View>

					{/* Word Cards - Horizontal with Drag */}
					<View style={styles.wordCardsContainer}>
						{availableWords.length > 0 ? (
							<View style={styles.wordRow}>
								{availableWords.slice(0, 3).map((word) => (
									<DraggableWord
										key={word.id}
										word={word}
										onDrop={(categoryId) => handleDrop(word.id, categoryId)}
										onPress={() => handleWordPress(word)}
										isUsed={usedWords.has(word.id)}
									/>
								))}
							</View>
						) : (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>暂无单词</Text>
							</View>
						)}
					</View>

					{/* Category Drop Zones */}
					<View style={styles.categoryContainer}>
						<View style={styles.categoryRow}>
							{categories.map((cat) => (
								<TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => handleCategoryPress(cat.id)}>
									<View style={styles.categoryCardLarge}>
										<Text style={styles.categoryNameText}>{cat.name}</Text>
										<Text style={styles.categoryLetterText}>({cat.letter})</Text>
									</View>
									<View style={styles.categoryCountBadge}>
										<Text style={styles.categoryCountText}>{cat.count}</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Instruction */}
					<View style={styles.instructionContainer}>
						<Text style={styles.instructionText}>拖拽单词到下方分类</Text>
					</View>
				</ScrollView>
			</Screen>
		</GestureHandlerRootView>
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
	wordCardsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 60,
	},
	wordRow: {
		flexDirection: 'row',
		gap: 15,
		justifyContent: 'center',
	},
	wordItemContainer: {
		flex: 1,
		maxWidth: 100,
	},
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	wordCardUsed: {
		backgroundColor: '#CCCCCC',
		borderColor: '#AAAAAA',
	},
	wordCardText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
	},
	wordCardTextUsed: {
		color: '#888888',
	},
	categoryContainer: {
		paddingHorizontal: 20,
		paddingVertical: 40,
	},
	categoryRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	categoryItem: {
		alignItems: 'center',
	},
	categoryCardLarge: {
		backgroundColor: '#4A4A4A',
		paddingHorizontal: 12,
		paddingVertical: 15,
		borderRadius: 6,
		minWidth: 60,
		alignItems: 'center',
	},
	categoryNameText: {
		fontSize: 12,
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	categoryLetterText: {
		fontSize: 10,
		color: '#CCCCCC',
		fontFamily: 'serif',
		marginTop: 2,
	},
	categoryCountBadge: {
		backgroundColor: '#4A90D9',
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 6,
	},
	categoryCountText: {
		fontSize: 12,
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	instructionContainer: {
		padding: 20,
		alignItems: 'center',
	},
	instructionText: {
		fontSize: 12,
		color: '#999999',
		fontFamily: 'serif',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
});
