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
// 三种手势：水平滑动浏览 / 垂直拖动分类 / 点击进详情
interface WordCardProps {
	word: Word;
	onPress: (word: Word) => void;
	onDrop: (wordId: number, categoryId: number) => void;
	onHorizontalDrag: (dx: number) => void; // 水平拖动时通知父组件
}

function WordCard({ word, onPress, onDrop, onHorizontalDrag }: WordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);
	const dragType = useRef<'horizontal' | 'vertical' | null>(null);

	const pr = useMemo(() => PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
		onPanResponderTerminationRequest: () => true,

		onPanResponderGrant: () => {
			dragType.current = null;
			setIsDragging(false);
			pan.setOffset({ x: (pan.x as any)._value || 0, y: (pan.y as any)._value || 0 });
			pan.setValue({ x: 0, y: 0 });
		},

		onPanResponderMove: (_, gs) => {
			const adx = Math.abs(gs.dx), ady = Math.abs(gs.dy);

			// 首次判定方向：水平优先
			if (!dragType.current) {
				if (adx > 8 && adx > ady * 0.6) {
					dragType.current = 'horizontal'; // 水平滑动
				} else if (ady > 20) {
					dragType.current = 'vertical'; // 垂直拖动分类
				}
			}

			if (dragType.current === 'horizontal') {
				// 水平滑动 → 通知父组件移动整行
				pan.setValue({ x: 0, y: 0 }); // 卡片本身不移动
				onHorizontalDrag(gs.dx);
			} else if (dragType.current === 'vertical') {
				// 垂直拖动分类
				pan.setValue({ x: gs.dx, y: gs.dy });
				if (ady > 15 && !isDragging) setIsDragging(true);
			} else {
				// 未确定方向时轻微跟随
				pan.setValue({ x: gs.dx * 0.3, y: gs.dy * 0.3 });
			}
		},

		onPanResponderRelease: (_, gs) => {
			if (dragType.current === 'horizontal') {
				// 水平释放 → 由父组件处理吸附逻辑（onHorizontalEnd）
				onHorizontalDrag(999); // 特殊值标记结束
			} else if (dragType.current === 'vertical') {
				// 垂直释放
				setIsDragging(false);
				pan.flattenOffset();
				if (gs.dy > 80) {
					let cat = 3;
					if (gs.moveX < SCREEN_WIDTH / 3) cat = 1;
					else if (gs.moveX < SCREEN_WIDTH * 2 / 3) cat = 2;
					onDrop(word.id, cat);
				}
				Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
			} else {
				// 小移动 → 视为点击
				pan.flattenOffset();
				Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
				onPress(word);
			}
			dragType.current = null;
		},

		onPanResponderTerminate: () => {
			dragType.current = null;
			setIsDragging(false);
			pan.flattenOffset();
			Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
		},
	}), [word, onPress, onDrop, onHorizontalDrag]);

	return (
		<Animated.View {...pr.panHandlers} style={[
			styles.wordItemContainer,
			{
				transform: [{ translateX: pan.x }, { translateY: pan.y }],
				opacity: isDragging ? 0.7 : 1,
				zIndex: isDragging ? 100 : 1,
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

	// 整行水平位移控制
	const scrollX = useRef(new Animated.Value(0)).current;
	const maxScrollX = useRef(0);

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

	// 计算最大可滚动距离
	useEffect(() => {
		if (allWords.length <= VISIBLE_N) { maxScrollX.current = 0; return; }
		const totalW = allWords.length * ITEM_W + (allWords.length - 1) * ITEM_G + PADDING * 2;
		maxScrollX.current = Math.max(0, totalW - VIEWPORT_W);
	}, [allWords.length]);

	// 子卡片水平拖动回调
	const handleHorizontalDrag = useCallback((dx: number) => {
		const currentX = (scrollX as any)._value || 0;
		if (dx === 999) {
			// 结束标记 → 吸附回当前页
			Animated.timing(scrollX, { toValue: currentX, duration: 150, useNativeDriver: false }).start();
			return;
		}
		const newX = currentX + dx;
		scrollX.setValue(Math.max(-maxScrollX.current, Math.min(0, newX)));
	}, [scrollX]);

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.navigate('/my-vocabulary')}>
						<Text style={styles.backText}>Back</Text>
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
								<Text style={styles.hint}>按住左右滑动 · 点击查看详情 · 下拉分类</Text>

								{allWords.length > 0 ? (
									<View style={[styles.viewport, { width: VIEWPORT_W }]}>
										<Animated.View style={[styles.wordRow, { transform: [{ translateX: scrollX }] }]}>
											{allWords.map(w => (
												<WordCard key={w.id} word={w}
													onPress={goDetail} onDrop={handleDrop} onHorizontalDrag={handleHorizontalDrag}
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
