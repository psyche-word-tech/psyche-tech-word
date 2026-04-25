import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/utils/apiConfig';

interface Word {
	id: number;
	word: string;
	phonetic: string;
	meaning: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WordPreviewPage() {
	const router = useSafeRouter();
	const [words, setWords] = useState<Word[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [isDragging, setIsDragging] = useState(false);

	// 拖拽动画
	const dragPosition = useRef(new Animated.ValueXY()).current;
	const dropZoneY = useRef(0);

	// 获取词汇列表
	const fetchWords = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/v1/user-words/category/words_b`);
			const data = await response.json();
			if (Array.isArray(data)) {
				setWords(data);
			}
		} catch (error) {
			console.error('Failed to fetch words:', error);
		}
	}, []);

	// 获取分类数量
	const fetchCategoryCounts = useCallback(async () => {
		try {
			const [xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_x/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_y/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_z/count`),
			]);
			const [xData, yData, zData] = await Promise.all([xRes.json(), yRes.json(), zRes.json()]);
			setCategoryCounts({
				x: xData.count || 0,
				y: yData.count || 0,
				z: zData.count || 0,
			});
		} catch (error) {
			console.error('Failed to fetch category counts:', error);
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
	const moveWord = useCallback(async (targetTable: string, status: string) => {
		const word = words[currentIndex];
		if (!word) return;

		try {
			/**
			 * 服务端文件：server/src/routes/user-words.ts
			 * 接口：POST /api/v1/user-words/move
			 * Body参数：wordId: number, targetTable: string
			 */
			const response = await fetch(`${API_BASE_URL}/api/v1/user-words/move`, {
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

			Alert.alert('成功', `单词已移动到"${status}"分类`);
			
			// 更新分类数量
			fetchCategoryCounts();

			// 从列表中移除当前单词
			const newWords = [...words];
			newWords.splice(currentIndex, 1);
			setWords(newWords);

			// 如果还有单词，显示下一个
			if (newWords.length > 0) {
				setCurrentIndex(Math.min(currentIndex, newWords.length - 1));
			} else {
				Alert.alert('提示', '所有单词已分类完成！');
			}
		} catch (error) {
			console.error('Failed to move word:', error);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [words, currentIndex, fetchCategoryCounts]);

	// 切换单词
	const switchWord = (direction: 'prev' | 'next') => {
		if (direction === 'prev' && currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		} else if (direction === 'next' && currentIndex < words.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	// 拖拽 PanResponder
	const panResponder = useRef(
		Animated.event(
			[null, { dx: dragPosition.x, dy: dragPosition.y }],
			{ useNativeDriver: false }
		)
	).current;

	const onGestureEvent = Animated.event(
		[
			null,
			{ dx: dragPosition.x, dy: dragPosition.y }
		],
		{ useNativeDriver: false }
	);

	const onPanResponderGrant = () => {
		setIsDragging(true);
		dragPosition.setOffset({
			x: dragPosition.x._value,
			y: dragPosition.y._value,
		});
		dragPosition.setValue({ x: 0, y: 0 });
	};

	const onPanResponderRelease = (evt: any, gestureState: any) => {
		setIsDragging(false);
		dragPosition.flattenOffset();

		const dropY = screenHeight - 180; // 按钮区域顶部

		// 如果向上拖动超过一定距离，检测目标
		if (gestureState.dy < -100) {
			const touchX = gestureState.moveX || evt.nativeEvent.pageX;
			const buttonWidth = screenWidth / 3;

			if (touchX < buttonWidth) {
				moveWord('words_x', '已会');
			} else if (touchX < buttonWidth * 2) {
				moveWord('words_y', '模糊');
			} else {
				moveWord('words_z', '不会');
			}
		}

		// 回到原位
		Animated.spring(dragPosition, {
			toValue: { x: 0, y: 0 },
			useNativeDriver: false,
		}).start();
	};

	const word = words[currentIndex];

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>词汇预览</Text>
					<Text style={styles.progressText}>{words.length > 0 ? `${currentIndex + 1}/${words.length}` : '0/0'}</Text>
				</View>

				{/* Word Card - Draggable */}
				{word ? (
					<Animated.View
						onStartShouldSetResponder={() => true}
						onMoveShouldSetResponder={() => true}
						onResponderGrant={onPanResponderGrant}
						onResponderMove={onGestureEvent}
						onResponderRelease={onPanResponderRelease}
						style={[
							styles.wordCard,
							isDragging && styles.wordCardDragging,
							{
								transform: [
									{ translateX: dragPosition.x },
									{ translateY: dragPosition.y },
								],
							},
						]}
					>
						<Text style={styles.wordText}>{word.word}</Text>
						<Text style={styles.phoneticText}>{word.phonetic}</Text>
						<Text style={styles.meaningText}>{word.meaning}</Text>
						<View style={styles.dragHint}>
							<Ionicons name="arrow-up-outline" size={16} color="#999" />
							<Text style={styles.dragHintText}>向上拖动到分类区域</Text>
						</View>
					</Animated.View>
				) : (
					<View style={styles.emptyCard}>
						<Text style={styles.emptyText}>所有单词已分类完成！</Text>
					</View>
				)}

				{/* Navigation Arrows */}
				<View style={styles.navSection}>
					<TouchableOpacity
						style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
						onPress={() => switchWord('prev')}
						disabled={currentIndex === 0}
					>
						<Ionicons name="chevron-back" size={28} color={currentIndex === 0 ? '#CCC' : '#4F46E5'} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.navButton, currentIndex === words.length - 1 && styles.navButtonDisabled]}
						onPress={() => switchWord('next')}
						disabled={currentIndex === words.length - 1}
					>
						<Ionicons name="chevron-forward" size={28} color={currentIndex === words.length - 1 ? '#CCC' : '#4F46E5'} />
					</TouchableOpacity>
				</View>

				{/* Drop Zones */}
				<View style={styles.categorySection}>
					<Text style={styles.dropHint}>拖动单词到下方区域进行分类</Text>
					<View style={styles.categoryRow}>
						<TouchableOpacity
							style={[styles.categoryButton, styles.knownButton]}
							onPress={() => moveWord('words_x', '已会')}
						>
							<Text style={styles.categoryLabel}>已会</Text>
							<Text style={styles.categoryCount}>{categoryCounts.x}</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.categoryButton, styles.vagueButton]}
							onPress={() => moveWord('words_y', '模糊')}
						>
							<Text style={styles.categoryLabel}>模糊</Text>
							<Text style={styles.categoryCount}>{categoryCounts.y}</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.categoryButton, styles.unknownButton]}
							onPress={() => moveWord('words_z', '不会')}
						>
							<Text style={styles.categoryLabel}>不会</Text>
							<Text style={styles.categoryCount}>{categoryCounts.z}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5F5F5',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	backText: {
		fontSize: 16,
		color: '#4F46E5',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333333',
	},
	progressText: {
		fontSize: 14,
		color: '#666',
	},
	wordCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 32,
		marginHorizontal: 24,
		marginTop: 40,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
	},
	wordCardDragging: {
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
		opacity: 0.95,
	},
	wordText: {
		fontSize: 36,
		fontWeight: '700',
		color: '#333333',
		marginBottom: 8,
		fontFamily: 'serif',
	},
	phoneticText: {
		fontSize: 18,
		color: '#666666',
		marginBottom: 16,
		fontFamily: 'serif',
	},
	meaningText: {
		fontSize: 16,
		color: '#999999',
		textAlign: 'center',
		lineHeight: 24,
		fontFamily: 'serif',
	},
	dragHint: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
		gap: 6,
	},
	dragHintText: {
		fontSize: 12,
		color: '#999',
	},
	emptyCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 48,
		marginHorizontal: 24,
		marginTop: 40,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
	},
	emptyText: {
		fontSize: 18,
		color: '#999',
	},
	navSection: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 60,
		marginTop: 30,
	},
	navButton: {
		padding: 12,
	},
	navButtonDisabled: {
		opacity: 0.5,
	},
	categorySection: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 32,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 10,
	},
	dropHint: {
		fontSize: 12,
		color: '#999',
		textAlign: 'center',
		marginBottom: 12,
	},
	categoryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	categoryButton: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 16,
		borderRadius: 16,
	},
	knownButton: {
		backgroundColor: '#4CAF50',
	},
	vagueButton: {
		backgroundColor: '#FF9800',
	},
	unknownButton: {
		backgroundColor: '#F44336',
	},
	categoryLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	categoryCount: {
		fontSize: 20,
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
