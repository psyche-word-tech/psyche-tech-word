/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Word {
	id: number; word: string; meaning: string;
	phonetic?: string; example?: string; example_translation?: string; image_url?: string;
}

// ==================== 单词卡片 ====================
interface WordCardProps {
	word: Word;
	isSwipeMode: boolean;
	onLongPress: () => void;
	onPress: (word: Word) => void;
	onDrop: (wordId: number, categoryId: number) => void;
}

function WordCard({ word, isSwipeMode, onLongPress, onPress, onDrop }: WordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);
	const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearLP = useCallback(() => { if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; } }, []);

	// 滑动模式下：只响应点击；默认模式下：响应点击 + 垂直拖动 + 长按
	const pr = useMemo(() => PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
		onPanResponderTerminationRequest: () => true,

		onPanResponderGrant: () => {
			if (isSwipeMode) return;
			lpTimer.current = setTimeout(onLongPress, 350);
			pan.setOffset({ x: (pan.x as any)._value || 0, y: (pan.y as any)._value || 0 });
			pan.setValue({ x: 0, y: 0 });
		},

		onPanResponderMove: (_, gs) => {
			if (isSwipeMode) return;
			if (Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8) clearLP();
			pan.setValue({ x: gs.dx, y: gs.dy });
			if (Math.abs(gs.dy) > 15 && !isDragging) setIsDragging(true);
		},

		onPanResponderRelease: (_, gs) => {
			if (isSwipeMode) return;
			clearLP();

			// 小移动 → 点击进详情（两种模式都支持）
			if (!isDragging && Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8) { onPress(word); return; }

			setIsDragging(false);
			pan.flattenOffset();
			if (gs.dy > 80) {
				let cat = 3;
				if (gs.moveX < SCREEN_WIDTH / 3) cat = 1;
				else if (gs.moveX < SCREEN_WIDTH * 2 / 3) cat = 2;
				onDrop(word.id, cat);
			}
			Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
		},

		onPanResponderTerminate: () => {
			if (isSwipeMode) return;
			clearLP(); setIsDragging(false);
			pan.flattenOffset();
			Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
		},
	}), [isSwipeMode, onLongPress, onPress, onDrop, word, pan, isDragging, clearLP]);

	useEffect(() => () => clearLP(), [clearLP]);

	return (
		<Animated.View {...pr.panHandlers} style={[
			styles.wordItemContainer,
			{
				transform: [{ translateX: pan.x }, { translateY: pan.y }],
				opacity: isDragging ? 0.7 : 1, zIndex: isDragging ? 100 : 1,
				borderColor: isSwipeMode ? '#4CAF50' : '#E0E0E0',
				borderWidth: isSwipeMode ? 2 : 1,
			},
		]}>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={styles.wordCardText}>{word.word}</Text>
			</View>
		</Animated.View>
	);
}

// ==================== 主页面 ====================
export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const table = params.table || 'words_b';

	const [allWords, setAllWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [error, setError] = useState<string | null>(null);
	const [offset, setOffset] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const limit = 20;

	const [isSwipeMode, setIsSwipeMode] = useState(false);
	const swipeX = useRef(new Animated.Value(0)).current;

	const categoryColors = ['#4CAF50', '#FF9800', '#F44336'];
	const categoryNames = ['已会', '模糊', '不会'];
	const ITEM_W = 80, ITEM_G = 28, VISIBLE_N = 3, PADDING = 8;
	const VIEWPORT_W = VISIBLE_N * ITEM_W + (VISIBLE_N - 1) * ITEM_G + PADDING * 2; // 320

	// ===== 数据获取 =====
	const fetchWords = useCallback(async (off: number, append: boolean) => {
		setError(null);
		try {
			/**
			 * 服务端文件：server/src/routes/wordbooks.ts
			 * 接口：GET /api/v1/wordbooks/:table
			 * Query 参数：offset: number, limit: number
			 */
			const [wRes, xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/wordbooks/${table}?offset=${off}&limit=${limit}`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_x`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_y`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_z`),
			]);
			const wordsData = await wRes.json();
			const words = Array.isArray(wordsData) ? wordsData : [];
			const xData = await xRes.json(), yData = await yRes.json(), zData = await zRes.json();
			setAllWords(append ? prev => [...prev, ...words] : words);
			setHasMore(words.length === limit);
			setCategoryCounts({
				x: Array.isArray(xData) ? xData.length : 0,
				y: Array.isArray(yData) ? yData.length : 0,
				z: Array.isArray(zData) ? zData.length : 0,
			});
		} catch (e: any) { setError(e?.message || '网络请求失败'); }
	}, [table]);

	const fetchData = useCallback(() => { setOffset(0); fetchWords(0, false); }, [fetchWords]);
	useEffect(() => { const t = setTimeout(fetchData, 0); return () => clearTimeout(t); }, [fetchData]);
	useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore) return;
		setLoadingMore(true);
		const newOff = offset + limit;
		fetchWords(newOff, true).finally(() => { setOffset(newOff); setLoadingMore(false); });
	}, [hasMore, loadingMore, offset, fetchWords]);

	// 分类
	const handleDrop = useCallback(async (wid: number, cid: number) => {
		const map: Record<number, string> = { 1: 'words_x', 2: 'words_y', 3: 'words_z' };
		/** POST /api/v1/wordbooks/move body: sourceTable,targetTable,wordId */
		try { await fetch(`${API_BASE_URL}/api/v1/wordbooks/move`, { method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sourceTable: table, targetTable: map[cid], wordId: wid }),
		}); } catch (e) { console.error(e); }
		setAllWords(p => p.filter(w => w.id !== wid));
		setCategoryCounts(p => { const k = ['x','y','z'][cid-1] as 'x'|'y'|'z'; return {...p,[k]:p[k]+1}; });
	}, [table]);

	// 点击 → 详情页
	const goDetail = (w: Word) => router.push('/word-detail', {
		word: JSON.stringify({ id:w.id, word:w.word, phonetic:w.phonetic||'', meaning:w.meaning,
			example:w.example||'', example_translation:w.example_translation||'', image_url:w.image_url||'' }),
		table });

	// 长按 → 进入滑动模式
	const enterSwipe = useCallback(() => { setIsSwipeMode(true); swipeX.setValue(0); }, []);

	// 外层水平滑动 PanResponder（仅在滑动模式下生效）
	const swipePR = useRef(PanResponder.create({
		onStartShouldSetPanResponder: () => isSwipeMode,
		onMoveShouldSetPanResponder: (_, gs) => isSwipeMode && Math.abs(gs.dx) > 5,
		onPanResponderTerminationRequest: () => true,
		onPanResponderGrant: () => { swipeX.setOffset((swipeX as any)._value || 0); swipeX.setValue(0); },
		onPanResponderMove: (_, gs) => { swipeX.setValue(gs.dx); },
		onPanResponderRelease: (_, gs) => {
			swipeX.flattenOffset();
			const dx = gs.dx;
			if (dx < -60 && hasMore && !loadingMore) loadMore();
			Animated.timing(swipeX, { toValue: 0, duration: 200, useNativeDriver: false }).start();
		},
	})).current;

	// 默认显示3个，滑动模式显示全部
	const visibleWords = isSwipeMode ? allWords : allWords.slice(0, VISIBLE_N);

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.navigate('/my-vocabulary')}>
						<Text style={styles.backText}>back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>词汇预览</Text>
					<TouchableOpacity onPress={() => router.push('/calendar')}>
						<FontAwesome6 name="calendar-days" size={22} color="#333" />
					</TouchableOpacity>
				</View>

				{/* 内容 */}
				<View style={styles.centerContainer}>
					<View style={styles.content}>
						{error ? (
							<View style={styles.emptyContainer}>
								<Text style={styles.errorText}>加载失败: {error}</Text>
								<TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
									<Text style={styles.retryBtnText}>重新加载</Text>
								</TouchableOpacity>
							</View>
						) : (
							<>
								{/* 提示信息 */}
								<Text style={styles.remainingText}>剩余 {allWords.length} 个单词</Text>
								<Text style={[styles.hint, isSwipeMode && styles.hintActive]}>
									{isSwipeMode ? '← 左右滑动浏览 →' : '长按单词可滑动浏览'}
								</Text>

								{allWords.length > 0 ? (
									/* 固定宽度视口，overflow:hidden 裁切 */
									<View style={[styles.viewport, { width: VIEWPORT_W }]}>
										<Animated.View
											style={[styles.wordRow, isSwipeMode && { transform: [{ translateX: swipeX }] }]}
											{...(isSwipeMode ? swipePR.panHandlers : {})}
										>
											{visibleWords.map(w => (
												<WordCard key={w.id} word={w} isSwipeMode={isSwipeMode}
													onLongPress={enterSwipe} onPress={goDetail} onDrop={handleDrop}
												/>
											))}
										</Animated.View>
									</View>
								) : (
									<View style={styles.emptyContainer}>
										<Text style={styles.emptyText}>所有单词已分类完成！</Text>
										<TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
											<Text style={styles.retryBtnText}>重新加载</Text>
										</TouchableOpacity>
									</View>
								)}
							</>
						)}
					</View>

					{/* 分类区域 */}
					<View style={styles.catSection}>
						<View style={styles.catRow}>
							{[1,2,3].map(id => {
								const t = id===1?'words_x':id===2?'words_y':'words_z';
								return (<TouchableOpacity key={id} style={styles.catItem}
									onPress={() => router.push('/word-list',{table:t})}>
									<View style={[styles.catCard,{backgroundColor:categoryColors[id-1]}]}>
										<Text style={styles.catName}>{categoryNames[id-1]}</Text>
										<Text style={styles.catCount}>({[categoryCounts.x,categoryCounts.y,categoryCounts.z][id-1]})</Text>
									</View>
								</TouchableOpacity>);
							})}
						</View>
						<Text style={styles.instruction}>拖动单词到上方分类区域</Text>
					</View>
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#FFF' },
	header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, backgroundColor:'#E5E5E5' },
	backText: { fontSize:14, color:'#000' },
	title: { fontSize:16, color:'#333', fontWeight:'600' },
	centerContainer: { flex:1, justifyContent:'center', paddingHorizontal:20 },
	content: { paddingVertical:16, alignItems:'center', transform:[{translateY:-100}] },
	remainingText: { fontSize:14, color:'#999', marginBottom:2 },
	hint: { fontSize:12, color:'#AAA', marginBottom:10, textAlign:'center' },
	hintActive: { color:'#4CAF50', fontWeight:'600' },

	viewport: { height:52, overflow:'hidden', alignSelf:'center' },
	wordRow: { flexDirection:'row', gap:28, paddingHorizontal:8 },

	wordItemContainer: {
		width:80, backgroundColor:'#F0F0F0', borderRadius:12,
		paddingVertical:6, paddingHorizontal:8, alignItems:'center', justifyContent:'center',
		borderWidth:1, borderColor:'#E0E0E0',
	},
	wordCardText: { fontSize:13, color:'#1A1A1A', fontWeight:'700', letterSpacing:0.3 },

	catSection: { paddingVertical:10, backgroundColor:'#FFF' },
	catRow: { flexDirection:'row', gap:10 },
	catItem: { flex:1 },
	catCard: { paddingVertical:10, borderRadius:10, alignItems:'center' },
	catName: { fontSize:13, color:'#FFF', fontWeight:'600' },
	catCount: { fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:2 },
	instruction: { fontSize:11, color:'#999', textAlign:'center', marginTop:6 },

	emptyContainer: { padding:48, alignItems:'center' },
	emptyText: { fontSize:16, color:'#999' },
	errorText: { fontSize:14, color:'#E53935', marginBottom:12 },
	retryBtn: { backgroundColor:'#4CAF50', paddingHorizontal:20, paddingVertical:10, borderRadius:8 },
	retryBtnText: { color:'#FFF', fontSize:14, fontWeight:'600' },
});
