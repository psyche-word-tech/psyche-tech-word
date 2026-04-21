import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { API_BASE_URL } from '@/utils/apiConfig';

interface Word {
	id: number;
	word: string;
	phonetic: string;
	meaning: string;
	example?: string;
}

export default function WordDetailPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ word: string; table?: string }>();
	
	const [word, setWord] = useState<Word>(() => {
		if (params.word) {
			return JSON.parse(params.word);
		}
		return { id: 0, word: '', phonetic: '', meaning: '' };
	});
	const [currentIndex, setCurrentIndex] = useState(0);
	const [wordsList, setWordsList] = useState<Word[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [familiarity, setFamiliarity] = useState(50); // 0-100, 0=完全不熟悉, 100=非常熟悉

	const sourceTable = params.table || 'words_b';
	const isInitialized = useRef(false);
	const soundRef = useRef<Audio.Sound | null>(null);

	// 页面加载时获取单词列表
	useFocusEffect(
		useCallback(() => {
			const fetchWordsList = async () => {
				try {
					/**
					 * 服务端文件：server/src/routes/wordbooks.ts
					 * 接口：GET /api/v1/wordbooks/:table
					 */
					const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/${sourceTable}`);
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0 && !isInitialized.current) {
						setWordsList(data);
						isInitialized.current = true;
					}
				} catch (error) {
					console.error('Failed to fetch words:', error);
				}
			};
			fetchWordsList();
		}, [sourceTable])
	);

	// 清理音频资源
	useEffect(() => {
		return () => {
			if (soundRef.current) {
				soundRef.current.unloadAsync();
			}
		};
	}, []);

	const handlePronounce = async () => {
		if (!word.word || isPlaying) return;
		
		try {
			setIsPlaying(true);
			
			// 先停止之前的音频
			if (soundRef.current) {
				await soundRef.current.unloadAsync();
			}
			
			// 使用有道词典API发音
			const pronunciationUrl = `https://dict.youdao.com/dictvoice?type=1&word=${encodeURIComponent(word.word)}`;
			
			const { sound } = await Audio.Sound.createAsync(
				{ uri: pronunciationUrl },
				{ shouldPlay: true }
			);
			soundRef.current = sound;
			
			// 播放结束后清理
			sound.setOnPlaybackStatusUpdate((status) => {
				if (status.isLoaded && status.didJustFinish) {
					setIsPlaying(false);
					sound.unloadAsync();
				}
			});
		} catch (error) {
			console.error('Failed to play pronunciation:', error);
			setIsPlaying(false);
			Alert.alert('错误', '发音播放失败');
		}
	};

	const handleStatusChange = async (targetTable: string, label: string) => {
		try {
			/**
			 * 服务端文件：server/src/routes/wordbooks.ts
			 * 接口：POST /api/v1/wordbooks/move
			 * Body 参数：sourceTable: string, targetTable: string, wordId: number
			 */
			const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceTable: sourceTable,
					targetTable: targetTable,
					wordId: word.id
				}),
			});

			const result = await response.json();

			if (result.success) {
				// 从列表中移除当前单词
				const newList = wordsList.filter(w => w.id !== word.id);
				setWordsList(newList);

				// 显示下一个单词
				if (newList.length > 0) {
					const nextIndex = currentIndex < newList.length ? currentIndex : 0;
					setCurrentIndex(nextIndex);
					setWord(newList[nextIndex]);
					Alert.alert('成功', `单词已移至"${label}"，显示下一个单词`);
				} else {
					Alert.alert('完成', `单词已移至"${label}"，该列表已无更多单词`, [
						{ text: '确定', onPress: () => router.back() }
					]);
				}
			} else {
				Alert.alert('失败', result.error || '移动失败');
			}
		} catch (error) {
			console.error('Failed to move word:', error);
			Alert.alert('错误', '移动失败，请重试');
		}
	};

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>每日单词(a)</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Word Display */}
					<View style={styles.wordSection}>
						<View style={styles.wordRow}>
							<Text style={styles.wordText}>{word.word}</Text>
							<TouchableOpacity onPress={handlePronounce} style={styles.speakerIcon}>
								<Ionicons name="volume-high" size={24} color="#999999" />
							</TouchableOpacity>
						</View>
						<Text style={styles.phoneticText}>{word.phonetic}</Text>
					</View>

					{/* Meaning Section */}
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>释义：</Text>
						<Text style={styles.meaningText}>{word.meaning}</Text>
						<View style={styles.divider} />
					</View>

					{/* Example Section */}
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>例句：</Text>
						<View style={styles.exampleRow}>
							<Text style={styles.exampleText}>
								{word.example || `The word "${word.word}" has a meaning.`}
							</Text>
							<View style={styles.exampleIcons}>
								<Ionicons name="pencil" size={16} color="#999999" />
								<Ionicons name="checkmark" size={16} color="#999999" />
							</View>
						</View>
					</View>

					{/* Status Buttons */}
					<View style={styles.statusSection}>
						<TouchableOpacity style={[styles.statusButton, styles.knownButton]} onPress={() => handleStatusChange('words_x', '已会')}>
							<Text style={styles.statusText}>已会(x)</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.statusButton, styles.vagueButton]} onPress={() => handleStatusChange('words_y', '模糊')}>
							<Text style={styles.statusText}>模糊(y)</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.statusButton, styles.unknownButton]} onPress={() => handleStatusChange('words_z', '不会')}>
							<Text style={styles.statusText}>不会(z)</Text>
						</TouchableOpacity>
					</View>

					{/* Familiarity Slider */}
					<View style={styles.sliderSection}>
						<Text style={styles.sliderLabel}>熟悉度：{familiarity}%</Text>
						<View style={styles.sliderLabels}>
							<Text style={styles.sliderMinText}>最不熟悉</Text>
							<Text style={styles.sliderMaxText}>最熟悉</Text>
						</View>
						<Slider
							style={styles.slider}
							minimumValue={0}
							maximumValue={100}
							value={familiarity}
							onValueChange={(value) => setFamiliarity(Math.round(value))}
							minimumTrackTintColor="#4CAF50"
							maximumTrackTintColor="#E0E0E0"
							thumbTintColor="#4CAF50"
						/>
					</View>

					{/* Comments Section */}
					<View style={styles.commentsSection}>
						<Text style={styles.commentsLabel}>评论区</Text>
						<View style={styles.commentInputContainer}>
							<Text style={styles.placeholderText}>添加评论...</Text>
						</View>
					</View>
				</ScrollView>
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
		backgroundColor: '#F5F5F5',
	},
	backText: {
		fontSize: 14,
		color: '#666666',
		fontFamily: 'serif',
	},
	headerTitle: {
		fontSize: 16,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	placeholder: {
		width: 50,
	},
	content: {
		flex: 1,
	},
	wordSection: {
		alignItems: 'center',
		paddingVertical: 40,
		backgroundColor: '#FAFAFA',
	},
	wordRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	wordText: {
		fontSize: 36,
		fontWeight: '700',
		color: '#333333',
		fontFamily: 'Times New Roman',
		textAlign: 'center',
	},
	speakerIcon: {
		padding: 8,
	},
	phoneticText: {
		fontSize: 18,
		color: '#666666',
		fontFamily: 'Times New Roman',
		marginTop: 8,
	},
	section: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333333',
		fontFamily: 'serif',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		lineHeight: 22,
	},
	divider: {
		height: 1,
		backgroundColor: '#EEEEEE',
		marginTop: 16,
	},
	exampleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	exampleText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'Times New Roman',
		fontStyle: 'italic',
		flex: 1,
	},
	exampleIcons: {
		flexDirection: 'row',
		gap: 12,
		marginLeft: 12,
	},
	statusSection: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 20,
		paddingHorizontal: 20,
	},
	statusButton: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
		minWidth: 90,
		alignItems: 'center',
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
	statusText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	sliderSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: '#EEEEEE',
	},
	sliderLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333333',
		fontFamily: 'serif',
		marginBottom: 8,
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	sliderMinText: {
		fontSize: 12,
		color: '#999999',
		fontFamily: 'serif',
	},
	sliderMaxText: {
		fontSize: 12,
		color: '#999999',
		fontFamily: 'serif',
	},
	slider: {
		width: '100%',
		height: 40,
	},
	commentsSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: '#EEEEEE',
	},
	commentsLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333333',
		fontFamily: 'serif',
		marginBottom: 12,
	},
	commentInputContainer: {
		backgroundColor: '#F5F5F5',
		borderRadius: 8,
		padding: 12,
		minHeight: 80,
		justifyContent: 'flex-start',
	},
	placeholderText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
});
