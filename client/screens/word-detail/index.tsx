import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Comment {
	id: number;
	user: string;
	content: string;
}

export default function WordDetailPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ wordId?: number; word?: string; meaning?: string }>();
	const [isPlaying, setIsPlaying] = useState(false);
	const [comments] = useState<Comment[]>([
		{ id: 1, user: '润武子杰', content: '这垃圾是什么鬼，简直贻笑大方' },
		{ id: 2, user: 'cansniper', content: '简直完美，点赞' },
	]);

	// 根据单词生成音标
	const getPhonetic = (word: string | undefined) => {
		if (!word) return '/kɪˈɑːs/';
		// 简单的音标规则（实际应该从API获取）
		if (word === 'psyche') return '/ˈsaɪki/';
		if (word === 'tech') return '/tek/';
		if (word === 'fly') return '/flaɪ/';
		return '/' + word.charAt(0) + 'ɪˈɑːs/';
	};

	// 在线发音功能 - 使用有道词典 TTS
	const playPronunciation = async () => {
		if (isPlaying) return;
		
		const wordToPlay = params.word || 'chaos';
		setIsPlaying(true);
		
		try {
			// 配置音频模式
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});

			// 使用有道词典 TTS API（国内可访问）
			const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordToPlay)}&type=1`;
			
			const { sound } = await Audio.Sound.createAsync(
				{ uri: ttsUrl },
				{ shouldPlay: true }
			);

			// 播放完成后释放资源
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
						<Text style={styles.phoneticText}>{getPhonetic(params.word)}</Text>
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
					</View>
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
					<View style={styles.commentsHeader}>
						<Text style={styles.commentsTitle}>评论</Text>
						<TouchableOpacity>
							<Text style={styles.dropdownIcon}>▼</Text>
						</TouchableOpacity>
					</View>
					{comments.map((comment) => (
						<View key={comment.id} style={styles.commentItem}>
							<FontAwesome6 name="folder" size={16} color="#666" />
							<View style={styles.commentContent}>
								<Text style={styles.commentUser}>{comment.user}：</Text>
								<Text style={styles.commentText}>{comment.content}</Text>
							</View>
							<FontAwesome6 name="check" size={14} color="#999" />
						</View>
					))}
				</View>

				{/* Bottom Status Buttons */}
				<View style={styles.bottomSection}>
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

					{/* Instructions */}
					<View style={styles.instructionsSection}>
						<Text style={styles.instructionTitle}>注：</Text>
						<Text style={styles.instructionText}>
							1. 单击三个按钮选择性加入三个数据库
						</Text>
						<Text style={styles.instructionText}>
							2. 评论展示优先级：a. 用户自己的评论 b. 软件后台推荐的知识点 c. 赞数从高到低排列（用户可设置优先级）
						</Text>
						<Text style={styles.instructionText}>
							3. 点击{'"\\"'}可勾选别人的项目加入自己的词汇书，蝴蝶科技将会生成带自己笔记或者其他人优秀笔记甚至吐槽的内容的词汇书并付费打印邮寄给用户
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
		backgroundColor: '#E0E0E0',
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
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#FFFFFF',
	},
	wordInputContainer: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#E0E0E0',
		padding: 15,
	},
	wordText: {
		fontSize: 24,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '700',
	},
	phoneticText: {
		fontSize: 14,
		color: '#888888',
		fontFamily: 'serif',
		fontStyle: 'italic',
		marginTop: 5,
	},
	speakerButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#4A4A4A',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 15,
	},
	speakerIcon: {
		fontSize: 20,
	},
	meaningSection: {
		flexDirection: 'row',
		padding: 20,
		backgroundColor: '#FFFFFF',
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	meaningContent: {
		flex: 1,
	},
	meaningLabel: {
		fontSize: 14,
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
		color: '#D32F2F',
	},
	grayText: {
		color: '#888888',
	},
	collocationText: {
		marginTop: 10,
	},
	actionButtons: {
		justifyContent: 'center',
		gap: 10,
	},
	iconButton: {
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconButtonText: {
		fontSize: 18,
	},
	commentsSection: {
		margin: 20,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		padding: 15,
	},
	commentsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	commentsTitle: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	dropdownIcon: {
		fontSize: 12,
		color: '#888888',
	},
	commentItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	folderIcon: {
		fontSize: 14,
		marginRight: 10,
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
		fontWeight: '500',
	},
	commentText: {
		fontSize: 13,
		color: '#666666',
		fontFamily: 'serif',
	},
	checkIcon: {
		fontSize: 14,
		color: '#333333',
		marginLeft: 10,
	},
	bottomSection: {
		padding: 20,
	},
	statusButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	statusButton: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 6,
	},
	statusButtonText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
	},
	instructionsSection: {
		backgroundColor: '#FAFAFA',
		padding: 15,
	},
	instructionTitle: {
		fontSize: 13,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
		marginBottom: 8,
	},
	instructionText: {
		fontSize: 12,
		color: '#666666',
		fontFamily: 'serif',
		lineHeight: 18,
		marginBottom: 6,
	},
});
