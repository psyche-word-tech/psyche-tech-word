import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
	example?: string;
	example_translation?: string;
	example_image_url?: string;
}

interface DraggableWordCardProps {
	word: Word;
	onDrop: (wordId: number, categoryId: number) => void;
	onPress: () => void;
}

function DraggableWordCard({ word, onDrop, onPress }: DraggableWordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				setIsDragging(true);
				pan.setOffset({
					x: (pan.x as any)._value || 0,
					y: (pan.y as any)._value || 0,
				});
				pan.setValue({ x: 0, y: 0 });
			},
			onPanResponderMove: (evt, gestureState) => {
				pan.setValue({ x: gestureState.dx, y: gestureState.dy });
			},
			onPanResponderRelease: (evt, gestureState) => {
				setIsDragging(false);
				pan.flattenOffset();

				const dy = gestureState.dy;
				const absoluteX = gestureState.moveX;

				if (dy > 80) {
					let targetCategory = 3;
					if (absoluteX < SCREEN_WIDTH / 3) {
						targetCategory = 1;
					} else if (absoluteX < (SCREEN_WIDTH / 3) * 2) {
						targetCategory = 2;
					}
					onDrop(word.id, targetCategory);
				}

				Animated.spring(pan, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			},
			onPanResponderTerminate: () => {
				setIsDragging(false);
				pan.flattenOffset();
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
				styles.wordItemContainer,
				{
					transform: [
						{ translateX: pan.x },
						{ translateY: pan.y },
					],
					opacity: isDragging ? 0.8 : 1,
					zIndex: isDragging ? 100 : 1,
				},
			]}
		>
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				<View style={styles.wordCard}>
					<Text style={styles.wordCardText}>{word.word}</Text>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
}

export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const table = params.table || 'words_b';
	
	const [allWords, setAllWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });

	const categoryColors = ['#4CAF50', '#FF9800', '#F44336'];
	const categoryNames = ['已会', '模糊', '不会'];

	const displayWords = allWords.slice(0, 3);
	const remainingCount = allWords.length;

	const fetchData = useCallback(async () => {
		try {
			const [wordsRes, xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/wordbooks/${table}`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_x`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_y`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_z`)
			]);

			const wordsData = await wordsRes.json();
			const xResult = await xRes.json();
			const yResult = await yRes.json();
			const zResult = await zRes.json();

			setAllWords(Array.isArray(wordsData) ? wordsData : []);
			setCategoryCounts({
				x: Array.isArray(xResult) ? xResult.length : 0,
				y: Array.isArray(yResult) ? yResult.length : 0,
				z: Array.isArray(zResult) ? zResult.length : 0,
			});
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	}, [table]);

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [fetchData])
	);

	const handleDrop = useCallback(async (wordId: number, categoryId: number) => {
		const targetTableMap: Record<number, string> = {
			1: 'words_x',
			2: 'words_y',
			3: 'words_z'
		};
		const targetTable = targetTableMap[categoryId];

		try {
			await fetch(`${API_BASE_URL}/api/v1/wordbooks/move`, {
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

		setAllWords(prev => prev.filter(w => w.id !== wordId));
		
		setCategoryCounts(prev => {
			const key = ['x', 'y', 'z'][categoryId - 1] as 'x' | 'y' | 'z';
			return { ...prev, [key]: prev[key] + 1 };
		});
	}, [table]);

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
		<Screen>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>词汇预览</Text>
					<View style={styles.placeholder} />
				</View>

				<View style={styles.content}>
					<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>
					{displayWords.length > 0 ? (
						<View style={styles.wordRow}>
							{displayWords.map((word) => (
								<DraggableWordCard
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

				<View style={styles.categorySection}>
					<View style={styles.categoryRow}>
						{[1, 2, 3].map((id) => (
							<View key={id} style={styles.categoryItem}>
								<View style={[styles.categoryCard, { backgroundColor: categoryColors[id - 1] }]}>
									<Text style={styles.categoryName}>{categoryNames[id - 1]}</Text>
									<Text style={styles.categoryCount}>
										({id === 1 ? categoryCounts.x : id === 2 ? categoryCounts.y : categoryCounts.z})
									</Text>
								</View>
							</View>
						))}
					</View>
					<Text style={styles.instructionText}>拖动单词到上方分类区域</Text>
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
	},
	title: {
		fontSize: 16,
		color: '#333333',
		fontWeight: '600',
	},
	placeholder: {
		width: 50,
	},
	content: {
		flex: 1,
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
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 8,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		minHeight: 60,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	wordCardText: {
		fontSize: 14,
		color: '#333333',
		fontWeight: '600',
	},
	categorySection: {
		paddingHorizontal: 20,
		paddingVertical: 20,
		backgroundColor: '#FFFFFF',
	},
	categoryRow: {
		flexDirection: 'row',
		gap: 10,
	},
	categoryItem: {
		flex: 1,
	},
	categoryCard: {
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
	},
	categoryName: {
		fontSize: 16,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	categoryCount: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.8)',
		marginTop: 4,
	},
	instructionText: {
		fontSize: 12,
		color: '#999999',
		textAlign: 'center',
		marginTop: 12,
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
