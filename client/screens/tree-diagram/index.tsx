import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';

const SCREEN_W = Dimensions.get('window').width;
const API_BASE_URL = 'http://localhost:9091';

interface Node {
  id: string;
  label: string;
}

const nodes: Node[] = [
  { id: 'body', label: '身体部位' },
  { id: 'attribute', label: '属性特征' },
  { id: 'ability', label: '能力' },
  { id: 'emotion', label: '情绪' },
  { id: 'desire', label: '所欲' },
  { id: 'behavior', label: '行为与限制' },
  { id: 'age', label: '年龄' },
  { id: 'lineage', label: '谱系' },
  { id: 'human_group', label: '人类与群组' },
  { id: 'occupation', label: '职业及其他' },
];

const leftNodes = nodes.slice(0, 5);
const rightNodes = nodes.slice(5, 10);

const bodySubNodes: Node[] = [
  { id: 'head-neck', label: '头~颈' },
  { id: 'shoulder-belly', label: '肩~腹' },
  { id: 'legs-feet', label: '腿脚' },
];

interface CategoryWord {
  id: number;
  word: string;
  meaning: string;
}

export default function TreeDiagramPage() {
  const router = useSafeRouter();
  const [expandedBody, setExpandedBody] = useState(true);
  const [subWords, setSubWords] = useState<CategoryWord[]>([]);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const lastTapRef = useRef(0);
  const [lastTapNode, setLastTapNode] = useState<string | null>(null);

  const handleSubPress = useCallback((sub: Node) => {
    router.push('/subcategory-words', { table: '111', title: sub.label, from: 'mindmap' });
  }, [router]);

  const handleMainPress = useCallback((node: Node) => {
    if (node.id === 'body') {
      setExpandedBody((prev) => !prev);
      return;
    }
    Alert.alert('提示', `${node.label} 分类暂无数据`);
  }, []);

  const fetchCategoryWords = useCallback(async (tableName: string, title: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/${tableName}`);
      if (!response.ok) return;
      const data: CategoryWord[] = await response.json();
      let filtered = data;
      if (tableName === '111') {
        const [x1Res, y1Res, z1Res] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/wordbooks/x1`),
          fetch(`${API_BASE_URL}/api/v1/wordbooks/y1`),
          fetch(`${API_BASE_URL}/api/v1/wordbooks/z1`),
        ]);
        const [x1Data, y1Data, z1Data] = await Promise.all([
          x1Res.ok ? x1Res.json() : [],
          y1Res.ok ? y1Res.json() : [],
          z1Res.ok ? z1Res.json() : [],
        ]);
        const classifiedWords = new Set([
          ...(Array.isArray(x1Data) ? x1Data : []).map((w: CategoryWord) => w.word),
          ...(Array.isArray(y1Data) ? y1Data : []).map((w: CategoryWord) => w.word),
          ...(Array.isArray(z1Data) ? z1Data : []).map((w: CategoryWord) => w.word),
        ]);
        filtered = data.filter((w: CategoryWord) => !classifiedWords.has(w.word));
      }
      setSubWords(filtered);
      setSubTitle(title);
      setShowSubModal(true);
    } catch {
      // ignore
    }
  }, []);

  const handleDoublePress = useCallback((node: Node) => {
    if (node.id === 'body') {
      fetchCategoryWords('111', '身体部位');
      return;
    }
    Alert.alert('提示', `${node.label} 分类暂无数据`);
  }, [fetchCategoryWords]);

  const handleTap = useCallback((node: Node) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTapNode === node.id && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      setLastTapNode(null);
      handleDoublePress(node);
    } else {
      lastTapRef.current = now;
      setLastTapNode(node.id);
      setTimeout(() => {
        setLastTapNode((prev) => (prev === node.id ? null : prev));
      }, DOUBLE_TAP_DELAY + 50);
    }
  }, [lastTapNode, handleDoublePress]);

  const renderSideNode = useCallback((node: Node, index: number, isLeft: boolean, total: number) => {
    const nodeHeight = 50;
    const gap = (SCREEN_W - 160) / (total + 1);
    const topOffset = 60 + index * gap;

    return (
      <View
        key={node.id}
        style={[
          styles.sideNodeWrapper,
          isLeft ? { right: 70, top: topOffset } : { left: 70, top: topOffset },
        ]}
      >
        <TouchableOpacity
          style={styles.branchCard}
          onPress={() => handleTap(node)}
          activeOpacity={0.7}
        >
          <Text style={styles.branchCardText} numberOfLines={1}>
            {node.label}
          </Text>
        </TouchableOpacity>
        {/* 连接线 */}
        <View
          style={[
            styles.connectLine,
            isLeft
              ? {
                  right: -20,
                  width: 20,
                  top: nodeHeight / 2,
                  borderTopWidth: 2,
                  borderRightWidth: 0,
                  borderLeftWidth: 0,
                }
              : {
                  left: -20,
                  width: 20,
                  top: nodeHeight / 2,
                  borderTopWidth: 2,
                  borderRightWidth: 0,
                  borderLeftWidth: 0,
                },
          ]}
        />
      </View>
    );
  }, [handleTap]);

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <Text style={styles.title}>第一章</Text>

        <View style={styles.diagramArea}>
          {/* 中心节点 */}
          <View style={styles.centerNode}>
            <Text style={styles.centerLabel}>人</Text>
          </View>

          {/* 左侧节点 */}
          {leftNodes.map((node, idx) => renderSideNode(node, idx, true, leftNodes.length))}

          {/* 右侧节点 */}
          {rightNodes.map((node, idx) => renderSideNode(node, idx, false, rightNodes.length))}

          {/* 身体部位子节点 */}
          {expandedBody && (
            <View style={styles.subNodesContainer}>
              {bodySubNodes.map((sub, sIdx) => {
                const angle = -60 + sIdx * 60; // -60, 0, 60 degrees
                const rad = (angle * Math.PI) / 180;
                const distance = 90;
                const dx = Math.cos(rad) * distance;
                const dy = Math.sin(rad) * distance;
                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.subNodeWrapper,
                      {
                        left: SCREEN_W / 2 + dx - 50,
                        top: 220 + dy,
                      },
                    ]}
                  >
                    {/* 连接线 */}
                    <View
                      style={[
                        styles.subConnectLine,
                        {
                          width: distance - 50,
                          left: angle < 0 ? -(distance - 50) : -25,
                          top: 20,
                          transform: [{ rotate: `${-angle}deg` }],
                          transformOrigin: angle < 0 ? 'right' : 'left',
                        },
                      ]}
                    />
                    <TouchableOpacity
                      style={styles.subBranchCard}
                      onPress={() => handleSubPress(sub)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subBranchCardText} numberOfLines={1}>
                        {sub.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 子分类弹窗 */}
      <Modal visible={showSubModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{subTitle}</Text>
              <TouchableOpacity onPress={() => setShowSubModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalGrid}>
                {subWords.map((w) => (
                  <View key={w.id} style={styles.modalWordCard}>
                    <Text style={styles.modalWordText}>{w.word}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 20,
  },
  diagramArea: {
    width: SCREEN_W,
    height: 500,
    position: 'relative',
  },
  centerNode: {
    position: 'absolute',
    left: SCREEN_W / 2 - 50,
    top: 160,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 5,
  },
  centerLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sideNodeWrapper: {
    position: 'absolute',
    width: 110,
    height: 50,
    zIndex: 4,
  },
  branchCard: {
    width: 110,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  branchCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  connectLine: {
    position: 'absolute',
    height: 0,
    borderTopColor: '#9CA3AF',
    borderTopWidth: 2,
  },
  subNodesContainer: {
    position: 'absolute',
    width: SCREEN_W,
    height: 300,
    top: 200,
    left: 0,
    zIndex: 3,
  },
  subNodeWrapper: {
    position: 'absolute',
    width: 100,
    height: 44,
  },
  subBranchCard: {
    width: 100,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  subBranchCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  subConnectLine: {
    position: 'absolute',
    height: 0,
    borderTopColor: '#9CA3AF',
    borderTopWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  modalBody: {
    padding: 16,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalWordCard: {
    width: '31%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  modalWordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});