import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, Alert } from 'react-native';
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
	const [words, setWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [draggingWord, setDraggingWord] = useState<Word | null>(null);

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
	const moveWord = useCallback(async (word: Word, targetTable: string, status: string) => {
		try {
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

			// 从列表中移除
			setWords(prev => prev.filter(w => w.id !== word.id));
			setDraggingWord(null);
			
			// 更新分类数量
			fetchCategoryCounts();

		} catch (error) {
			console.error('Failed to move word:', error);
			setDraggingWord(null);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [fetchCategoryCounts]);

	// 检测放置位置
	const getDropZone = (y: number): { table: string; status: string } | null => {
		const dropZoneTop = screenHeight - 150;
		if (y > dropZoneTop) {
			const zoneWidth = screenWidth / 3;
			const x = draggingWord?.position?.x || screenWidth / 2;
			if (x < zoneWidth) {
				return { table: 'words_x', status: '已会' };
			} else if (x < zoneWidth * 2) {
				return { table: 'words_y', status: '模糊' };
			} else {
				return { table: 'words_z', status: '不会' };
			}
		}
		return null;
	};

	// 创建可拖动的单词卡片
	const DraggableWordCard = ({ word, index }: { word: Word; index: number }) => {
		const pan = useRef(new Animated.ValueXY()).current;
		const isActive = useRef(false);

		const panResponder = useRef(
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderGrant: () => {
					isActive.current = true;
					pan.setOffset({
						x: (pan.x as any)._value || 0,
						y: (pan.y as any)._value || 0,
					});
					pan.setValue({ x: 0, y: 0 });
					setDraggingWord({ ...word, position: { x: 0, y: 0 } });
				},
				onPanResponderMove: Animated.event(
					[null, { dx: pan.x, dy: pan.y }],
					{ useNativeDriver: false }
				),
				onPanResponderRelease: (evt, gestureState) => {
					isActive.current = false;
					pan.flattenOffset();

					const newX = (pan.x as any)._value + gestureState.dx;
					const newY = (pan.y as any)._value + gestureState.dy;

					setDraggingWord(prev => prev ? { ...prev, position: { x: newX, y: newY } } : null);

					// 检测放置位置
					const dropZone = getDropZone(newY + 100); // 100 是初始偏移
					if (dropZone) {
						moveWord(word, dropZone.table, dropZone.status);
					}

					// 回到原位
					Animated.spring(pan, {
						toValue: { x: 0, y: 0 },
						useNativeDriver: false,
					}).start();
				},
			})
		).current;

		return (
			<Animated.View
				{...panResponder.panHandlers}
				style={[
					styles.wordCard,
					{
						transform: [
							{ translateX: pan.x },
							{ translateY: pan.y },
						],
					},
				]}
			>
				<Text style={styles.wordText}>{word.word}</Text>
				<Text style={styles.phoneticText}>{word.phonetic}</Text>
				<Text style={styles.meaningText} numberOfLines={2}>{word.meaning}</Text>
				<View style={styles.dragHint}>
					<Ionicons name="move-outline" size={14} color="#999" />
					<Text style={styles.dragHintText}>拖动分类</Text>
				</View>
			</Animated.View>
		);
	};

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
					<Text style={styles.headerCount}>{words.length} 个单词待分类</Text>
				</View>

				{/* Word Cards */}
				<View style={styles.cardsContainer}>
					{words.map((word, index) => (
						<DraggableWordCard key={word.id} word={word} index={index} />
					))}
					{words.length === 0 && (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>所有单词已分类完成！</Text>
						</View>
					)}
				</View>

				{/* Drop Zones */}
				<View style={styles.categorySection}>
					<Text style={styles.dropHint}>拖动单词到下方区域进行分类</Text>
					<View style={styles.categoryRow}>
						<View style={[styles.categoryItem, styles.knownItem]}>
							<Text style={styles.categoryLabel}>已会</Text>
							<Text style={styles.categoryCount}>{categoryCounts.x}</Text>
						</View>
						<View style={[styles.categoryItem, styles.vagueItem]}>
							<Text style={styles.categoryLabel}>模糊</Text>
							<Text style={styles.categoryCount}>{categoryCounts.y}</Text>
						</View>
						<View style={[styles.categoryItem, styles.unknownItem]}>
							<Text style={styles.categoryLabel}>不会</Text>
							<Text style={styles.categoryCount}>{categoryCounts.z}</Text>
						</View>
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
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#333333',
		fontFamily: 'serif',
	},
	headerCount: {
		fontSize: 14,
		color: '#999999',
		marginTop: 4,
		fontFamily: 'serif',
	},
	cardsContainer: {
		flex: 1,
		padding: 16,
		paddingBottom: 160,
	},
	wordCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	wordText: {
		fontSize: 20,
		fontWeight: '600',
		color: '#333333',
		fontFamily: 'serif',
	},
	phoneticText: {
		fontSize: 14,
		color: '#999999',
		marginTop: 4,
		fontFamily: 'serif',
	},
	meaningText: {
		fontSize: 14,
		color: '#666666',
		marginTop: 8,
		fontFamily: 'serif',
	},
	dragHint: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
		gap: 4,
	},
	dragHintText: {
		fontSize: 12,
		color: '#999',
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
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
		gap: 8,
	},
	categoryItem: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 16,
		borderRadius: 16,
	},
	knownItem: {
		backgroundColor: '#4CAF50',
	},
	vagueItem: {
		backgroundColor: '#FF9800',
	},
	unknownItem: {
		backgroundColor: '#F44336',
	},
	categoryLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	categoryCount: {
		fontSize: 24,
		fontWeight: '700',
		color: '#FFFFFF',
		marginTop: 4,
		fontFamily: 'serif',
	},
});
