import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';

interface Word {
	id: number;
	word: string;
	phonetic: string;
	meaning: string;
}

export default function WordDetailPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ word: string }>();
	
	const [word, setWord] = useState<Word>(() => {
		if (params.word) {
			return JSON.parse(params.word);
		}
		return { id: 0, word: '', phonetic: '', meaning: '' };
	});

	const handlePronounce = () => {
		// 发音功能
		console.log('Pronounce:', word.word);
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
								Education gives you an {word.word} in life.
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

					{/* Status Buttons */}
					<View style={styles.statusSection}>
						<TouchableOpacity style={styles.statusButton}>
							<Text style={styles.statusText}>已会(x)</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.statusButton}>
							<Text style={styles.statusText}>模糊(y)</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.statusButton}>
							<Text style={styles.statusText}>不会(z)</Text>
						</TouchableOpacity>
					</View>

					{/* Bottom Note */}
					<View style={styles.bottomNote}>
						<Text style={styles.noteText}>
							勾选图标表示该例句或评论已被作者采纳。{'\n'}
							付费可打印词汇书，详情请咨询客服。
						</Text>
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
		backgroundColor: '#E5E5E5',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	statusText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
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
