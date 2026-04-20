import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

interface Word {
	id: number;
	word: string;
	meaning: string;
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
}

function DraggableWord({ word, onDrop }: DraggableWordProps) {
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const scale = useSharedValue(1);
	const zIndex = useSharedValue(1);
	const [droppedCategory, setDroppedCategory] = useState<number | null>(null);

	const panGesture = Gesture.Pan()
		.onStart(() => {
			scale.value = withSpring(1.1);
			zIndex.value = 100;
		})
		.onUpdate((event) => {
			translateX.value = event.translationX;
			translateY.value = event.translationY;
		})
		.onEnd((event) => {
			const dropY = event.absoluteY;
			// 拖拽区域在屏幕下方约150-600像素范围内
			let targetCategory: number | null = null;
			if (dropY > 150 && dropY < 700) {
				const screenWidth = 350;
				const itemWidth = screenWidth / 3;
				const relativeX = event.absoluteX;
				if (relativeX < itemWidth) {
					targetCategory = 1;
				} else if (relativeX < itemWidth * 2) {
					targetCategory = 2;
				} else {
					targetCategory = 3;
				}
			}

			if (targetCategory !== null) {
				runOnJS(setDroppedCategory)(targetCategory);
				runOnJS(onDrop)(targetCategory);
			}

			translateX.value = withSpring(0);
			translateY.value = withSpring(0);
			scale.value = withSpring(1);
			zIndex.value = 1;
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ scale: scale.value },
		],
		zIndex: zIndex.value,
	}));

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View style={[styles.wordItemContainer, animatedStyle]}>
				<View style={[styles.wordCard, droppedCategory !== null && styles.wordCardUsed]}>
					<Text style={[styles.wordCardText, droppedCategory !== null && styles.wordCardTextUsed]}>
						{word.word}
					</Text>
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

export default function LearnPage() {
	const router = useSafeRouter();
	const [words, setWords] = useState<Word[]>([]);
	const [categories, setCategories] = useState<Category[]>([
		{ id: 1, name: '已会', letter: 'x', count: 0 },
		{ id: 2, name: '模糊', letter: 'y', count: 0 },
		{ id: 3, name: '不会', letter: 'z', count: 0 },
	]);
	const [usedWords, setUsedWords] = useState<Set<number>>(new Set());

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchData = async () => {
		try {
			// 获取单词列表
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words`);
			const result = await response.json();
			if (result.data) {
				setWords(result.data);

				// 从数据库获取每个单词的状态
				const usedSet = new Set<number>();
				const catCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
				const statusMap: Record<string, number> = { x: 1, y: 2, z: 3 };

				for (const word of result.data) {
					const statusRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${word.id}/status`);
					const statusData = await statusRes.json();
					if (statusData.data?.status) {
						const catId = statusMap[statusData.data.status];
						if (catId) {
							usedSet.add(word.id);
							catCounts[catId as keyof typeof catCounts]++;
						}
					}
				}

				setUsedWords(usedSet);
				setCategories(cats => cats.map(cat => ({ ...cat, count: catCounts[cat.id] || 0 })));
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
		paddingHorizontal: 20,
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
