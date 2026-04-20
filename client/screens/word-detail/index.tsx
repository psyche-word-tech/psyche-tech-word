import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';

interface Comment {
	id: number;
	user: string;
	content: string;
}

interface WordData {
	phonetic: string;
	example: string;
}

export default function WordDetailPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ wordId?: number; word?: string; meaning?: string }>();
	const [isPlaying, setIsPlaying] = useState(false);
	const [wordData, setWordData] = useState<WordData | null>(null);
	const [comments] = useState<Comment[]>([
		{ id: 1, user: '润武子杰', content: '这垃圾是什么鬼，简直贻笑大方' },
		{ id: 2, user: 'cansniper', content: '简直完美，点赞' },
	]);

	// 从数据库获取单词完整信息（音标和例句）
	const fetchWordData = useCallback(async () => {
		if (!params.wordId) return;
		try {
			/**
			 * 服务端文件：server/src/routes/words.ts
			 * 接口：GET /api/v1/words
			 * 返回：words 数组包含 phonetic 和 example 字段
			 */
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words`);
			const result = await response.json();
			if (result.data) {
				const word = result.data.find((w: any) => w.id === params.wordId);
				if (word) {
					setWordData({
						phonetic: word.phonetic || '/暂无音标/',
						example: word.example || '暂无例句'
					});
				}
			}
		} catch (error) {
			console.error('Failed to fetch word data:', error);
		}
	}, [params.wordId]);

	// 页面返回时自动刷新数据
	useFocusEffect(
		useCallback(() => {
			fetchWordData();
		}, [fetchWordData])
	);

	// 在线发音功能 - 使用有道词典 TTS
	const playPronunciation = async () => {
		if (isPlaying) return;
		
		const wordToPlay = params.word || 'chaos';
		setIsPlaying(true);
		
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});

			const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordToPlay)}&type=1`;
				
			const { sound } = await Audio.Sound.createAsync(
				{ uri: ttsUrl },
				{ shouldPlay: true }
			);

			sound.setOnPlaybackStatusUpdate((status) => {
				if (status.isLoaded && status.didJustFinish) {
					sound.unloadAsync();
					setIsPlaying(false);
				}
			});
		} catch (error) {
			console.error('Failed to play pronunciation:', error);
			setIsPlaying(false);
		}
	};

	// 保存单词状态
	const handleStatusClick = async (status: 'x' | 'y' | 'z') => {
		const wordId = params.wordId;
		if (!wordId) {
			alert('单词ID不存在');
			return;
		}

		try {
			/**
			 * 服务端文件：server/src/routes/words.ts
			 * 接口：PUT /api/v1/words/:id/status
			 * Body 参数：status: string -- x=已会, y=模糊, z=不会
			 */
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${wordId}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			});

			const result = await response.json();
			if (result.success) {
				const statusNames = { x: '已会', y: '模糊', z: '不会' };
				alert(`已移入 ${statusNames[status]} 数据库`);
			} else {
				alert('保存失败');
			}
		} catch (error) {
			console.error('Failed to update status:', error);
			alert('网络错误，请重试');
		}
	};

	return (
		<Screen>
			<ScrollView style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>每日单词（a）</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Word & Pronunciation */}
				<View style={styles.wordSection}>
					<View style={styles.wordInputContainer}>
						<Text style={styles.wordText}>{params.word || 'chaos'}</Text>
						<Text style={styles.phoneticText}>{wordData?.phonetic || '加载中...'}</Text>
					</View>
					<TouchableOpacity style={styles.speakerButton} onPress={playPronunciation} disabled={isPlaying}>
						{isPlaying ? (
							<ActivityIndicator size="small" color="#666" />
						) : (
							<FontAwesome6 name="volume-off" size={24} color="#666" />
						)}
					</TouchableOpacity>
				</View>

				{/* Meaning & Actions */}
				<View style={styles.meaningSection}>
					<View style={styles.meaningContent}>
						<Text style={styles.meaningLabel}>释义：</Text>
						<Text style={styles.meaningText}>
							<Text style={styles.redText}>{params.meaning || '暂无释义'}</Text>
						</Text>
						<View style={styles.exampleSection}>
							<Text style={styles.exampleLabel}>例句：</Text>
							<Text style={styles.exampleText}>
								{wordData?.example || '加载中...'}
							</Text>
						</View>
					</View>

					{/* Action Buttons */}
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.iconButton}>
							<FontAwesome6 name="pen" size={18} color="#666" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.iconButton}>
							<FontAwesome6 name="check" size={18} color="#666" />
						</TouchableOpacity>
					</View>
				</View>

				{/* Comments */}
				<View style={styles.commentsSection}>
					<Text style={styles.commentsTitle}>评论区</Text>
					{comments.map((comment) => (
						<View key={comment.id} style={styles.commentItem}>
							<View style={styles.commentContent}>
								<Text style={styles.commentUser}>{comment.user}：</Text>
								<Text style={styles.commentText}>{comment.content}</Text>
							</View>
							<FontAwesome6 name="check" size={14} color="#999" />
						</View>
					))}
				</View>

				{/* Status Buttons */}
				<View style={styles.statusSection}>
					<View style={styles.statusButtons}>
						<TouchableOpacity style={styles.statusButton} onPress={() => handleStatusClick('x')}>
							<Text style={styles.statusButtonText}>已会（x）</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.statusButton} onPress={() => handleStatusClick('y')}>
							<Text style={styles.statusButtonText}>模糊（y）</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.statusButton} onPress={() => handleStatusClick('z')}>
							<Text style={styles.statusButtonText}>不会（z）</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.instructionContainer}>
						<Text style={styles.instructionText}>
							3. 点击&ldquo;\&quot;可勾选别人的项目加入自己的词汇书，蝴蝶科技将会生成带自己笔记或者其他人优秀笔记甚至吐槽的内容的词汇书并付费打印邮寄给用户
						</Text>
					</View>
				</View>
			</ScrollView>
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
	wordSection: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 30,
		backgroundColor: '#F5F5F5',
	},
	wordInputContainer: {
		alignItems: 'center',
		marginRight: 15,
	},
	wordText: {
		fontSize: 32,
		color: '#333333',
		fontFamily: 'serif',
		fontStyle: 'italic',
		fontWeight: '600',
	},
	phoneticText: {
		fontSize: 14,
		color: '#888888',
		fontFamily: 'serif',
		marginTop: 5,
	},
	speakerButton: {
		padding: 10,
	},
	meaningSection: {
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#E8E8E8',
	},
	meaningContent: {
		marginBottom: 15,
	},
	meaningLabel: {
		fontSize: 13,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		lineHeight: 22,
	},
	redText: {
		color: '#CC0000',
	},
	grayText: {
		color: '#888888',
	},
	collocationText: {
		marginTop: 10,
	},
	exampleSection: {
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#E8E8E8',
	},
	exampleLabel: {
		fontSize: 13,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
		marginBottom: 6,
	},
	exampleText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		lineHeight: 22,
	},
	greenText: {
		color: '#228B22',
	},
	exampleTranslation: {
		fontSize: 12,
		color: '#888888',
		fontFamily: 'serif',
		marginTop: 4,
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 10,
	},
	iconButton: {
		padding: 8,
	},
	commentsSection: {
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#E8E8E8',
	},
	commentsTitle: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
		marginBottom: 15,
	},
	commentItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
	},
	commentContent: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	commentUser: {
		fontSize: 13,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	commentText: {
		fontSize: 13,
		color: '#666666',
		fontFamily: 'serif',
	},
	statusSection: {
		padding: 20,
	},
	statusButtons: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 20,
		marginBottom: 20,
	},
	statusButton: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 4,
	},
	statusButtonText: {
		fontSize: 10,
		color: '#333333',
		fontFamily: 'serif',
	},
	instructionContainer: {
		padding: 15,
		backgroundColor: '#F8F8F8',
		borderRadius: 8,
	},
	instructionText: {
		fontSize: 11,
		color: '#999999',
		fontFamily: 'serif',
		lineHeight: 18,
	},
});
