import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Audio } from 'expo-av';

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
					const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${sourceTable}`);
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
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/move`, {
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

					{/* Comment Section */}
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>评论区</Text>
						<View style={styles.commentItem}>
							<Text style={styles.commentId}>用户123</Text>
							<View style={styles.commentRow}>
								<Text style={styles.commentText}>很实用的单词</Text>
								<Ionicons name="checkmark" size={14} color="#999999" />
							</View>
						</View>
						<View style={styles.divider} />
						<View style={styles.commentItem}>
							<Text style={styles.commentId}>用户456</Text>
							<View style={styles.commentRow}>
								<Text style={styles.commentText}>收藏了</Text>
								<Ionicons name="checkmark" size={14} color="#999999" />
							</View>
						</View>
					</View>

					{/* Bottom Note */}
					<View style={styles.bottomNote}>
						<Text style={styles.noteText}>
							勾选图标表示该例句或评论已被作者采纳。{'\n'}
							付费可打印词汇书，详情请咨询客服。
						</Text>
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
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#E5E5E5',
	},
	backText: {
		fontSize: 14,
		color: '#666666',
		fontFamily: 'serif',
	},
	headerTitle: {
		fontSize: 16,
		color: '#666666',
		fontFamily: 'serif',
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
	},
	wordRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	wordText: {
		fontSize: 36,
		fontWeight: 'bold',
		color: '#333333',
		fontFamily: 'serif',
	},
	speakerIcon: {
		marginLeft: 12,
		padding: 8,
	},
	phoneticText: {
		fontSize: 16,
		color: '#999999',
		fontFamily: 'serif',
		marginTop: 8,
	},
	section: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	sectionLabel: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: 'bold',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 16,
		color: '#C8102E',
		fontFamily: 'serif',
		lineHeight: 24,
	},
	divider: {
		height: 1,
		backgroundColor: '#E5E5E5',
		marginTop: 12,
	},
	exampleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	exampleText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		flex: 1,
		lineHeight: 22,
	},
	exampleIcons: {
		flexDirection: 'row',
		gap: 8,
	},
	iconText: {
		fontSize: 16,
		color: '#999999',
	},
	commentItem: {
		paddingVertical: 8,
	},
	commentId: {
		fontSize: 12,
		color: '#666666',
		fontFamily: 'serif',
		marginBottom: 4,
	},
	commentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	commentText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
	},
	checkIcon: {
		fontSize: 14,
		color: '#999999',
	},
	statusSection: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
		paddingVertical: 20,
		paddingHorizontal: 16,
	},
	statusButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
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
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: 'bold',
	},
	bottomNote: {
		marginHorizontal: 16,
		marginBottom: 30,
		padding: 12,
		backgroundColor: '#F5F5F5',
		borderRadius: 8,
	},
	noteText: {
		fontSize: 12,
		color: '#999999',
		fontFamily: 'serif',
		lineHeight: 18,
	},
});
