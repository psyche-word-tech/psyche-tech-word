import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	Animated,
	Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { fetchWithRetry } from '@/utils/apiClient';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// 固定手机尺寸
const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 812;

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic: string;
	example?: string;
	example_translation?: string;
	translation?: string;
	image_url?: string;
}

const CATEGORY_CONFIG = {
	x: { label: '已会', color: '#4CAF50', route: '/known-words' as const },
	y: { label: '模糊', color: '#FF9800', route: '/vague-words' as const },
	z: { label: '不会', color: '#F44336', route: '/unknown-words' as const },
};

interface ButtonLayout {
	x: number;
	y: number;
	width: number;
	height: number;
}

// 每个单词卡片用的拖动逻辑
function DraggableWordCard({
	word,
	index,
	total,
	onClassify,
	onShowDetail,
	buttonLayouts,
}: {
	word: Word;
	index: number;
	total: number;
	onClassify: (word: Word, target: string) => void;
	onShowDetail: (word: Word) => void;
	buttonLayouts: React.MutableRefObject<Record<string, ButtonLayout>>;
}) {
	const translateX = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(0)).current;
	const [isDragging, setIsDragging] = useState(false);
	const [dropTarget, setDropTarget] = useState<string | null>(null);
	const cardRef = useRef<View>(null);
	const pressStartTime = useRef(0);
	const pressStartPos = useRef({ x: 0, y: 0 });

	// 检测卡片中心是否在按钮区域内
	const checkDropTarget = useCallback((): Promise<string | null> => {
		return new Promise((resolve) => {
			if (!cardRef.current) {
				resolve(null);
				return;
			}
			cardRef.current.measureInWindow((cardX, cardY, cardW, cardH) => {
				const centerX = cardX + cardW / 2;
				const centerY = cardY + cardH / 2;

				for (const [key, layout] of Object.entries(buttonLayouts.current)) {
					if (
						centerX >= layout.x &&
						centerX <= layout.x + layout.width &&
						centerY >= layout.y &&
						centerY <= layout.y + layout.height
					) {
						resolve(key);
						return;
					}
				}
				resolve(null);
			});
		});
	}, [buttonLayouts]);

	const onGestureEvent = Animated.event(
		[{ nativeEvent: { translationX: translateX, translationY: translateY } }],
		{ useNativeDriver: false }
	);

	const onHandlerStateChange = useCallback(
		(event: any) => {
			const { state, translationX, translationY, absoluteX, absoluteY } = event.nativeEvent;

			if (state === State.BEGAN) {
				pressStartTime.current = Date.now();
				pressStartPos.current = { x: absoluteX, y: absoluteY };
			}

			if (state === State.ACTIVE) {
				setIsDragging(true);
			}

			if (state === State.END || state === State.CANCELLED) {
				setIsDragging(false);
				const duration = Date.now() - pressStartTime.current;
				const moved = Math.abs(translationX) > 8 || Math.abs(translationY) > 8;

				// 短按 = 显示详情
				if (!moved && duration < 250) {
					setDropTarget(null);
					onShowDetail(word);
					return;
				}

				// 向下拖动 = 分类
				if (translationY > 60) {
					checkDropTarget().then((target) => {
						setDropTarget(null);
						if (target) {
							onClassify(word, target);
						} else {
							// 回弹
							Animated.parallel([
								Animated.spring(translateX, { toValue: 0, useNativeDriver: false, friction: 5 }),
								Animated.spring(translateY, { toValue: 0, useNativeDriver: false, friction: 5 }),
							]).start();
						}
					});
					return;
				}

				// 回弹
				setDropTarget(null);
				Animated.parallel([
					Animated.spring(translateX, { toValue: 0, useNativeDriver: false, friction: 5 }),
					Animated.spring(translateY, { toValue: 0, useNativeDriver: false, friction: 5 }),
				]).start();
			}
		},
		[word, onClassify, onShowDetail, checkDropTarget, translateX, translateY]
	);

	return (
		<PanGestureHandler
			onGestureEvent={onGestureEvent}
			onHandlerStateChange={onHandlerStateChange}
		>
			<Animated.View
				ref={cardRef}
				style={[
					styles.wordCard,
					isDragging && styles.wordCardDragging,
					{
						transform: [
							{ translateX },
							{ translateY },
							{ scale: isDragging ? 1.05 : 1 },
						],
						opacity: isDragging ? 0.95 : 1,
						zIndex: isDragging ? 100 : 1,
					},
				]}
			>
				<View style={styles.cardHeader}>
					<Text style={styles.indexText}>{index + 1} / {total}</Text>
				</View>

				<Text style={styles.wordText}>{word.word}</Text>
				<Text style={styles.phoneticText}>{word.phonetic}</Text>
				<Text style={styles.meaningText}>{word.meaning}</Text>

				{word.example && (
					<View style={styles.exampleSection}>
						<View style={styles.divider} />
						<Text style={styles.exampleText}>{word.example}</Text>
						{word.example_translation && (
							<Text style={styles.exampleTranslation}>{word.example_translation}</Text>
						)}
					</View>
				)}

				{isDragging && dropTarget && (
					<View style={[styles.dropHint, { backgroundColor: CATEGORY_CONFIG[dropTarget as keyof typeof CATEGORY_CONFIG].color }]}>
						<Text style={styles.dropHintText}>
							松手放入「{CATEGORY_CONFIG[dropTarget as keyof typeof CATEGORY_CONFIG].label}」
						</Text>
					</View>
				)}
			</Animated.View>
		</PanGestureHandler>
	);
}

export default function WordPreviewPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ category?: string; categoryId?: string }>();
	const [words, setWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 按钮布局缓存
	const buttonRefs = useRef<Record<string, View | null>>({ x: null, y: null, z: null });
	const buttonLayouts = useRef<Record<string, ButtonLayout>>({});

	// 测量按钮位置
	const measureButtons = useCallback(() => {
		Object.entries(buttonRefs.current).forEach(([key, ref]) => {
			if (ref) {
				ref.measureInWindow((x, y, width, height) => {
					buttonLayouts.current[key] = { x, y, width, height };
				});
			}
		});
	}, []);

	useEffect(() => {
		// 延迟测量，确保布局完成
		const timer = setTimeout(measureButtons, 500);
		return () => clearTimeout(timer);
	}, [measureButtons, categoryCounts]);

	// 窗口大小变化时重新测量
	useEffect(() => {
		const sub = Dimensions.addEventListener('change', () => {
			setTimeout(measureButtons, 300);
		});
		return () => sub?.remove();
	}, [measureButtons]);

	// 获取单词
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
		} catch (error: any) {
			console.error('Failed to fetch words:', error);
			setError(error.message || '获取单词列表失败');
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
		} catch (error) {
			console.error('Failed to fetch category counts:', error);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts])
	);

	// 分类单词
	const handleClassify = useCallback(async (word: Word, targetTable: string) => {
		try {
			const response = await fetchWithRetry(`/api/v1/user-words/classify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					wordId: word.id,
					targetTable: targetTable,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || '移动失败');
			}

			// 从列表中移除
			setWords(prev => prev.filter(w => w.id !== word.id));
			fetchCategoryCounts();
		} catch (error) {
			console.error('Failed to move word:', error);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [fetchCategoryCounts]);

	// 点击显示详情
	const handleShowDetail = useCallback((word: Word) => {
		router.push('/word-detail', { word });
	}, [router]);

	// 当前显示的3个单词
	const displayWords = words.slice(0, 3);
	const remainingCount = Math.max(0, words.length - 3);

	const headerSubtitle = params.category
		? `${params.category} · ${words.length} 个单词`
		: `${words.length} 个单词待分类`;

	const navigateToCategory = useCallback((route: string) => {
		router.push(route);
	}, [router]);

	return (
		<Screen>
			<View style={styles.phoneWrapper}>
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity
							style={styles.backButton}
							onPress={() => {
								if (router.canGoBack && router.canGoBack()) {
									router.back();
								} else {
									router.replace('/');
								}
							}}
							activeOpacity={0.6}
						>
							<FontAwesome6 name="arrow-left" size={18} color="#1F2937" />
						</TouchableOpacity>
						<View style={styles.headerLeft}>
							<Text style={styles.headerTitle}>词汇预览</Text>
							<Text style={styles.headerCount}>
								{isLoading ? '加载中...' : headerSubtitle}
							</Text>
						</View>
						<TouchableOpacity style={styles.refreshButton} onPress={fetchWords}>
							<Text style={styles.refreshText}>刷新</Text>
						</TouchableOpacity>
					</View>

					{/* Word Cards - Fixed 3 cards */}
					<View style={styles.cardsSection}>
						{displayWords.length > 0 ? (
							<View style={styles.cardsRow}>
								{displayWords.map((word, index) => (
									<DraggableWordCard
										key={word.id}
										word={word}
										index={index}
										total={words.length}
										onClassify={handleClassify}
										onShowDetail={handleShowDetail}
										buttonLayouts={buttonLayouts}
									/>
									))}
									{displayWords.length < 3 &&
										Array.from({ length: 3 - displayWords.length }).map((_, i) => (
											<View key={`placeholder-${i}`} style={[styles.wordCard, styles.placeholderCard]} />
										))}
								</View>
							) : (
								<View style={styles.emptyContainer}>
									{error ? (
										<Text style={styles.errorText}>加载失败: {error}</Text>
									) : (
										<Text style={styles.emptyText}>所有单词已分类完成！</Text>
									)}
								</View>
							)}

							{remainingCount > 0 && (
								<Text style={styles.remainingText}>
									还有 {remainingCount} 个单词待分类
								</Text>
							)}
						</View>

					{/* Action Buttons - Drop Targets */}
					{displayWords.length > 0 && (
						<View style={styles.actionSection}>
							<Text style={styles.actionHint}>拖动单词到下方按钮分类，长按按钮查看列表</Text>
							<View style={styles.actionRow}>
								{(Object.entries(CATEGORY_CONFIG) as [string, { label: string; color: string; route: string }][]).map(
									([key, config]) => (
										<TouchableOpacity
											key={key}
											ref={(ref) => { buttonRefs.current[key] = ref; }}
											style={[styles.actionButton, { backgroundColor: config.color }]}
											onLongPress={() => navigateToCategory(config.route)}
											delayLongPress={600}
											activeOpacity={0.8}
										>
											<Text style={styles.actionButtonText}>{config.label}</Text>
											<Text style={styles.actionButtonCount}>
												({categoryCounts[key as keyof typeof categoryCounts]})
											</Text>
										</TouchableOpacity>
									)
									)}
							</View>
						</View>
					)}
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	phoneWrapper: {
		flex: 1,
		backgroundColor: '#1F2937',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
	},
	container: {
		width: PHONE_WIDTH,
		maxHeight: PHONE_HEIGHT,
		flex: 1,
		backgroundColor: '#F3F4F6',
		borderRadius: 40,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 20,
	},
	header: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		flexDirection: 'row',
		alignItems: 'center',
	},
	backButton: {
		padding: 6,
		marginRight: 10,
	},
	headerLeft: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1F2937',
	},
	headerCount: {
		fontSize: 13,
		color: '#9CA3AF',
		marginTop: 2,
	},
	refreshButton: {
		backgroundColor: '#3B82F6',
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 8,
	},
	refreshText: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '600',
	},
	cardsSection: {
		flex: 1,
		paddingHorizontal: 12,
		paddingTop: 16,
	},
	cardsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
	wordCard: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 4,
		minHeight: 280,
		maxWidth: (PHONE_WIDTH - 40) / 3,
	},
	wordCardDragging: {
		shadowOpacity: 0.2,
		shadowRadius: 16,
		elevation: 12,
	},
	placeholderCard: {
		backgroundColor: '#E5E7EB',
		opacity: 0.5,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginBottom: 8,
	},
	indexText: {
		fontSize: 11,
		color: '#9CA3AF',
		fontWeight: '500',
	},
	wordText: {
		fontSize: 22,
		fontWeight: '800',
		color: '#1F2937',
		textAlign: 'center',
		marginTop: 4,
	},
	phoneticText: {
		fontSize: 12,
		color: '#6B7280',
		marginTop: 6,
		textAlign: 'center',
	},
	meaningText: {
		fontSize: 13,
		color: '#3B82F6',
		marginTop: 12,
		textAlign: 'center',
		lineHeight: 20,
		fontWeight: '500',
	},
	exampleSection: {
		marginTop: 16,
	},
	divider: {
		height: 1,
		backgroundColor: '#E5E7EB',
		marginBottom: 10,
	},
	exampleText: {
		fontSize: 11,
		color: '#9CA3AF',
		lineHeight: 18,
		textAlign: 'center',
		fontStyle: 'italic',
	},
	exampleTranslation: {
		fontSize: 10,
		color: '#9CA3AF',
		lineHeight: 16,
		textAlign: 'center',
		marginTop: 4,
	},
	dropHint: {
		marginTop: 12,
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 6,
		alignItems: 'center',
	},
	dropHintText: {
		fontSize: 11,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	remainingText: {
		fontSize: 13,
		color: '#9CA3AF',
		textAlign: 'center',
		marginTop: 12,
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#9CA3AF',
		textAlign: 'center',
	},
	errorText: {
		fontSize: 14,
		color: '#EF4444',
		marginBottom: 8,
		textAlign: 'center',
	},
	actionSection: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 18,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 10,
		marginTop: 'auto',
	},
	actionHint: {
		fontSize: 12,
		color: '#9CA3AF',
		textAlign: 'center',
		marginBottom: 14,
	},
	actionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 14,
		alignItems: 'center',
		borderWidth: 2,
		borderColor: 'transparent',
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	actionButtonCount: {
		fontSize: 13,
		color: '#FFFFFF',
		opacity: 0.8,
		marginTop: 2,
	},
});
