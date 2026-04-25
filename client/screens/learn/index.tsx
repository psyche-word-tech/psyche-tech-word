import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useApiConfig } from '@/contexts/ApiConfigContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH / 3;

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

interface DraggableWordProps {
	word: Word;
	onDrop: (wordId: number, categoryId: number) => void;
	onPress: () => void;
}

function DraggableWord({ word, onDrop, onPress }: DraggableWordProps) {
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
			if (!hasDragged.value) {
				return;
			}

			const dropY = event.absoluteY;
			let targetCategory: number | null = null;
			// 分类区域在屏幕下方
			if (dropY > 500) {
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
				runOnJS(onDrop)(word.id, targetCategory);
				translateX.value = withSpring(0);
				translateY.value = withSpring(0);
				scale.value = withSpring(1);
				zIndex.value = 1;
			} else {
				// 没有拖动到有效区域：卡片回到原位
				translateX.value = withSpring(0);
				translateY.value = withSpring(0);
				scale.value = withSpring(1);
				zIndex.value = 1;
			}
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
				<View style={styles.wordCard}>
					<Text style={styles.wordCardText}>{word.word}</Text>
				</View>
			</Animated.View>
		</GestureDetector>
	);
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
	
	// 分类颜色配置
	const categoryColors = {
		1: { bg: '#4CAF50', badge: '#388E3C' },
		2: { bg: '#FF9800', badge: '#F57C00' },
		3: { bg: '#F44336', badge: '#D32F2F' },
	};

	// 显示的单词（最多3个）
	const displayWords = allWords.slice(0, 3);
	const remainingCount = allWords.length;

	const fetchData = async () => {
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

			const wordsResult = Array.isArray(wordsData) ? wordsData : [];
			setAllWords(wordsResult);
				
			setCategories([
				{ id: 1, name: '已会', letter: 'x', count: Array.isArray(xResult) ? xResult.length : 0 },
				{ id: 2, name: '模糊', letter: 'y', count: Array.isArray(yResult) ? yResult.length : 0 },
				{ id: 3, name: '不会', letter: 'z', count: Array.isArray(zResult) ? zResult.length : 0 },
			]);
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	};

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [table, apiBaseUrl])
	);

	const handleDrop = async (wordId: number, categoryId: number) => {
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
					wordId: wordId
				}),
			});
		} catch (error) {
			console.error('Failed to move word:', error);
		}

		// 从allWords中移除被拖走的单词，后续单词会自动补上
		setAllWords(prev => prev.filter(w => w.id !== wordId));
		
		// 更新分类数量
		setCategories(cats =>
			cats.map(cat =>
				cat.id === categoryId ? { ...cat, count: cat.count + 1 } : cat
			)
		);
	};

	const handleWordPress = (word: Word) => {
		router.push('/word-detail', { 
			word: JSON.stringify({
				id: word.id,
				word: word.word,
				phonetic: word.phonetic || '',
				meaning: word.meaning,
				example: word.example || '',
				example_translation: word.example_translation || '',
				example_image_url: word.example_image_url || ''
			}),
			table: table
		});
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
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

					{/* Word Cards - 3 words in a row */}
					<View style={styles.wordCardsContainer}>
						<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>
						{displayWords.length > 0 ? (
							<View style={styles.wordRow}>
								{displayWords.map((word) => (
									<DraggableWord
										key={word.id}
										word={word}
										onDrop={handleDrop}
										onPress={() => handleWordPress(word)}
									/>
								))}
							</View>
						) : (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>所有单词已分类完成！</Text>
							</View>
						)}
					</View>

					{/* Category Drop Zones */}
					<View style={styles.categoryContainer}>
						<View style={styles.categoryRow}>
							{categories.map((cat) => (
								<TouchableOpacity key={cat.id} style={styles.categoryItem}>
									<View style={[styles.categoryCardLarge, { backgroundColor: categoryColors[cat.id as keyof typeof categoryColors].bg }]}>
										<Text style={styles.categoryNameText}>{cat.name}</Text>
										<Text style={styles.categoryLetterText}>({cat.count})</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Instruction */}
					<View style={styles.instructionContainer}>
						<Text style={styles.instructionText}>拖拽单词到下方分类</Text>
					</View>
				</View>
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
		alignItems: 'center',
	},
	remainingText: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 20,
	},
	wordRow: {
		flexDirection: 'row',
		gap: 15,
		justifyContent: 'center',
	},
	wordItemContainer: {
		width: 100,
	},
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 12,
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
		minHeight: 80,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	wordCardText: {
		fontSize: 16,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
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
		paddingHorizontal: 20,
		paddingVertical: 20,
		borderRadius: 12,
		minWidth: 80,
		alignItems: 'center',
	},
	categoryNameText: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	categoryLetterText: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.8)',
		fontFamily: 'serif',
		marginTop: 4,
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
