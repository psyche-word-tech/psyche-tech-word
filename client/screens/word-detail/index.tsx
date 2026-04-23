import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
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

interface Comment {
	id: number;
	word_id: number;
	word_text: string;
	user_name: string;
	content: string;
	created_at: string;
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

	// 评论相关状态
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentText, setCommentText] = useState('');
	const [isLoadingComments, setIsLoadingComments] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	// 获取评论列表
	const fetchComments = useCallback(async (wordId: number) => {
		if (!wordId) return;
		setIsLoadingComments(true);
		try {
			/**
			 * 服务端文件：server/src/routes/comments.ts
			 * 接口：GET /api/v1/comments/:wordId
			 */
			const response = await fetch(`${API_BASE_URL}/api/v1/comments/${wordId}`);
			const data = await response.json();
			setComments(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Failed to fetch comments:', error);
			setComments([]);
		} finally {
			setIsLoadingComments(false);
		}
	}, []);

	// 提交评论
	const submitComment = useCallback(async () => {
		if (!commentText.trim() || !word.id) {
			Alert.alert('提示', '请输入评论内容');
			return;
		}
		
		setIsSubmitting(true);
		try {
			/**
			 * 服务端文件：server/src/routes/comments.ts
			 * 接口：POST /api/v1/comments
			 * Body参数：wordId: number, wordText: string, userName: string, content: string
			 */
			const response = await fetch(`${API_BASE_URL}/api/v1/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					wordId: word.id,
					wordText: word.word,
					userName: '用户',
					content: commentText.trim()
				})
			});
			
			if (!response.ok) throw new Error('提交失败');
			
			setCommentText('');
			fetchComments(word.id);
			Alert.alert('成功', '评论已发布');
		} catch (error) {
			console.error('Failed to submit comment:', error);
			Alert.alert('错误', '评论发布失败');
		} finally {
			setIsSubmitting(false);
		}
	}, [commentText, word.id, word.word, fetchComments]);

	// 当单词变化时获取评论
	useEffect(() => {
		if (word.id) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			fetchComments(word.id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [word.id]);

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
				} else {
					router.back();
				}
			}
		} catch (error) {
			console.error('Failed to move word:', error);
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
						<Text style={styles.commentsLabel}>写作&笔记 ({comments.length})</Text>
						
						{/* 评论输入框 */}
						<View style={styles.commentInputContainer}>
							<TextInput
								style={styles.commentInput}
								placeholder="写下你的评论..."
								placeholderTextColor="#999"
								value={commentText}
								onChangeText={setCommentText}
								multiline
								maxLength={500}
							/>
							<TouchableOpacity 
								style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
								onPress={submitComment}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<ActivityIndicator size="small" color="#FFF" />
								) : (
									<Text style={styles.submitButtonText}>发布</Text>
								)}
							</TouchableOpacity>
						</View>
						
						{/* 评论列表 */}
						{isLoadingComments ? (
							<ActivityIndicator size="small" color="#4F46E5" style={styles.commentsLoading} />
						) : comments.length === 0 ? (
							<Text style={styles.noComments}>暂无笔记，来写点什么吧</Text>
						) : (
							<ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
								{comments.map((comment) => (
									<View key={comment.id} style={styles.commentItem}>
										<View style={styles.commentHeader}>
											<Text style={styles.commentUserName}>{comment.user_name}</Text>
											<Text style={styles.commentDate}>
												{new Date(comment.created_at).toLocaleDateString('zh-CN')}
											</Text>
										</View>
										<Text style={styles.commentContent}>{comment.content}</Text>
									</View>
								))}
							</ScrollView>
						)}
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
		marginBottom: 16,
	},
	commentInput: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		minHeight: 60,
		textAlignVertical: 'top',
	},
	submitButton: {
		backgroundColor: '#4F46E5',
		borderRadius: 6,
		paddingVertical: 10,
		paddingHorizontal: 20,
		alignSelf: 'flex-end',
		marginTop: 10,
	},
	submitButtonDisabled: {
		backgroundColor: '#A5A5A5',
	},
	submitButtonText: {
		color: '#FFF',
		fontSize: 14,
		fontWeight: '600',
	},
	commentsList: {
		maxHeight: 200,
	},
	commentsLoading: {
		marginVertical: 20,
	},
	noComments: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
		textAlign: 'center',
		paddingVertical: 20,
	},
	commentItem: {
		backgroundColor: '#F9F9F9',
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
	},
	commentHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	commentUserName: {
		fontSize: 13,
		fontWeight: '600',
		color: '#4F46E5',
		fontFamily: 'serif',
	},
	commentDate: {
		fontSize: 11,
		color: '#999999',
		fontFamily: 'serif',
	},
	commentContent: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		lineHeight: 20,
	},
});
